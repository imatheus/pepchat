import DOMPurify from 'dompurify';

// Input validation utilities for enhanced security

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters and scripts
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  });
};

export const sanitizeHtml = (html, allowedTags = ['b', 'i', 'em', 'strong', 'br']) => {
  if (typeof html !== 'string') return html;
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Check if it's a valid Brazilian phone number (10 or 11 digits)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') return fileName;
  
  // Remove dangerous characters from file names
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const truncateText = (text, maxLength = 255) => {
  if (typeof text !== 'string') return text;
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Rate limiting helper for frontend
export const createRateLimiter = (maxRequests = 5, windowMs = 60000) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
    
    // Check current identifier
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(t => t > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    return true; // Request allowed
  };
};

// Generic form validation
export const validateFormData = (data, rules) => {
  const errors = {};
  
  for (const [field, value] of Object.entries(data)) {
    const fieldRules = rules[field];
    if (!fieldRules) continue;
    
    // Required validation
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = 'Este campo é obrigatório';
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') continue;
    
    // Type validation
    if (fieldRules.type) {
      switch (fieldRules.type) {
        case 'email':
          if (!validateEmail(value)) {
            errors[field] = 'Email inválido';
          }
          break;
        case 'phone':
          if (!validatePhone(value)) {
            errors[field] = 'Telefone inválido';
          }
          break;
        case 'password':
          if (!validatePassword(value)) {
            errors[field] = 'Senha deve ter pelo menos 8 caracteres, 1 maiúscula, 1 minúscula e 1 número';
          }
          break;
        case 'url':
          if (!validateUrl(value)) {
            errors[field] = 'URL inválida';
          }
          break;
      }
    }
    
    // Length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `Mínimo de ${fieldRules.minLength} caracteres`;
    }
    
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `Máximo de ${fieldRules.maxLength} caracteres`;
    }
    
    // Custom validation
    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customError = fieldRules.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};