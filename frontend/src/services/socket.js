import { io } from "socket.io-client";
import { tokenManager } from "../utils/tokenManager";
import { disableSocketIO, isSocketIODisabled, createFallbackSocket } from "./socketFallback";

// Função nativa para verificar se é objeto
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Cache para evitar múltiplas conexões
let socketCache = null;
let currentCompanyId = null;

export function socketConnection(params) {
  // Se Socket.IO foi desabilitado devido a erro 400, retornar fallback
  if (isSocketIODisabled()) {
    return createFallbackSocket();
  }

  let userId = tokenManager.getUserId();
  if (!userId) {
    userId = localStorage.getItem("userId");
  }

  // Garantir que companyId não seja null
  let companyId = null;
  if (isObject(params) && params.companyId) {
    companyId = params.companyId;
  } else {
    companyId = localStorage.getItem("companyId");
  }

  // Se não conseguir obter companyId, não criar conexão
  if (!companyId || companyId === "null" || companyId === "undefined") {
    return null;
  }

  // Reutilizar conexão existente se for para a mesma empresa
  if (socketCache && currentCompanyId === companyId && socketCache.connected) {
    return socketCache;
  }

  // Desconectar conexão anterior se existir
  if (socketCache && socketCache.connected) {
    socketCache.disconnect();
  }

  // Construir URL correta para WebSocket (remover /api se existir)
  // APIs HTTP usam /api, mas WebSocket conecta diretamente no domínio base
  const baseUrl = (import.meta.env.VITE_BACKEND_URL || '').replace('/api', '');
  const backendUrl = baseUrl || window.location.origin;

  // Detectar se está em produção
  const isProduction = import.meta.env.PROD;

  // Flag de tentativa de fallback para polling (evitar loop)
  let triedPollingFallback = false;

  const createSocket = (forcePolling = false) => {
    const transports = forcePolling
      ? ["polling"]
      : (isProduction ? ["polling", "websocket"] : ["websocket", "polling"]);

    const socketConfig = {
      transports,
      path: "/socket.io",
      pingTimeout: 60000,
      pingInterval: 25000,
      timeout: 30000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      upgrade: !forcePolling,
      rememberUpgrade: !forcePolling, // lembrar upgrade apenas quando não estiver forçando polling
      query: { companyId, userId },
      withCredentials: true,
      autoConnect: true,
      ...(isProduction && { forceBase64: false, enablesXDR: false })
    };

    const sock = io(backendUrl, socketConfig);

    // Controle de erro mais robusto
    sock.on('connect_error', (error) => {
      // Se for erro 400, desabilitar Socket.IO completamente
      if (error?.description === 400) {
        disableSocketIO();
        sock.disconnect();
        socketCache = null;
        currentCompanyId = null;
        return;
      }

      // Se falhar websocket em produção, tentar fallback para polling uma única vez
      const msg = (error && (error.message || error.toString())) || '';
      const wsLikelyBlocked = msg.includes('websocket error') || msg.includes('transport error');
      if (!forcePolling && !triedPollingFallback && wsLikelyBlocked) {
        triedPollingFallback = true;
        try {
          sock.disconnect();
        } catch {}
        // Recriar conexão com polling-only
        const pollingSocket = createSocket(true);
        socketCache = pollingSocket;
        currentCompanyId = companyId;
        return;
      }

      // Limpar cache em caso de erro
      if (socketCache === sock) {
        socketCache = null;
        currentCompanyId = null;
      }
    });

    sock.on('disconnect', (reason) => {
      // Limpar cache apenas se foi desconexão intencional
      if (reason === 'io client disconnect') {
        socketCache = null;
        currentCompanyId = null;
      }
    });

    return sock;
  };

  const socket = createSocket(false);

  // Atualizar cache
  socketCache = socket;
  currentCompanyId = companyId;

  return socket;
}

// Função para limpar cache (útil para logout)
export function clearSocketCache() {
  if (socketCache) {
    socketCache.disconnect();
    socketCache = null;
    currentCompanyId = null;
  }
}
