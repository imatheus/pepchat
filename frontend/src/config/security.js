// Security configuration for the frontend application

export const SECURITY_CONFIG = {
  // Content Security Policy settings
  CSP: {
    // Allowed sources for scripts
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Material-UI styles
      "https://connect.facebook.net", // Facebook SDK
    ],
    
    // Allowed sources for styles
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Material-UI styles
      "https://fonts.googleapis.com",
    ],
    
    // Allowed sources for fonts
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    
    // Allowed sources for images
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],
    
    // Allowed sources for connections
    connectSrc: [
      "'self'",
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
      "wss:", // WebSocket connections
      "ws:", // WebSocket connections
    ],
  },

  // Rate limiting configuration
  RATE_LIMITING: {
    // Login attempts
    LOGIN: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    
    // API requests
    API: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    
    // File uploads
    UPLOAD: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // Input validation rules
  VALIDATION: {
    // Password requirements
    PASSWORD: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    
    // File upload restrictions
    FILE_UPLOAD: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf', '.txt', '.doc', '.docx'
      ],
    },
    
    // Text input limits
    TEXT_LIMITS: {
      shortText: 255,
      mediumText: 1000,
      longText: 5000,
      message: 4096,
    },
  },

  // Session management
  SESSION: {
    // Token expiration time (in milliseconds)
    tokenExpirationTime: 24 * 60 * 60 * 1000, // 24 hours
    
    // Refresh token before expiration (in milliseconds)
    refreshTokenBefore: 5 * 60 * 1000, // 5 minutes
    
    // Maximum inactive time before logout (in milliseconds)
    maxInactiveTime: 2 * 60 * 60 * 1000, // 2 hours
  },

  // Sanitization settings
  SANITIZATION: {
    // HTML sanitization for rich text
    HTML_ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'br', 'p',
      'ul', 'ol', 'li', 'a', 'span'
    ],
    
    // HTML allowed attributes
    HTML_ALLOWED_ATTRIBUTES: {
      'a': ['href', 'title'],
      'span': ['style'],
    },
    
    // Remove dangerous protocols
    DANGEROUS_PROTOCOLS: [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
    ],
  },

  // Error handling
  ERROR_HANDLING: {
    // Don't expose sensitive information in error messages
    GENERIC_ERROR_MESSAGE: "Ocorreu um erro. Tente novamente.",
    
    // Log levels
    LOG_LEVELS: {
      PRODUCTION: 'error',
      DEVELOPMENT: 'debug',
    },
  },

  // Feature flags for security features
  FEATURES: {
    // Enable/disable security features
    ENABLE_CSP: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_INPUT_SANITIZATION: true,
    ENABLE_XSS_PROTECTION: true,
    ENABLE_CSRF_PROTECTION: true,
    
    // Development features
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
    ENABLE_PERFORMANCE_MONITORING: true,
  },
};

// Security headers that should be set by the server
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Utility function to check if a feature is enabled
export const isSecurityFeatureEnabled = (feature) => {
  return SECURITY_CONFIG.FEATURES[feature] || false;
};

// Utility function to get validation rules for a field type
export const getValidationRules = (fieldType) => {
  switch (fieldType) {
    case 'password':
      return {
        required: true,
        minLength: SECURITY_CONFIG.VALIDATION.PASSWORD.minLength,
        type: 'password',
      };
    case 'email':
      return {
        required: true,
        type: 'email',
        maxLength: SECURITY_CONFIG.VALIDATION.TEXT_LIMITS.shortText,
      };
    case 'phone':
      return {
        required: true,
        type: 'phone',
        maxLength: 20,
      };
    case 'shortText':
      return {
        maxLength: SECURITY_CONFIG.VALIDATION.TEXT_LIMITS.shortText,
      };
    case 'mediumText':
      return {
        maxLength: SECURITY_CONFIG.VALIDATION.TEXT_LIMITS.mediumText,
      };
    case 'longText':
      return {
        maxLength: SECURITY_CONFIG.VALIDATION.TEXT_LIMITS.longText,
      };
    case 'message':
      return {
        maxLength: SECURITY_CONFIG.VALIDATION.TEXT_LIMITS.message,
      };
    default:
      return {};
  }
};