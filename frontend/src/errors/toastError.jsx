import { toast } from "react-toastify";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

const showToast = (message, toastId = undefined) => {
  if (!message) message = "Ocorreu um erro. Tente novamente.";
  toast.error(message, {
    toastId: toastId || `err-${message}`,
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

const toastError = (err) => {
  try {
    // Strings simples
    if (isString(err)) return showToast(err);

    // Objetos com message
    if (err && typeof err === 'object' && err.message) return showToast(err.message);

    // Axios-like error structure
    const status = err?.response?.status;
    const data = err?.response?.data;

    // Mensagens conhecidas vindas do backend
    const backendError = data?.error || data?.message;
    if (backendError) {
      // Se for exatamente a mensagem pedida, mostrar como veio
      if (backendError === "Não é possível aceitar um ticket sem fila") {
        return showToast(backendError, 'no-queue-accept');
      }
      if (i18n.exists(`backendErrors.${backendError}`)) {
        return showToast(i18n.t(`backendErrors.${backendError}`), backendError);
      }
      return showToast(backendError, backendError);
    }

    // Lista de erros (ex.: validação)
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const msg = data.errors.map(e => e.message || e).join("\n");
      return showToast(msg, `errors-${status}`);
    }

    // Falhas por status comuns
    if (status) {
      switch (status) {
        case 401:
          return showToast("Sessão expirada ou não autorizada. Faça login novamente.", `status-${status}`);
        case 402:
          return showToast("Recursos bloqueados devido a pendências. Acesse o menu Financeiro para regularizar.", `status-${status}`);
        case 403:
          return showToast("Acesso negado. Você não tem permissão para executar esta ação.", `status-${status}`);
        case 404:
          return showToast("Recurso não encontrado.", `status-${status}`);
        case 429:
          return showToast("Muitas requisições. Aguarde um instante e tente novamente.", `status-${status}`);
        case 500:
          return showToast("Erro interno do servidor.", `status-${status}`);
        default:
          // Status não mapeado: tente mostrar qualquer conteúdo textual
          if (data && typeof data === 'string') return showToast(data, `status-${status}`);
          return showToast(`Erro ${status}. Tente novamente.`, `status-${status}`);
      }
    }

    // Erro de rede (sem resposta)
    if (err?.request && !err?.response) {
      return showToast("Não foi possível conectar ao servidor. Verifique sua conexão com a Internet.", 'network');
    }

    // Último fallback
    return showToast("Ocorreu um erro. Tente novamente.");
  } catch (e) {
    return showToast("Ocorreu um erro. Tente novamente.");
  }
};

export default toastError;
