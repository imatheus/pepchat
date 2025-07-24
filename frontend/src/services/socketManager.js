import { socketConnection } from './socket';

// Singleton para gerenciar uma única conexão WebSocket
class SocketManager {
  constructor() {
    this.socket = null;
    this.currentCompanyId = null;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  connect(companyId) {
    // Se já está conectado com a mesma empresa, retorna a conexão existente
    if (this.socket && this.currentCompanyId === companyId && this.socket.connected) {
      return this.socket;
    }

    // Se está tentando conectar, aguarda
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.socket && !this.isConnecting) {
            resolve(this.socket);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    // Desconecta conexão anterior se existir
    if (this.socket) {
      this.disconnect();
    }

    this.isConnecting = true;
    this.currentCompanyId = companyId;

    try {
      this.socket = socketConnection({ companyId });
      
      // Reaplica todos os listeners registrados
      this.listeners.forEach((callback, event) => {
        this.socket.on(event, callback);
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
      });

      this.socket.on('disconnect', () => {
        this.isConnecting = false;
      });

      this.socket.on('connect_error', () => {
        this.isConnecting = false;
      });

    } catch (error) {
      this.isConnecting = false;
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentCompanyId = null;
      this.isConnecting = false;
    }
  }

  on(event, callback) {
    // Registra o listener
    this.listeners.set(event, callback);
    
    // Se já tem socket conectado, aplica o listener imediatamente
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    // Remove o listener registrado
    this.listeners.delete(event);
    
    // Se tem socket conectado, remove o listener
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Exporta uma instância singleton
export const socketManager = new SocketManager();