import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

// Rate limiting para login
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: "Muitas tentativas de login. Tente novamente em 5 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting geral para API - CORRIGIDO
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (reduzido de 5 para 1)
  max: process.env.NODE_ENV === 'development' ? 10000 : 5000, // aumentado de 1000 para 5000
  message: {
    error: "Muitas requisições. Tente novamente em 1 minuto."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar o IP do cliente de forma mais segura
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = req.ip;
    const socketIp = req.socket.remoteAddress;
    
    // Em produção, usar o primeiro IP da lista x-forwarded-for se disponível
    if (process.env.NODE_ENV === 'production' && forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    
    // Usar real IP se disponível
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    // Fallback para IP do Express ou socket
    return clientIp || socketIp || 'unknown';
  },
  skip: (req) => {
    // Pular rate limiting em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Pular rate limiting para Socket.IO
    if (req.path.startsWith('/socket.io/')) {
      return true;
    }
    
    // Pular rate limiting para health checks
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }
    
    // Pular rate limiting para webhooks
    if (req.path.startsWith('/webhook/')) {
      return true;
    }
    
    return false;
  }
});

// Rate limiting para webhooks
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 500, // máximo 500 requests por IP por minuto
  message: {
    error: "Rate limit exceeded for webhooks"
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar o IP do cliente de forma mais segura para webhooks
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = req.ip;
    const socketIp = req.socket.remoteAddress;
    
    // Em produção, usar o primeiro IP da lista x-forwarded-for se disponível
    if (process.env.NODE_ENV === 'production' && forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    
    // Usar real IP se disponível
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    // Fallback para IP do Express ou socket
    return clientIp || socketIp || 'unknown';
  },
  skip: (req) => {
    // Pular rate limiting para webhooks do Asaas se tiver o token correto
    if (req.path.includes('/asaas/webhook')) {
      const token = req.headers["asaas-access-token"];
      return token === process.env.ASAAS_WEBHOOK_TOKEN;
    }
    return false;
  }
});

// Configuração do Helmet
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para sanitização de dados
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove scripts e tags HTML perigosas
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};