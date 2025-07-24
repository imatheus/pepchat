import { tokenManager } from './tokenManager';

// Utility functions to get auth data with fallback to localStorage for compatibility
export const getCompanyId = () => {
  return tokenManager.getCompanyId() || localStorage.getItem("companyId");
};

export const getUserId = () => {
  return tokenManager.getUserId() || localStorage.getItem("userId");
};

export const getToken = () => {
  return tokenManager.getToken() || (localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")) : null);
};