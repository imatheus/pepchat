import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { has } from "lodash";

import { toast } from "react-toastify";
import { showUniqueError, showUniqueSuccess } from "../../utils/toastManager";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { socketManager } from "../../services/socketManager";
import { tokenManager } from "../../utils/tokenManager";
import moment from "moment";

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  api.interceptors.request.use(
    (config) => {
      const token = tokenManager.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
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

        try {
          console.debug("Attempting token refresh due to 403 error");
          const { data } = await api.post("/auth/refresh_token");
          if (data && data.token) {
            tokenManager.setToken(data.token);
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
            console.debug("Token refreshed successfully");
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Se falhar o refresh, limpar dados e redirecionar para login apenas se o usuário estava autenticado
          console.warn("Token refresh failed in interceptor:", refreshError.message);
          if (isAuth) {
            tokenManager.clearAll();
            api.defaults.headers.Authorization = undefined;
            setIsAuth(false);
            setUser({});
            history.push("/login");
          }
          return Promise.reject(refreshError);
        }
      }
      if (error?.response?.status === 401) {
        console.warn("401 Unauthorized error:", error.response?.data?.message || error.message);
        // Só limpar auth se o usuário estava previamente autenticado e não é uma tentativa de login
        if (isAuth && !originalRequest.url?.includes('/auth/login')) {
          console.debug("Clearing authentication due to 401 error");
          tokenManager.clearAll();
          api.defaults.headers.Authorization = undefined;
          setIsAuth(false);
          setUser({});
          // Don't redirect if already on login page
          if (history.location.pathname !== '/login') {
            history.push("/login");
          }
        }
      }
      if (error?.response?.status === 402) {
        // Licença expirada tentando acessar rota restrita
        // Verificar se o usuário está carregado e não é super admin
        if (user && user.profile && user.profile !== 'super' && !user.super) {
          // Não mostrar avisos de vencimento para usuários de nível "user"
          if (user.profile !== 'user') {
            toast.warn("Acesso restrito. Redirecionando para o financeiro...");
          }
          history.push("/financial");
        }
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = tokenManager.getToken();
    (async () => {
      if (token) {
        try {
          // Set the token in headers before making the refresh request
          api.defaults.headers.Authorization = `Bearer ${token}`;
          
          const { data } = await api.post("/auth/refresh_token");
          
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
            tokenManager.setToken(data.token);
            
            // Ensure companyId and userId are stored for backward compatibility
            if (data.user && data.user.companyId) {
              tokenManager.setCompanyId(data.user.companyId);
              localStorage.setItem("companyId", data.user.companyId);
            }
            if (data.user && data.user.id) {
              tokenManager.setUserId(data.user.id);
              localStorage.setItem("userId", data.user.id);
            }
            
            setIsAuth(true);
            setUser(data.user);
          }
        } catch (err) {
          // Se falhar o refresh, limpar dados de autenticação
          console.warn("Token refresh failed, clearing auth data:", err.message);
          if (isMountedRef.current) {
            tokenManager.clearAll();
            api.defaults.headers.Authorization = undefined;
            setIsAuth(false);
            setUser({});
          }
        }
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const companyId = tokenManager.getCompanyId();
    if (!companyId || !user.id) return;

    // Conecta usando o socketManager (singleton)
    socketManager.connect(companyId);

    const handleUserUpdate = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "update" && data.user.id === user.id) {
        setUser(data.user);
      }
    };

    const handleStatusUpdate = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "company_reactivated") {
        showUniqueSuccess(`✅ Empresa reativada! Todas as funcionalidades foram liberadas.`);
        
        refreshUserData().then(() => {
          if (isMountedRef.current && history.location.pathname === '/financial') {
            setTimeout(() => {
              if (isMountedRef.current) {
                history.push('/');
              }
            }, 4000);
          }
        });
      } else if (data.action === "company_blocked") {
        if (user && user.profile && user.profile !== 'super' && !user.super) {
          if (user.profile !== 'user') {
            showUniqueError(`🚫 Empresa bloqueada por falta de pagamento. Redirecionando para o financeiro...`);
          }
          
          refreshUserData().then(() => {
            if (isMountedRef.current) {
              setTimeout(() => {
                if (isMountedRef.current) {
                  history.push('/financial');
                }
              }, 4000);
            }
          });
        }
      }
    };

    // Registra os listeners usando o socketManager
    socketManager.on(`company-${companyId}-user`, handleUserUpdate);
    socketManager.on(`company-${companyId}-status-updated`, handleStatusUpdate);

    return () => {
      // Remove apenas os listeners específicos deste hook
      socketManager.off(`company-${companyId}-user`);
      socketManager.off(`company-${companyId}-status-updated`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

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

      // Usar tokenManager para armazenar dados de forma mais segura
      tokenManager.setToken(data.token);
      tokenManager.setCompanyId(companyId);
      tokenManager.setUserId(id);
      
      // Also store in localStorage for backward compatibility
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
        
        // Exibir aviso de avaliação apenas uma vez por login
        const trialNoticeKey = `trialNoticeShown_${data.user.id}`;
        if (data.user.profile !== 'user' && !localStorage.getItem(trialNoticeKey)) {
          toast.info(`Período de avaliação até ${trialExpiration}`);
          localStorage.setItem(trialNoticeKey, 'true');
        }
        
        history.push("/tickets");
      } else if ((companyData.isExpired || !companyData.status) && !isSuperAdmin) {
        // Licença expirada - redirecionar para financeiro (exceto super admins)
        toast.success("Login realizado com sucesso");
        
        // Não mostrar avisos de vencimento para usuários de nível "user"
        if (data.user.profile !== 'user') {
          toast.warn(`Licença expirada em ${vencimento}. Acesso restrito ao financeiro para regularização.`);
        }
        
        history.push("/financial");
      } else {
        // Empresa ativa OU super admin
        const diff = moment(dueDate).diff(moment());
        const dias = moment.duration(diff).asDays();
        
        toast.success(i18n.t("auth.toasts.success"));
        
        // Avisar se está próximo do vencimento (apenas para não-super-admins e não-users)
        if (!isSuperAdmin && data.user.profile !== 'user' && Math.round(dias) < 5 && Math.round(dias) > 0) {
          toast.warn(`Sua assinatura vence em ${Math.round(dias)} ${Math.round(dias) === 1 ? 'dia' : 'dias'}`);
        }
        
        // Super admins sempre vão para dashboard, outros para tickets
        history.push(isSuperAdmin ? "/" : "/tickets");
      }
      
      setLoading(false);

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
        // Limpar aviso de trial ao fazer logout
        localStorage.removeItem(`trialNoticeShown_${userId}`);
      }
      
      setUser({});
      tokenManager.clearAll();
      // Clear additional localStorage items
      localStorage.removeItem("cshow");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userId");
      api.defaults.headers.Authorization = undefined;
      
      // Desconectar socket
      socketManager.disconnect();
      
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