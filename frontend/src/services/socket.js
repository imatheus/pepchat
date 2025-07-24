import openSocket from "socket.io-client";
import { tokenManager } from "../utils/tokenManager";

// Função nativa para verificar se é objeto
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function socketConnection(params) {
  let userId = tokenManager.getUserId();
  if (!userId) {
    userId = localStorage.getItem("userId");
  }
  
  console.log(`[DEBUG] Creating socket connection - userId: ${userId}, params:`, params);
  
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

  // Debug logging
  socket.on('connect', () => {
    console.log(`[DEBUG] Socket connected successfully - ID: ${socket.id}`);
  });

  socket.on('connect_error', (error) => {
    console.log(`[DEBUG] Socket connection error:`, error);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[DEBUG] Socket disconnected - reason:`, reason);
  });

  return socket;
}