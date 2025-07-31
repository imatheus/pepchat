import { socketConnection, clearSocketCache } from './socket';

// Singleton para gerenciar uma única conexão WebSocket
class SocketManager {
  constructor() {
    this.socket = null;
    this.currentCompanyId = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.connectionPromise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  async connect(companyId) {
    // Validar companyId
    if (!companyId || companyId === "null" || companyId === "undefined") {
      console.warn("SocketManager: Invalid companyId provided");
      return null;
    }

    // Se já está conectado com a mesma empresa, retorna a conexão existente
    if (this.socket && this.currentCompanyId === companyId && this.socket.connected) {
      return this.socket;
    }

    // Se já está tentando conectar, retorna a promise existente
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Criar nova promise de conexão
    this.connectionPromise = this._performConnection(companyId);
    return this.connectionPromise;
  }

  async _performConnection(companyId) {
    // Desconecta conexão anterior se existir
    if (this.socket) {
      this.disconnect();
    }

    this.isConnecting = true;
    this.currentCompanyId = companyId;

    try {
      this.socket = socketConnection({ companyId });
      
      // Se socketConnection retornou null (companyId inválido), abortar
      if (!this.socket) {
        this.isConnecting = false;
        this.connectionPromise = null;
        return null;
      }
      
      // Configurar listeners do socket
      this._setupSocketListeners();
      
      // Reaplica todos os listeners registrados
      this.listeners.forEach((callback, event) => {
        if (this.socket) {
          this.socket.on(event, callback);
        }
      });

      // Aguardar conexão ou erro
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.retryCount = 0;
          this.connectionPromise = null;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(error);
        });
      });

    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      console.error('SocketManager connection error:', error);
      throw error;
    }
  }

  _setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.info('SocketManager: Connected successfully');
      this.retryCount = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.info('SocketManager: Disconnected -', reason);
      
      // Auto-reconectar apenas em casos específicos
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this._handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('SocketManager: Connection error -', error.message);
      this._handleReconnection();
    });
  }

  _handleReconnection() {
    if (this.retryCount >= this.maxRetries) {
      console.warn('SocketManager: Max reconnection attempts reached');
      return;
    }

    this.retryCount++;
    console.info(`SocketManager: Attempting reconnection ${this.retryCount}/${this.maxRetries}`);
    
    setTimeout(() => {
      if (this.currentCompanyId && !this.isConnecting) {
        this.connect(this.currentCompanyId);
      }
    }, this.retryDelay * this.retryCount);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentCompanyId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.retryCount = 0;
    
    // Limpar cache do socket.js também
    clearSocketCache();
  }

  on(event, callback) {
    // Registra o listener
    this.listeners.set(event, callback);
    
    // Se já tem socket conectado, aplica o listener imediatamente
    if (this.socket && this.socket.connected) {
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
      return true;
    }
    console.warn('SocketManager: Cannot emit - socket not connected');
    return false;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      companyId: this.currentCompanyId,
      retryCount: this.retryCount
    };
  }
}

// Exporta uma instância singleton
export const socketManager = new SocketManager();