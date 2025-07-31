import { io } from "socket.io-client";

// Função nativa para verificar se é objeto
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function socketConnection(params) {
  let userId = null;
  if (localStorage.getItem("userId")) {
    userId = localStorage.getItem("userId");
  }
  
  const socket = io(import.meta.env.VITE_BACKEND_URL, {
    transports: ["websocket", "polling"], // Aligned with backend, removed deprecated flashsocket
    pingTimeout: 60000, // Aligned with backend
    pingInterval: 25000, // Aligned with backend
    timeout: 45000, // Connection timeout
    forceNew: false, // Reuse existing connection
    reconnection: true, // Enable reconnection
    reconnectionDelay: 1000, // Initial delay before reconnection
    reconnectionDelayMax: 5000, // Maximum delay between reconnections
    maxReconnectionAttempts: 5, // Limit reconnection attempts
    query: isObject(params) ? { ...params, userId } : { userId },
  });

  // Add error handling for production
  socket.on('connect_error', (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Socket connection error:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Socket disconnected:', reason);
    }
  });

  return socket;
}