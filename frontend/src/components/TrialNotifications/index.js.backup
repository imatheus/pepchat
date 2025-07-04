import { useEffect, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import useCompanyStatus from '../../hooks/useCompanyStatus';
import { AuthContext } from '../../context/Auth/AuthContext';

const TrialNotifications = () => {
  const { companyStatus } = useCompanyStatus();
  const { user } = useContext(AuthContext);
  const hasShownNotifications = useRef(new Set());

  useEffect(() => {
    // Não mostrar avisos de vencimento para usuários de nível "user"
    if (user?.profile === 'user') return;
    
    if (!companyStatus.isInTrial || !user?.id) return;

    const daysRemaining = companyStatus.daysRemaining;
    
    let message = '';
    let toastType = 'info';
    let storageKey = '';

    if (daysRemaining === 1) {
      message = '🚨 ÚLTIMO DIA do seu período de avaliação! Ative sua conta hoje para não perder o acesso.';
      toastType = 'error';
      storageKey = `trial-notification-day-${daysRemaining}-${user.id}`;
    } else if (daysRemaining === 2) {
      message = '⚠️ Restam apenas 2 dias do seu período de avaliação.';
      toastType = 'warning';
      storageKey = `trial-notification-day-${daysRemaining}-${user.id}`;
    } else if (daysRemaining === 3) {
      message = '⏰ Restam 3 dias do seu período de avaliação.';
      toastType = 'warning';
      storageKey = `trial-notification-day-${daysRemaining}-${user.id}`;
    } else if (daysRemaining === 7) {
      message = 'Você tem 7 dias para testar todas as funcionalidades gratuitamente.';
      toastType = 'success';
      // Para a notificação de 7 dias, usar uma chave única que aparece apenas uma vez
      storageKey = `trial-welcome-shown-${user.id}`;
    }

    // Verificar se já mostrou esta notificação específica
    if (!storageKey || localStorage.getItem(storageKey) || hasShownNotifications.current.has(storageKey)) {
      return;
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

      // Marcar que a notificação foi mostrada
      if (storageKey) {
        localStorage.setItem(storageKey, 'true');
        hasShownNotifications.current.add(storageKey);
      }
    }

  }, [companyStatus.isInTrial, companyStatus.daysRemaining, user?.profile, user?.id]);

  return null; // Este componente não renderiza nada visualmente
};

export default TrialNotifications;