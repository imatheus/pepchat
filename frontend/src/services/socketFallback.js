// Fallback mode for when Socket.IO is not available
// This provides a mock socket interface to prevent errors

import { showSocketDisabledNotification } from '../utils/socketNotification';

class SocketFallback {
  constructor() {
    this.connected = false;
    this.id = null;
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    console.warn('SocketFallback: Cannot emit - Socket.IO not available');
    return false;
  }

  disconnect() {
    this.connected = false;
    console.info('SocketFallback: Disconnected (mock)');
  }

  connect() {
    console.warn('SocketFallback: Cannot connect - Socket.IO not available');
  }
}

// Global flag to track if Socket.IO should be disabled
let socketIODisabled = false;

export function disableSocketIO() {
  socketIODisabled = true;
  console.warn('🚫 Socket.IO has been disabled due to server configuration issues');
  showSocketDisabledNotification();
}

export function isSocketIODisabled() {
  return socketIODisabled;
}

export function createFallbackSocket() {
  return new SocketFallback();
}

export function resetSocketIO() {
  socketIODisabled = false;
  console.info('🔄 Socket.IO has been re-enabled');
}