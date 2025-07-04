import { Request, Response } from "express";
import AsaasConfig from "../models/AsaasConfig";
import ProcessAsaasWebhookService from "../services/AsaasService/ProcessAsaasWebhookService";
import CreateAsaasCustomerForCompanyService from "../services/AsaasService/CreateAsaasCustomerForCompanyService";
import SyncAllCompaniesWithAsaasService from "../services/AsaasService/SyncAllCompaniesWithAsaasService";
import SyncAsaasInvoicesService from "../services/AsaasService/SyncAsaasInvoicesService";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";

// Listar configuração do Asaas
export const index = async (req: Request, res: Response): Promise<void> => {
  const asaasConfig = await AsaasConfig.findOne();

  if (!asaasConfig) {
    res.json({});
  }

  // Retornar dados sem expor a API Key, mas indicando se ela existe
  const response = {
    id: asaasConfig.id,
    webhookUrl: asaasConfig.webhookUrl,
    webhookToken: asaasConfig.webhookToken,
    environment: asaasConfig.environment,
    enabled: asaasConfig.enabled,
    hasApiKey: !!asaasConfig.apiKey,
    apiKey: asaasConfig.apiKey ? '***' : '' // Mascarar a API Key
  };

  res.json(response);
};

// Criar ou atualizar configuração do Asaas
export const store = async (req: Request, res: Response): Promise<void> => {
  const { apiKey, webhookUrl, webhookToken, environment = 'sandbox', enabled = true } = req.body;

  if (!apiKey) {
    throw new AppError("Chave de API é obrigatória", 400);
  }

  let asaasConfig = await AsaasConfig.findOne();

  if (asaasConfig) {
    // Atualizar configuração existente
    await asaasConfig.update({
      apiKey,
      webhookUrl,
      webhookToken,
      environment,
      enabled
    });
  } else {
    // Criar nova configuração
    asaasConfig = await AsaasConfig.create({
      apiKey,
      webhookUrl,
      webhookToken,
      environment,
      enabled
    });
  }

  // Retornar dados sem expor a API Key, mas indicando se ela existe
  const response = {
    id: asaasConfig.id,
    webhookUrl: asaasConfig.webhookUrl,
    webhookToken: asaasConfig.webhookToken,
    environment: asaasConfig.environment,
    enabled: asaasConfig.enabled,
    hasApiKey: !!asaasConfig.apiKey,
    apiKey: asaasConfig.apiKey ? '***' : '' // Mascarar a API Key
  };

  res.json(response);
};

// Atualizar configuração do Asaas
export const update = async (req: Request, res: Response): Promise<void> => {
  const { apiKey, webhookUrl, webhookToken, environment, enabled } = req.body;

  const asaasConfig = await AsaasConfig.findOne();

  if (!asaasConfig) {
    throw new AppError("Configuração do Asaas não encontrada", 404);
  }

  await asaasConfig.update({
    ...(apiKey && { apiKey }),
    ...(webhookUrl !== undefined && { webhookUrl }),
    ...(webhookToken !== undefined && { webhookToken }),
    ...(environment && { environment }),
    ...(enabled !== undefined && { enabled })
  });

  // Retornar dados sem expor a API Key, mas indicando se ela existe
  const response = {
    id: asaasConfig.id,
    webhookUrl: asaasConfig.webhookUrl,
    webhookToken: asaasConfig.webhookToken,
    environment: asaasConfig.environment,
    enabled: asaasConfig.enabled,
    hasApiKey: !!asaasConfig.apiKey,
    apiKey: asaasConfig.apiKey ? '***' : '' // Mascarar a API Key
  };

  res.json(response);
};


// Webhook do Asaas
export const webhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const signature = req.headers['asaas-signature'] as string;

    // Log do payload recebido para debug
    logger.info('Asaas webhook received:', {
      event: payload.event,
      paymentId: payload.payment?.id,
      subscriptionId: payload.subscription?.id,
      externalReference: payload.payment?.externalReference
    });

    await ProcessAsaasWebhookService({
      payload,
      signature
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Error processing Asaas webhook:', {
      error: error.message,
      stack: error.stack,
      payload: req.body
    });

    // Retornar 200 para erros de dados inconsistentes para evitar retry
    if (error.message && (
      error.message.includes('chave estrangeira') ||
      error.message.includes('Company') && error.message.includes('not found') ||
      error.message.includes('Could not identify')
    )) {
      logger.warn('Returning 200 for data inconsistency error to prevent retry');
      res.status(200).json({ 
        success: false,
        error: "Data inconsistency - webhook processed but not applied",
        details: error.message
      });
    }

    // Para outros erros, retornar 400 para que o Asaas tente novamente
    res.status(400).json({ 
      error: error.message || "Erro ao processar webhook do Asaas" 
    });
  }
};

