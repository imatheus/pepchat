import "reflect-metadata";
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { join } from "path";
import { URL } from "url";

import "./database";
import "./queues";
import routes from "./routes";
import webHookMetaRoutes from "./routes/WebHookMetaRoutes";
import webChatRoutes from "./routes/webChatRoutes";
import subscriptionRoutes from "./routes/subScriptionRoutes";
import asaasRoutes from "./routes/asaasRoutes";
import AppError from "./errors/AppError";
import uploadConfig from "./config/upload";
import { logger } from "./utils/logger";
import { 
  helmetConfig, 
  apiLimiter, 
  sanitizeInput 
} from "./middleware/security";
import { 
  logAuthFailure, 
  logRateLimit, 
  logSuspiciousActivity, 
  logAccessDenied 
} from "./middleware/securityLogger";

// Inicializar express
const app = express();

// Configurar trust proxy de forma segura
if (process.env.NODE_ENV === 'production') {
  // Em produção, confiar apenas em proxies específicos (localhost e loopback)
  app.set('trust proxy', ['127.0.0.1', '::1']);
} else {
  // Em desenvolvimento, desabilitar trust proxy para evitar warnings
  app.set('trust proxy', false);
}

// Configurações de segurança
app.use(helmetConfig);
app.use(apiLimiter);

// Configuração de CORS
const allowedOrigins = new Set<string>([
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.NODE_ENV === 'development' 
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
  ...(process.env.NODE_ENV === 'production' 
    ? [
        "https://app.pepchat.com.br",
        "https://www.app.pepchat.com.br",
        "https://pepchat.com.br",
        "https://www.pepchat.com.br"
      ]
    : [])
]);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      try {
        // Permitir requests sem origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Normalizar origin
        const originUrl = new URL(origin);
        const originHost = originUrl.host;

        // Verificar se a origem está na lista de permitidas
        const isAllowed = Array.from(allowedOrigins).some(allowed => {
          try {
            const allowedUrl = new URL(allowed);
            return allowedUrl.host === originHost;
          } catch (e) {
            logger.warn(`Invalid allowed origin format: ${allowed}`);
            return false;
          }
        });

        if (isAllowed || process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }

        logger.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error("Não permitido pelo CORS"));
      } catch (e) {
        logger.error(`CORS error processing origin ${origin}: ${e.message}`);
        return callback(new Error("Erro ao processar origem CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-hub-signature-256",
      "asaas-access-token",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "Pragma"
    ],
    exposedHeaders: ["X-Total-Count", "Content-Range"]
  })
);

// Middlewares básicos
app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_LIMIT || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_LIMIT || "10mb" }));

// Sanitização de dados
app.use(sanitizeInput);

// Request logging middleware (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Filtrar logs de requisições GET e POST (todas as consultas de API)
      const skipLogging = [
        '/plans/public',
        '/health',
        '/api/health',
        '/socket.io/',
        '/favicon.ico',
        '/uploads/' // Filtrar logs de uploads (GET /uploads/...)
      ].some(path => req.path.includes(path)) || 
      res.statusCode === 304 || // Não logar respostas 304 (Not Modified)
      req.method === 'GET' || // Filtrar todos os logs GET
      req.method === 'POST'; // Filtrar todos os logs POST
      
      if (!skipLogging) {
        logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      }
    });
    next();
  });
}

// Middlewares de logging de segurança
app.use(logAuthFailure);
app.use(logRateLimit);
app.use(logSuspiciousActivity);
app.use(logAccessDenied);

// Configuração de arquivos estáticos
app.use("/public", express.static(join(__dirname, "..", "public"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: process.env.NODE_ENV === 'production'
}));


app.use("/uploads", express.static(join(__dirname, "..", "uploads"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: process.env.NODE_ENV === 'production'
}));

// Health check endpoint (fora do prefixo /api/ para monitoramento)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Health check (dentro do prefixo /api/ para consistência)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    api: true
  });
});

// Rotas
app.use("/webhook/meta", webHookMetaRoutes);
app.use("/webhook", webChatRoutes);
app.use("/webhook", subscriptionRoutes);
// Rotas do Asaas webhook (fora do prefixo /api/ para webhooks externos)
app.use("/", asaasRoutes);
app.use("/api", routes);

// Error handling
const errorHandler: express.ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}, Status: ${err.statusCode}, Path: ${req.path}`);
    res.status(err.statusCode).json({
      error: err.message,
      code: err.statusCode,
      timestamp: new Date().toISOString()
    });
    return;
  }

  logger.error(`Unexpected error: ${err.message}, Path: ${req.path}, Stack: ${err.stack}`);
  res.status(500).json({
    error: "Internal server error",
    code: 500,
    timestamp: new Date().toISOString()
  });
};

app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Performing graceful shutdown...`);
  
  // Dar tempo para requests em andamento terminarem
  setTimeout(() => {
    logger.info('Graceful shutdown completed');
    process.exit(0);
  }, 10000); // 10 segundos para finalizar requests
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;