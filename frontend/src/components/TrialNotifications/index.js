import { useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import useCompanyStatus from '../../hooks/useCompanyStatus';
import { AuthContext } from '../../context/Auth/AuthContext';

const TrialNotifications = () => {
  const { companyStatus } = useCompanyStatus();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Não mostrar avisos de vencimento para usuários de nível "user"
    if (user?.profile === 'user') return;
    
    if (!companyStatus.isInTrial) return;

    const daysRemaining = companyStatus.daysRemaining;
    const hasShownNotification = localStorage.getItem(`trial-notification-${daysRemaining}`);

    // Evitar mostrar a mesma notificação múltiplas vezes no mesmo dia
    if (hasShownNotification) return;

    let message = '';
    let toastType = 'info';

    if (daysRemaining === 1) {
      message = '🚨 ÚLTIMO DIA do seu período de avaliação! Ative sua conta hoje para não perder o acesso.';
      toastType = 'error';  
    } else if (daysRemaining === 2) {
      message = '⚠️ Restam apenas 2 dias do seu período de avaliação.';
      toastType = 'warning';
    } else if (daysRemaining === 3) {
      message = '⏰ Restam 3 dias do seu período de avaliação.';
      toastType = 'warning';
    } else if (daysRemaining === 7) {
      message = 'Você tem 7 dias para testar todas as funcionalidades gratuitamente.';
      toastType = 'success';
    }

    if (message) {
    const toastOptions = {
    position: "top-right",
    autoClose: daysRemaining <= 2 ? 10000 : 6000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    };

      switch (toastType) {
        case 'error':
          toast.error(message, toastOptions);
          break;
        case 'warning':
          toast.warning(message, toastOptions);
          break;
        case 'success':
          toast.success(message, toastOptions);
          break;
        default:
          toast.info(message, toastOptions);
      }

      // Marcar que a notificação foi mostrada para este dia
      localStorage.setItem(`trial-notification-${daysRemaining}`, 'true');
    }

  }, [companyStatus.isInTrial, companyStatus.daysRemaining, user?.profile]);

  // Limpar notificações antigas quando sair do período de trial
  useEffect(() => {
    if (!companyStatus.isInTrial) {
      // Limpar todas as notificações de trial do localStorage
      for (let i = 1; i <= 7; i++) {
        localStorage.removeItem(`trial-notification-${i}`);
      }
    }
  }, [companyStatus.isInTrial]);

  return null; // Este componente não renderiza nada visualmente
};

export default TrialNotifications;