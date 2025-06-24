import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";
import { showUniqueError, showUniqueSuccess, showUniqueWarning, showUniqueInfo } from "../../utils/toastManager";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";
import moment from "moment";
const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
        setIsAuth(true);
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (error?.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;

        const { data } = await api.post("/auth/refresh_token");
        if (data) {
          localStorage.setItem("token", JSON.stringify(data.token));
          api.defaults.headers.Authorization = `Bearer ${data.token}`;
        }
        return api(originalRequest);
      }
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("companyId");
        api.defaults.headers.Authorization = undefined;
        setIsAuth(false);
      }
      if (error?.response?.status === 402) {
        // Empresa vencida tentando acessar rota restrita
        // Verificar se não é super admin antes de redirecionar
        if (user.profile !== 'super' && !user.super) {
          toast.warn("Acesso restrito. Redirecionando para o financeiro...");
          history.push("/financeiro");
        }
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      if (token) {
        try {
          const { data } = await api.post("/auth/refresh_token");
          api.defaults.headers.Authorization = `Bearer ${data.token}`;
          setIsAuth(true);
          setUser(data.user);
        } catch (err) {
          toastError(err);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-user`, (data) => {
      if (data.action === "update" && data.user.id === user.id) {
        setUser(data.user);
      }
    });

    // Listener para mudanças de status da empresa
    socket.on(`company-${companyId}-status-updated`, (data) => {
      if (data.action === "company_reactivated") {
        // Mostrar notificação de reativação
        showUniqueSuccess(`✅ Empresa reativada! Todas as funcionalidades foram liberadas.`);
        
        // Recarregar dados do usuário
        refreshUserData().then(() => {
          // Redirecionar para dashboard após reativação se estiver no financeiro
          if (history.location.pathname === '/financeiro') {
            setTimeout(() => {
              history.push('/');
              window.location.reload();
            }, 4000);
          } else {
            // Se não estiver no financeiro, apenas recarregar a página
            setTimeout(() => {
              window.location.reload();
            }, 4000);
          }
        });
      } else if (data.action === "company_blocked") {
        // Empresa foi bloqueada por vencimento
        // Verificar se não é super admin antes de bloquear
        if (user.profile !== 'super' && !user.super) {
          showUniqueError(`🚫 Empresa bloqueada por falta de pagamento. Redirecionando para o financeiro...`);
          
          // Recarregar dados do usuário
          refreshUserData().then(() => {
            // Redirecionar para financeiro após bloqueio
            setTimeout(() => {
              history.push('/financeiro');
              window.location.reload();
            }, 4000);
          });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogin = async (userData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", userData);
      const {
        user: { companyId, id, company },
      } = data;

      // Verificar se o plano da empresa tem campanhas habilitadas
      if (has(company, "plan") && company.plan && company.plan.useCampaigns) {
        localStorage.setItem("cshow", null); //regra pra exibir campanhas
      } else {
        localStorage.removeItem("cshow"); // Remove se não tiver campanhas habilitadas
      }

      // Sempre permitir login, mas verificar status da empresa
      localStorage.setItem("token", JSON.stringify(data.token));
      localStorage.setItem("companyId", companyId);
      localStorage.setItem("userId", id);
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(data.user);
      setIsAuth(true);

      moment.locale('pt-br');
      const companyData = data.user.company;
      const dueDate = companyData.dueDate;
      const vencimento = moment(dueDate).format("DD/MM/yyyy");
      
      localStorage.setItem("companyDueDate", vencimento);

      // Verificar se é super admin
      const isSuperAdmin = data.user.profile === 'super' || data.user.super === true;
      
      // Verificar status da empresa
      if (companyData.isInTrial) {
        // Empresa em período de avaliação
        const trialExpiration = moment(companyData.trialExpiration).format("DD/MM/yyyy");
        toast.success(i18n.t("auth.toasts.success"));
        toast.info(`Período de avaliação até ${trialExpiration}`);
        history.push("/tickets");
      } else if ((companyData.isExpired || !companyData.status) && !isSuperAdmin) {
        // Empresa vencida - redirecionar para financeiro (exceto super admins)
        toast.success("Login realizado com sucesso");
        toast.warn(`Empresa vencida em ${vencimento}. Acesso restrito ao financeiro para regularização.`);
        history.push("/financeiro");
      } else {
        // Empresa ativa OU super admin
        const diff = moment(dueDate).diff(moment());
        const dias = moment.duration(diff).asDays();
        
        toast.success(i18n.t("auth.toasts.success"));
        
        // Avisar se está próximo do vencimento (apenas para não-super-admins)
        if (!isSuperAdmin && Math.round(dias) < 5 && Math.round(dias) > 0) {
          toast.warn(`Sua assinatura vence em ${Math.round(dias)} ${Math.round(dias) === 1 ? 'dia' : 'dias'}`);
        }
        
        // Super admins sempre vão para dashboard, outros para tickets
        history.push(isSuperAdmin ? "/" : "/tickets");
      }
      
      setLoading(false);

      //quebra linha 
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await api.delete("/auth/logout");
      setIsAuth(false);
      
      // Limpar seleções de setores salvas antes de limpar o user
      const userId = user.id;
      if (userId) {
        localStorage.removeItem(`selectedQueueIds_${userId}`);
      }
      
      setUser({});
      localStorage.removeItem("token");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userId");
      localStorage.removeItem("cshow");
      api.defaults.headers.Authorization = undefined;
      setLoading(false);
      history.push("/login");
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (err) {
      toastError(err);
    }
  };

  const refreshUserData = async () => {
    try {
      const { data } = await api.post("/auth/refresh_token");
      if (data && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do usuário:", err);
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout,
    getCurrentUserInfo,
    refreshUserData,
  };
};

export default useAuth;
