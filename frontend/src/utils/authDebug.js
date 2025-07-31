// Debug utility for authentication issues
import { tokenManager } from './tokenManager';

export const debugAuthState = () => {
  const tokenManagerCompanyId = tokenManager.getCompanyId();
  const tokenManagerUserId = tokenManager.getUserId();
  const localStorageCompanyId = localStorage.getItem('companyId');
  const localStorageUserId = localStorage.getItem('userId');
  const token = tokenManager.getToken();

  const authState = {
    tokenManager: {
      companyId: tokenManagerCompanyId,
      userId: tokenManagerUserId,
      hasToken: !!token
    },
    localStorage: {
      companyId: localStorageCompanyId,
      userId: localStorageUserId
    },
    sessionStorage: {
      companyId: sessionStorage.getItem('company_id'),
      userId: sessionStorage.getItem('user_id'),
      token: sessionStorage.getItem('auth_token')
    }
  };

  console.log('🔍 Auth Debug State:', authState);
  
  // Check for issues
  const issues = [];
  if (!tokenManagerCompanyId && !localStorageCompanyId) {
    issues.push('No companyId found in tokenManager or localStorage');
  }
  if (!tokenManagerUserId && !localStorageUserId) {
    issues.push('No userId found in tokenManager or localStorage');
  }
  if (!token) {
    issues.push('No token found');
  }

  if (issues.length > 0) {
    console.warn('🚨 Auth Issues Found:', issues);
  } else {
    console.log('✅ Auth state looks good');
  }

  return { authState, issues };
};

// Auto-debug on module load in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    debugAuthState();
  }, 1000);
}