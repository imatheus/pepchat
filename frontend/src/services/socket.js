import openSocket from "socket.io-client";
import { tokenManager } from "../utils/tokenManager";

// Função nativa para verificar se é objeto
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function socketConnection(params) {
  let userId = tokenManager.getUserId();
  if (!userId) {
    // Fallback para localStorage para compatibilidade
    userId = localStorage.getItem("userId");
  }
  
  const socket = openSocket(import.meta.env.VITE_BACKEND_URL, {
    transports: ["websocket", "polling"], // Aligned with backend, removed deprecated flashsocket
    pingTimeout: 60000, // Aligned with backend
    pingInterval: 25000, // Aligned with backend
    timeout: 45000, // Connection timeout
    forceNew: false, // Reuse existing connection
    reconnection: true, // Enable reconnection
    reconnectionDelay: 1000, // Initial delay before reconnection
    reconnectionDelayMax: 5000, // Maximum delay between reconnections
    maxReconnectionAttempts: 10, // Increased reconnection attempts for production
    upgrade: true, // Allow transport upgrades
    rememberUpgrade: true, // Remember successful upgrades
    query: isObject(params) ? { ...params, userId } : { userId },
    withCredentials: true, // Include credentials for CORS
  });

  // Silent error handling
  socket.on('connect_error', () => {
    // Silent in production
  });

  socket.on('disconnect', () => {
    // Silent in production
  });

  return socket;
}