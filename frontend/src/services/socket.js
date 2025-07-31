import openSocket from "socket.io-client";
import { tokenManager } from "../utils/tokenManager";

// Função nativa para verificar se é objeto
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Cache para evitar múltiplas conexões
let socketCache = null;
let currentCompanyId = null;

export function socketConnection(params) {
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
    console.warn("Socket connection aborted: companyId is required");
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
  
  const socket = openSocket(backendUrl, {
    transports: ["websocket"], 
    pingTimeout: 30000,
    pingInterval: 10000,
    timeout: 30000,
    forceNew: false, // Permitir reutilização de conexão
    reconnection: true,
    reconnectionAttempts: 5, // Limitar tentativas de reconexão
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    maxReconnectionAttempts: 5,
    upgrade: true,
    rememberUpgrade: true,
    query: { companyId, userId },
    withCredentials: true,
  });

  // Controle de erro mais robusto
  socket.on('connect_error', (error) => {
    console.warn('Socket connection error:', error.message);
    // Limpar cache em caso de erro
    if (socketCache === socket) {
      socketCache = null;
      currentCompanyId = null;
    }
  });

  socket.on('disconnect', (reason) => {
    console.info('Socket disconnected:', reason);
    // Limpar cache apenas se foi desconexão intencional
    if (reason === 'io client disconnect') {
      socketCache = null;
      currentCompanyId = null;
    }
  });

  socket.on('connect', () => {
    console.info('Socket connected successfully');
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