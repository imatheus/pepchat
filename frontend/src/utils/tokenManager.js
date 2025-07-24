// Utility for secure token management
// Preferably tokens should be stored in httpOnly cookies, but for compatibility
// we'll implement a more secure localStorage approach with encryption

import CryptoJS from 'crypto-js';

const TOKEN_KEY = 'auth_token';
const COMPANY_ID_KEY = 'company_id';
const USER_ID_KEY = 'user_id';

// Generate a key based on browser fingerprint for basic encryption
const getEncryptionKey = () => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    window.screen.width,
    window.screen.height,
    new Date().getTimezoneOffset()
  ].join('|');
  
  return CryptoJS.SHA256(fingerprint).toString();
};

// Encrypt data before storing
const encryptData = (data) => {
  try {
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Decrypt data after retrieving
const decryptData = (encryptedData) => {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Token management functions
export const tokenManager = {
  setToken: (token) => {
    if (!token) return false;
    
    const encryptedToken = encryptData(token);
    if (encryptedToken) {
      sessionStorage.setItem(TOKEN_KEY, encryptedToken);
      return true;
    }
    return false;
  },

  getToken: () => {
    try {
      const encryptedToken = sessionStorage.getItem(TOKEN_KEY);
      if (!encryptedToken) return null;
      
      return decryptData(encryptedToken);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  removeToken: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token'); // Remove old localStorage token if exists
  },

  setCompanyId: (companyId) => {
    if (!companyId) return false;
    
    const encryptedId = encryptData(companyId);
    if (encryptedId) {
      sessionStorage.setItem(COMPANY_ID_KEY, encryptedId);
      return true;
    }
    return false;
  },

  getCompanyId: () => {
    try {
      const encryptedId = sessionStorage.getItem(COMPANY_ID_KEY);
      if (!encryptedId) {
        // Fallback to localStorage for compatibility
        return localStorage.getItem('companyId');
      }
      
      return decryptData(encryptedId);
    } catch (error) {
      console.error('Error retrieving company ID:', error);
      return localStorage.getItem('companyId'); // Fallback
    }
  },

  removeCompanyId: () => {
    sessionStorage.removeItem(COMPANY_ID_KEY);
    localStorage.removeItem('companyId'); // Remove old localStorage value
  },

  setUserId: (userId) => {
    if (!userId) return false;
    
    const encryptedId = encryptData(userId);
    if (encryptedId) {
      sessionStorage.setItem(USER_ID_KEY, encryptedId);
      return true;
    }
    return false;
  },

  getUserId: () => {
    try {
      const encryptedId = sessionStorage.getItem(USER_ID_KEY);
      if (!encryptedId) {
        // Fallback to localStorage for compatibility
        return localStorage.getItem('userId');
      }
      
      return decryptData(encryptedId);
    } catch (error) {
      console.error('Error retrieving user ID:', error);
      return localStorage.getItem('userId'); // Fallback
    }
  },

  removeUserId: () => {
    sessionStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('userId'); // Remove old localStorage value
  },

  clearAll: () => {
    // Clear new encrypted storage
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(COMPANY_ID_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    
    // Clear old localStorage for compatibility
    localStorage.removeItem('token');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userId');
    localStorage.removeItem('cshow');
  },

  // Migration function to move from localStorage to encrypted sessionStorage
  migrateFromLocalStorage: () => {
    try {
      const oldToken = localStorage.getItem('token');
      const oldCompanyId = localStorage.getItem('companyId');
      const oldUserId = localStorage.getItem('userId');

      if (oldToken) {
        const token = JSON.parse(oldToken);
        tokenManager.setToken(token);
      }

      if (oldCompanyId) {
        tokenManager.setCompanyId(oldCompanyId);
      }

      if (oldUserId) {
        tokenManager.setUserId(oldUserId);
      }

      // Don't remove old values immediately for compatibility
    } catch (error) {
      console.error('Migration error:', error);
    }
  }
};

// Auto-migrate on module load
tokenManager.migrateFromLocalStorage();