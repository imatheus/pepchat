import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import AppError from "../errors/AppError";

// Middleware para validar webhook do Facebook/Meta
export const validateMetaWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const signature = req.headers["x-hub-signature-256"] as string;
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  
  // Verificação inicial do webhook (GET request)
  if (req.method === "GET") {
    if (verifyToken === process.env.VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    } else {
      throw new AppError("Token de verificação inválido", 403);
    }
  }
  
  // Validação da assinatura (POST request)
  if (req.method === "POST") {
    if (!signature) {
      throw new AppError("Assinatura do webhook ausente", 401);
    }
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.FACEBOOK_APP_SECRET || "")
      .update(JSON.stringify(req.body))
      .digest("hex");
    
    const signatureHash = signature.replace("sha256=", "");
    
    if (!crypto.timingSafeEqual(Buffer.from(signatureHash, "hex"), Buffer.from(expectedSignature, "hex"))) {
      throw new AppError("Assinatura do webhook inválida", 401);
    }
  }
  
  next();
};

// Middleware para validar webhook do Asaas
export const validateAsaasWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Importar AsaasConfig aqui para evitar dependência circular
    const AsaasConfig = require("../models/AsaasConfig").default;
    
    // Buscar configuração do Asaas no banco
    const asaasConfig = await AsaasConfig.findOne();
    
    if (!asaasConfig || !asaasConfig.webhookToken) {
      console.warn("Token de webhook não configurado no sistema");
      throw new AppError("Token de webhook não configurado no sistema", 500);
    }
    
    // O Asaas pode enviar o token em diferentes headers
    const signature = req.headers["asaas-access-token"] as string ||
                     req.headers["asaas-signature"] as string ||
                     req.headers["authorization"]?.replace("Bearer ", "") as string ||
                     req.query.token as string;
    
    if (!signature) {
      console.warn("Token de webhook ausente. Headers recebidos:", Object.keys(req.headers));
      throw new AppError("Token de webhook ausente", 401);
    }
    
    if (signature !== asaasConfig.webhookToken) {
      console.warn("Token de webhook inválido. Recebido:", signature.substring(0, 10) + "...");
      throw new AppError("Token de webhook inválido", 401);
    }
    
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro ao validar webhook do Asaas:", error);
    throw new AppError("Erro interno ao validar webhook", 500);
  }
};

// Middleware para validar webhook genérico com token
export const validateWebhookToken = (tokenEnvVar: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.replace("Bearer ", "") || 
                  req.query.token || 
                  req.body.token;
    
    const expectedToken = process.env[tokenEnvVar];
    
    if (!token || !expectedToken) {
      throw new AppError("Token de webhook ausente", 401);
    }
    
    if (token !== expectedToken) {
      throw new AppError("Token de webhook inválido", 401);
    }
    
    next();
  };
};

// Middleware para validar webhook com HMAC
export const validateHmacWebhook = (secretEnvVar: string, headerName: string = "x-signature") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers[headerName] as string;
    const secret = process.env[secretEnvVar];
    
    if (!signature || !secret) {
      throw new AppError("Assinatura do webhook ausente", 401);
    }
    
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    
    const signatureHash = signature.replace(/^sha256=/, "");
    
    if (!crypto.timingSafeEqual(Buffer.from(signatureHash, "hex"), Buffer.from(expectedSignature, "hex"))) {
      throw new AppError("Assinatura do webhook inválida", 401);
    }
    
    next();
  };
};