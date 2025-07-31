// Utility to reset Socket.IO state and test connection
import { resetSocketIO } from '../services/socketFallback';
import { clearSocketCache } from '../services/socket';

export function resetSocketState() {
  console.log('🔄 Resetting Socket.IO state...');
  
  // Clear any existing socket cache
  clearSocketCache();
  
  // Reset the Socket.IO disabled flag
  resetSocketIO();
  
  // Clear localStorage flags if any
  localStorage.removeItem('socketIODisabled');
  
  console.log('✅ Socket.IO state reset complete');
}

// Function to test socket connection
export function testSocketConnection() {
  console.log('🧪 Testing Socket.IO connection...');
  
  // Reset state first
  resetSocketState();
  
  // Try to create a new connection
  const { socketConnection } = require('../services/socket');
  const companyId = localStorage.getItem('companyId');
  const userId = localStorage.getItem('userId');
  
  if (!companyId || !userId) {
    console.warn('⚠️ Cannot test connection: missing companyId or userId');
    return;
  }
  
  try {
    const socket = socketConnection({ companyId });
    if (socket) {
      console.log('✅ Socket connection test successful');
      return socket;
    } else {
      console.error('❌ Socket connection test failed');
    }
  } catch (error) {
    console.error('❌ Socket connection test error:', error);
  }
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.resetSocketState = resetSocketState;
  window.testSocketConnection = testSocketConnection;
}