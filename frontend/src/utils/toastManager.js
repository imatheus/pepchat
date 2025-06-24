import { toast } from "react-toastify";

// Controle global de toasts para evitar duplicações
const activeToasts = new Set();
const toastTimeouts = new Map();

const createToastId = (type, message) => {
  return `${type}-${message.replace(/[^a-zA-Z0-9]/g, '')}`;
};

const showUniqueToast = (type, message, options = {}) => {
  const toastId = createToastId(type, message);
  
  // Se já existe um toast ativo com essa mensagem, não mostrar outro
  if (activeToasts.has(toastId)) {
    return;
  }
  
  // Adicionar à lista de toasts ativos
  activeToasts.add(toastId);
  
  // Configurações padrão
  const defaultOptions = {
    toastId,
    onClose: () => {
      activeToasts.delete(toastId);
      if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId));
        toastTimeouts.delete(toastId);
      }
    },
    ...options
  };
  
  // Mostrar o toast
  let toastResult;
  switch (type) {
    case 'success':
      toastResult = toast.success(message, defaultOptions);
      break;
    case 'error':
      toastResult = toast.error(message, defaultOptions);
      break;
    case 'warning':
    case 'warn':
      toastResult = toast.warn(message, defaultOptions);
      break;
    case 'info':
      toastResult = toast.info(message, defaultOptions);
      break;
    default:
      toastResult = toast(message, defaultOptions);
  }
  
  // Configurar timeout para remover da lista após um tempo
  const timeout = setTimeout(() => {
    activeToasts.delete(toastId);
    toastTimeouts.delete(toastId);
  }, options.autoClose || 5000);
  
  toastTimeouts.set(toastId, timeout);
  
  return toastResult;
};

// Funções específicas para cada tipo
export const showUniqueSuccess = (message, options) => showUniqueToast('success', message, options);
export const showUniqueError = (message, options) => showUniqueToast('error', message, options);
export const showUniqueWarning = (message, options) => showUniqueToast('warning', message, options);
export const showUniqueInfo = (message, options) => showUniqueToast('info', message, options);

// Função para limpar todos os toasts ativos
export const clearAllToasts = () => {
  activeToasts.clear();
  toastTimeouts.forEach(timeout => clearTimeout(timeout));
  toastTimeouts.clear();
  toast.dismiss();
};

// Função para verificar se um toast específico está ativo
export const isToastActive = (type, message) => {
  const toastId = createToastId(type, message);
  return activeToasts.has(toastId);
};

export default {
  showUniqueSuccess,
  showUniqueError,
  showUniqueWarning,
  showUniqueInfo,
  clearAllToasts,
  isToastActive
};