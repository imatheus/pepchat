import { useEffect, useRef, useCallback } from 'react';
import { socketManager } from '../services/socketManager';

/**
 * Hook para gerenciar conexões WebSocket de forma centralizada
 * Substitui o uso direto de socketConnection() para evitar múltiplas conexões
 */
export const useSocket = (companyId) => {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Conectar ao socket quando o companyId mudar
  useEffect(() => {
    if (!companyId || companyId === "null" || companyId === "undefined") {
      return;
    }

    const connectSocket = async () => {
      try {
        const socket = await socketManager.connect(companyId);
        socketRef.current = socket;
      } catch (error) {
        console.error('useSocket: Failed to connect', error);
      }
    };

    connectSocket();

    // Cleanup: remover listeners quando o componente desmontar ou companyId mudar
    return () => {
      listenersRef.current.forEach((callback, event) => {
        socketManager.off(event);
      });
      listenersRef.current.clear();
    };
  }, [companyId]);

  // Função para adicionar listeners
  const on = useCallback((event, callback) => {
    if (!event || typeof callback !== 'function') {
      console.warn('useSocket.on: Invalid event or callback');
      return;
    }

    // Remover listener anterior se existir
    if (listenersRef.current.has(event)) {
      socketManager.off(event);
    }

    // Adicionar novo listener
    socketManager.on(event, callback);
    listenersRef.current.set(event, callback);
  }, []);

  // Função para remover listeners
  const off = useCallback((event) => {
    if (listenersRef.current.has(event)) {
      socketManager.off(event);
      listenersRef.current.delete(event);
    }
  }, []);

  // Função para emitir eventos
  const emit = useCallback((event, data) => {
    return socketManager.emit(event, data);
  }, []);

  // Função para verificar se está conectado
  const isConnected = useCallback(() => {
    return socketManager.isConnected();
  }, []);

  // Função para obter status da conexão
  const getConnectionStatus = useCallback(() => {
    return socketManager.getConnectionStatus();
  }, []);

  return {
    socket: socketRef.current,
    on,
    off,
    emit,
    isConnected,
    getConnectionStatus
  };
};

export default useSocket;