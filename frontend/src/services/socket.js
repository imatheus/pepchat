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
  const backendUrl = import.meta.env.VITE_BACKEND_URL.replace('/api', '');
  
  // Detectar se está em produção
  const isProduction = import.meta.env.PROD;
  
  // Configurações diferentes para desenvolvimento e produção
  const socketConfig = {
    // Usar polling primeiro e depois upgrade para websocket
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
    timeout: 45000,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    upgrade: true,
    rememberUpgrade: false, // Sempre tentar upgrade
    query: { companyId, userId },
    withCredentials: true,
    autoConnect: true,
    // Configurações específicas para produção
    ...(isProduction && {
      forceBase64: false,
      enablesXDR: false,
    })
  };

  const socket = io(backendUrl, socketConfig);

  // Controle de erro mais robusto
  socket.on('connect_error', (error) => {
    // Se for erro 400, desabilitar Socket.IO completamente
    if (error.description === 400) {
      disableSocketIO();
      socket.disconnect();
      socketCache = null;
      currentCompanyId = null;
      return;
    }
    
    // Limpar cache em caso de erro
    if (socketCache === socket) {
      socketCache = null;
      currentCompanyId = null;
    }
  });

  socket.on('disconnect', (reason) => {
    // Limpar cache apenas se foi desconexão intencional
    if (reason === 'io client disconnect') {
      socketCache = null;
      currentCompanyId = null;
    }
  });

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