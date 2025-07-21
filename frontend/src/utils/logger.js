const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      }
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      }
  },
  
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    if (isDevelopment) {
      }
  },
  
  socket: (message, ...args) => {
    if (isDevelopment) {
      }
  }
};

export default logger;