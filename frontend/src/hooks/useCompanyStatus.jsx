import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/Auth/AuthContext";
import moment from "moment";
import { socketManager } from "../services/socketManager";
import { toast } from "react-toastify";
import { showUniqueSuccess, showUniqueInfo } from "../utils/toastManager";
import api from "../services/api";

const useCompanyStatus = () => {
  const { user, refreshUserData } = useContext(AuthContext);
  const [companyStatus, setCompanyStatus] = useState({
    isActive: true,
    isInTrial: false,
    isExpired: false,
    daysRemaining: 0,
    message: ""
  });
  
  const company = user?.company;

  // Função para calcular o status da empresa de forma consistente
  const calculateCompanyStatus = useCallback((company) => {
    if (!company) {
      return {
        isActive: false,
        isInTrial: false,
        isExpired: true,
        daysRemaining: 0,
        message: "Empresa não encontrada"
      };
    }

    const now = moment();
    let isActive = company.status;
    let isInTrial = false;
    let isExpired = false;
    let daysRemaining = 0;
    let message = "";

    // Verificar período de avaliação primeiro
    if (company.trialExpiration) {
      const trialExpiration = moment(company.trialExpiration);
      isInTrial = trialExpiration.isAfter(now);
      
      if (isInTrial) {
        isActive = true;
        isExpired = false;
        // Calcular dias restantes de forma mais precisa
        const diffInHours = trialExpiration.diff(now, 'hours', true);
        daysRemaining = Math.max(0, Math.ceil(diffInHours / 24));
        message = `Período de avaliação - ${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`;
      } else {
        // Trial expirou, verificar data de vencimento
        if (company.dueDate) {
          const dueDate = moment(company.dueDate);
          isExpired = dueDate.isBefore(now);
          isActive = !isExpired;
          
          if (isExpired) {
            const daysExpired = Math.ceil(now.diff(dueDate, 'days', true));
            message = `Licença expirada há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}`;
          } else {
            daysRemaining = Math.ceil(dueDate.diff(now, 'days', true));
            message = `Licença ativa - vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
          }
        } else {
          // Sem data de vencimento e trial expirado
          isExpired = true;
          isActive = false;
          message = "Período de avaliação expirado";
        }
      }
    } else if (company.dueDate) {
      // Não está em trial, verificar apenas data de vencimento
      const dueDate = moment(company.dueDate);
      isExpired = dueDate.isBefore(now);
      isActive = !isExpired;
      
      if (isExpired) {
        const daysExpired = Math.ceil(now.diff(dueDate, 'days', true));
        message = `Licença expirada há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}`;
      } else {
        daysRemaining = Math.ceil(dueDate.diff(now, 'days', true));
        message = `Licença ativa - vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
      }
    } else {
      // Sem trial e sem data de vencimento - considerar ativa por padrão
      isActive = company.status;
      message = isActive ? "Licença ativa" : "Licença inativa";
    }

    return {
      isActive,
      isInTrial,
      isExpired,
      daysRemaining,
      message
    };
  }, []);

  // Função para sincronizar status com o backend
  const syncStatusWithBackend = useCallback(async () => {
    try {
      const { data } = await api.get("/companies/status");
      if (data.success) {
        const backendStatus = {
          isActive: data.data.company.status,
          isInTrial: data.data.isInTrial,
          isExpired: data.data.isExpired,
          daysRemaining: 0, // Será calculado pelo frontend
          message: data.data.message
        };
        
        // Calcular dias restantes baseado nos dados do backend
        if (data.data.isInTrial && data.data.company.trialExpiration) {
          const trialExpiration = moment(data.data.company.trialExpiration);
          const now = moment();
          backendStatus.daysRemaining = Math.ceil(trialExpiration.diff(now, 'days', true));
        } else if (!data.data.isExpired && data.data.company.dueDate) {
          const dueDate = moment(data.data.company.dueDate);
          const now = moment();
          backendStatus.daysRemaining = Math.ceil(dueDate.diff(now, 'days', true));
        }
        
        setCompanyStatus(backendStatus);
        return backendStatus;
      }
    } catch (error) {
      console.error("Erro ao sincronizar status com backend:", error);
      // Fallback para cálculo local
      if (company) {
        const status = calculateCompanyStatus(company);
        setCompanyStatus(status);
        return status;
      }
    }
  }, [company, calculateCompanyStatus]);

  // Atualizar status quando o usuário mudar
  useEffect(() => {
    if (company) {
      // Primeiro usar dados locais
      const localStatus = calculateCompanyStatus(company);
      setCompanyStatus(localStatus);
      
      // Depois sincronizar com backend
      syncStatusWithBackend();
    }
  }, [company, calculateCompanyStatus, syncStatusWithBackend]);

  // Socket listeners para atualizações em tempo real
  const companyId = user?.companyId;

  useEffect(() => {
    // Só executa se companyId for um número válido e positivo
    const companyIdNum = Number(companyId);
    if (!companyId || isNaN(companyIdNum) || companyIdNum <= 0) {
      return;
    }

    // Conecta usando o socketManager (singleton)
    socketManager.connect(companyIdNum);

    // Define os handlers dos eventos
    const handleStatusUpdate = async (data) => {
      if (data.action === "company_reactivated") {
        await refreshUserData();
        await syncStatusWithBackend();
      } else if (data.action === "company_blocked") {
        toast.error(`🚫 Empresa bloqueada por falta de pagamento.`);
        await refreshUserData();
        await syncStatusWithBackend();
      } else if (data.action === "company_due_date_updated") {
        await refreshUserData();
        await syncStatusWithBackend();
        
        if (data.company.dueDate && moment(data.company.dueDate).isValid()) {
          showUniqueInfo(`Data de vencimento atualizada para ${moment(data.company.dueDate).format('DD/MM/YYYY')}`);
        } else {
          showUniqueInfo(`Data de vencimento atualizada`);
        }
      } else if (data.action === "subscription_updated") {
        await refreshUserData();
        await syncStatusWithBackend();
        showUniqueInfo(`Assinatura atualizada`);
      }
    };

    const handleInvoicePaid = async (data) => {
      if (data.action === "payment_confirmed") {
        showUniqueSuccess(`Pagamento confirmado!`);
        await refreshUserData();
        await syncStatusWithBackend();
      }
    };

    const handleDueDateUpdate = async (data) => {
      if (data.action === "new_invoice_created") {
        await refreshUserData();
        await syncStatusWithBackend();
        
        if (data.company.newDueDate && moment(data.company.newDueDate).isValid()) {
          showUniqueInfo(`Nova fatura gerada - Vencimento: ${moment(data.company.newDueDate).format('DD/MM/YYYY')}`);
        }
      }
    };

    // Registra os listeners
    socketManager.on(`company-${companyIdNum}-status-updated`, handleStatusUpdate);
    socketManager.on(`company-${companyIdNum}-invoice-paid`, handleInvoicePaid);
    socketManager.on(`company-${companyIdNum}-due-date-updated`, handleDueDateUpdate);

    return () => {
      // Remove apenas os listeners específicos deste hook
      socketManager.off(`company-${companyIdNum}-status-updated`);
      socketManager.off(`company-${companyIdNum}-invoice-paid`);
      socketManager.off(`company-${companyIdNum}-due-date-updated`);
    };
  }, [companyId, refreshUserData, syncStatusWithBackend]);

  // Função para verificar se o usuário é super admin
  const profile = user?.profile;
  const isSuper = user?.super;

  const isSuperAdmin = useCallback(() => {
    return profile === 'super' || isSuper === true;
  }, [profile, isSuper]);

  // Função para verificar se a empresa está bloqueada
  const isCompanyBlocked = useCallback(() => {
    // Super admins nunca são bloqueados
    if (isSuperAdmin()) return false;
    
    // Se não está ativa e não está em trial, está bloqueada
    return !companyStatus.isActive && !companyStatus.isInTrial;
  }, [isSuperAdmin, companyStatus.isActive, companyStatus.isInTrial]);

  // Função para verificar se deve mostrar aviso de vencimento próximo
  const shouldShowExpirationWarning = useCallback(() => {
    if (isSuperAdmin()) return false;
    if (companyStatus.isExpired || companyStatus.isInTrial) return false;
    
    return companyStatus.daysRemaining <= 5 && companyStatus.daysRemaining > 0;
  }, [isSuperAdmin, companyStatus.isExpired, companyStatus.isInTrial, companyStatus.daysRemaining]);

  return {
    companyStatus,
    isCompanyBlocked: isCompanyBlocked(),
    isSuperAdmin: isSuperAdmin(),
    shouldShowExpirationWarning: shouldShowExpirationWarning(),
    calculateCompanyStatus // Exportar para uso em outros componentes
  };
};

export default useCompanyStatus;