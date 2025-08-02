import openSocket from "socket.io-client";
import { tokenManager } from "../utils/tokenManager";

// Função nativa para verificar se é objeto
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function socketConnection(params) {
  let userId = tokenManager.getUserId();
  if (!userId) {
    userId = localStorage.getItem("userId");
  }
  
  const socket = openSocket(import.meta.env.VITE_BACKEND_URL, {
    transports: ["websocket"], 
    pingTimeout: 30000,
    pingInterval: 10000,
    timeout: 30000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: Infinity,
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