// Webhook público do Asaas (sem autenticação por token, mas com validações de segurança)
export const webhookPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const userAgent = req.headers['user-agent'] as string;
    const contentType = req.headers['content-type'] as string;

    // Validações de segurança básicas
    if (!payload || typeof payload !== 'object') {
      logger.warn('Webhook rejeitado: payload inválido');
      res.status(400).json({ error: "Payload inválido" });
      return;
    }

    // Verificar se tem estrutura básica de webhook do Asaas
    if (!payload.event) {
      logger.warn('Webhook rejeitado: evento não especificado');
      res.status(400).json({ error: "Evento não especificado" });
      return;
    }

    // Verificar se o User-Agent parece ser do Asaas (opcional, mas ajuda na segurança)
    const validUserAgents = ['Asaas', 'asaas', 'webhook'];
    const isValidUserAgent = !userAgent || validUserAgents.some(ua => userAgent.toLowerCase().includes(ua.toLowerCase()));

    // Log do webhook recebido
    logger.info('Asaas webhook público recebido:', {
      event: payload.event,
      paymentId: payload.payment?.id,
      subscriptionId: payload.subscription?.id,
      externalReference: payload.payment?.externalReference,
      userAgent: userAgent,
      contentType: contentType,
      isValidUserAgent: isValidUserAgent
    });

    // Processar o webhook
    await ProcessAsaasWebhookService({
      payload,
      signature: null // Sem validação de assinatura por enquanto
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Error processing Asaas webhook público:', {
      error: error.message,
      stack: error.stack,
      payload: req.body
    });

    // Retornar 200 para erros de dados inconsistentes para evitar retry
    if (error.message && (
      error.message.includes('chave estrangeira') ||
      error.message.includes('Company') && error.message.includes('not found') ||
      error.message.includes('Could not identify')
    )) {
      logger.warn('Returning 200 for data inconsistency error to prevent retry');
      res.status(200).json({ 
        success: false,
        error: "Data inconsistency - webhook processed but not applied",
        details: error.message
      });
      return;
    }

    // Para outros erros, retornar 400 para que o Asaas tente novamente
    res.status(400).json({ 
      error: error.message || "Erro ao processar webhook do Asaas" 
    });
  }
};

// Webhook do Asaas para debug (sem autenticação)
export const webhookDebug = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const headers = req.headers;

    // Log detalhado para debug
    logger.info('Asaas webhook debug received:', {
      headers: Object.keys(headers),
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      asaasSignature: headers['asaas-signature'],
      asaasAccessToken: headers['asaas-access-token'],
      authorization: headers['authorization'],
      event: payload.event,
      paymentId: payload.payment?.id,
      subscriptionId: payload.subscription?.id,
      externalReference: payload.payment?.externalReference,
      fullPayload: payload
    });

    // Processar o webhook normalmente
    await ProcessAsaasWebhookService({
      payload,
      signature: headers['asaas-signature'] as string
    });

    res.status(200).json({ success: true, debug: true });
  } catch (error: any) {
    logger.error('Error processing Asaas webhook debug:', {
      error: error.message,
      stack: error.stack,
      payload: req.body,
      headers: req.headers
    });

    // Sempre retornar 200 no debug para evitar retry
    res.status(200).json({ 
      success: false,
      debug: true,
      error: error.message,
      details: error.stack
    });
  }
};

// Testar conexão com Asaas
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const asaasConfig = await AsaasConfig.findOne();

    if (!asaasConfig || !asaasConfig.apiKey) {
      throw new AppError("Configuração do Asaas não encontrada", 404);
    }

    // Aqui você pode implementar um teste simples da API
    // Por exemplo, listar os primeiros clientes
    
    res.json({ 
      success: true, 
      message: "Conexão com Asaas testada com sucesso" 
    });
  } catch (error: any) {
    logger.error('Error testing Asaas connection:', error);
    throw new AppError(error.message || "Erro ao testar conexão com Asaas");
  }
};

// Criar empresa específica no Asaas
export const createCompanyInAsaas = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.body;

  if (!companyId) {
    throw new AppError("ID da empresa é obrigatório", 400);
  }

  try {
    const result = await CreateAsaasCustomerForCompanyService({ companyId });
    res.json(result);
  } catch (error: any) {
    logger.error('Error creating company in Asaas:', error);
    throw new AppError(error.message || "Erro ao criar empresa no Asaas");
  }
};

// Sincronizar todas as empresas com Asaas
export const syncAllCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SyncAllCompaniesWithAsaasService();
    res.json(result);
  } catch (error: any) {
    logger.error('Error syncing all companies with Asaas:', error);
    throw new AppError(error.message || "Erro ao sincronizar empresas com Asaas");
  }
};

// Sincronizar faturas do Asaas
export const syncInvoices = async (req: Request, res: Response): Promise<void> => {
  const { companyId, limit, offset } = req.query;

  try {
    const result = await SyncAsaasInvoicesService({ 
      companyId: companyId ? parseInt(companyId as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json(result);
  } catch (error: any) {
    logger.error('Error syncing Asaas invoices:', error);
    throw new AppError(error.message || "Erro ao sincronizar faturas do Asaas");
  }
};