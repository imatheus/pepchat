import "reflect-metadata";
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { join } from "path";

import "./database";
import "./queues";
import routes from "./routes";
import AppError from "./errors/AppError";
import uploadConfig from "./config/upload";
import { logger } from "./utils/logger";
import { helmetConfig, apiLimiter, sanitizeInput } from "./middleware/security";
import { 
  logAuthFailure, 
  logRateLimit, 
  logSuspiciousActivity, 
  logAccessDenied 
} from "./middleware/securityLogger";

const app = express();

// Configurações de segurança
app.use(helmetConfig);

// Rate limiting geral
app.use(apiLimiter);

// CORS mais restritivo
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL] 
  : ["http://localhost:3000"];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Permitir requests sem origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error("Não permitido pelo CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-hub-signature-256", "asaas-access-token"]
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitização de dados
app.use(sanitizeInput);

// Middlewares de logging de segurança
app.use(logAuthFailure);
app.use(logRateLimit);
app.use(logSuspiciousActivity);
app.use(logAccessDenied);

app.use("/public", express.static(join(__dirname, "..", "public")));
app.use("/uploads", express.static(join(__dirname, "..", "uploads")));

app.use(routes);

const errorHandler: express.ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

export default app;