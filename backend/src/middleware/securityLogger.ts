import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'WEBHOOK_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'ACCESS_DENIED';
  ip: string;
  userAgent?: string;
  userId?: string;
  endpoint: string;
  details?: any;
  timestamp: Date;
}

class SecurityLogger {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    // Adicionar ao array de eventos
    this.events.push(securityEvent);
    
    // Manter apenas os últimos MAX_EVENTS
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log no sistema
    logger.warn('Security Event', {
      type: event.type,
      ip: event.ip,
      endpoint: event.endpoint,
      userId: event.userId,
      details: event.details
    });

    // Se for um evento crítico, log como erro
    if (event.type === 'SUSPICIOUS_ACTIVITY' || event.type === 'WEBHOOK_FAILURE') {
      logger.error('Critical Security Event', securityEvent);
    }
  }

  static getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  static getEventsByType(type: SecurityEvent['type'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  static getEventsByIP(ip: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.ip === ip)
      .slice(-limit);
  }
}

// Middleware para logar tentativas de autenticação falhadas
export const logAuthFailure = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se já foi interceptado
  if ((res as any)._securityLoggerIntercepted) {
    next();
    return;
  }

  const originalSend = res.send;
  (res as any)._securityLoggerIntercepted = true;
  
  res.send = function(data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      SecurityLogger.logSecurityEvent({
        type: 'AUTH_FAILURE',
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        details: {
          method: req.method,
          body: req.body?.email ? { email: req.body.email } : undefined
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware para logar rate limiting
export const logRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se já foi interceptado
  if ((res as any)._securityLoggerIntercepted) {
    next();
    return;
  }

  const originalSend = res.send;
  (res as any)._securityLoggerIntercepted = true;
  
  res.send = function(data) {
    if (res.statusCode === 429) {
      SecurityLogger.logSecurityEvent({
        type: 'RATE_LIMIT',
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        details: {
          method: req.method
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware para logar atividades suspeitas
export const logSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /drop.*table/i, // SQL injection
    /exec\(/i, // Code injection
    /eval\(/i  // Code injection
  ];

  const checkForSuspiciousContent = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkForSuspiciousContent);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkForSuspiciousContent);
    }
    
    return false;
  };

  const isSuspicious = 
    checkForSuspiciousContent(req.body) ||
    checkForSuspiciousContent(req.query) ||
    checkForSuspiciousContent(req.params);

  if (isSuspicious) {
    SecurityLogger.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      details: {
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      }
    });
  }

  next();
};

// Middleware para logar acesso negado
export const logAccessDenied = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se já foi interceptado
  if ((res as any)._securityLoggerIntercepted) {
    next();
    return;
  }

  const originalSend = res.send;
  (res as any)._securityLoggerIntercepted = true;
  
  res.send = function(data) {
    if (res.statusCode === 403) {
      SecurityLogger.logSecurityEvent({
        type: 'ACCESS_DENIED',
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
        endpoint: req.originalUrl,
        details: {
          method: req.method,
          userProfile: (req as any).user?.profile
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export { SecurityLogger };