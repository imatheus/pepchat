import { Request, Response } from "express";
import AppError from "../errors/AppError";
import AsaasConfig from "../models/AsaasConfig";
import AsaasService from "../services/AsaasService/AsaasService";
import ProcessAsaasWebhookService from "../services/AsaasService/ProcessAsaasWebhookService";
import SyncAllCompaniesWithAsaasService from "../services/AsaasService/SyncAllCompaniesWithAsaasService";
import SyncAsaasInvoicesService from "../services/AsaasService/SyncAsaasInvoicesService";
import CreateAsaasCustomerForCompanyService from "../services/AsaasService/CreateAsaasCustomerForCompanyService";
import CreateAsaasSubscriptionForCompanyService from "../services/AsaasService/CreateAsaasSubscriptionForCompanyService";
import RetryFailedSubscriptionUpdatesService from "../services/AsaasService/RetryFailedSubscriptionUpdatesService";
import { logger } from "../utils/logger";

// Interfaces
interface AsaasConfigData {
  apiKey?: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
  webhookUrl?: string;
  webhookToken?: string;
}

interface RetrySubscriptionUpdatesRequest {
  retryRequests: Array<{
    companyId: number;
    expectedValue: number;
    planId: number;
    maxRetries?: number;
  }>;
}

// Buscar configuração do Asaas
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const asaasConfig = await AsaasConfig.findOne();
    
    if (!asaasConfig) {
      res.status(200).json({
        enabled: false,
        environment: 'sandbox',
        apiKey: '',
        webhookUrl: '',
        webhookToken: ''
      });
      return;
    }

    // Não retornar a chave completa por segurança
    const safeConfig = {
      enabled: asaasConfig.enabled,
      environment: asaasConfig.environment,
      webhookUrl: asaasConfig.webhookUrl || '',
      apiKey: asaasConfig.apiKey ? '***' : '',
      webhookToken: asaasConfig.webhookToken ? '***' : ''
    };

    res.status(200).json(safeConfig);
  } catch (error: any) {
    logger.error('Error getting Asaas config:', error);
    throw new AppError(error.message || "Erro ao buscar configuração do Asaas");
  }
};

// Criar/atualizar configuração do Asaas
export const store = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, environment, enabled, webhookUrl, webhookToken }: AsaasConfigData = req.body;

    if (!apiKey || !environment) {
      throw new AppError("ERR_ASAAS_CONFIG_REQUIRED_FIELDS", 400);
    }

    if (!['sandbox', 'production'].includes(environment)) {
      throw new AppError("ERR_ASAAS_INVALID_ENVIRONMENT", 400);
    }

    // Verificar se já existe configuração
    let asaasConfig = await AsaasConfig.findOne();

    if (asaasConfig) {
      // Atualizar configuração existente
      await asaasConfig.update({
        apiKey,
        environment,
        enabled: enabled !== undefined ? enabled : false,
        webhookUrl: webhookUrl || null,
        webhookToken: webhookToken || null
      });
    } else {
      // Criar nova configuração
      asaasConfig = await AsaasConfig.create({
        apiKey,
        environment,
        enabled: enabled !== undefined ? enabled : false,
        webhookUrl: webhookUrl || null,
        webhookToken: webhookToken || null
      });
    }

    res.status(200).json({
      message: "Configuração do Asaas salva com sucesso",
      config: {
        enabled: asaasConfig.enabled,
        environment: asaasConfig.environment,
        webhookUrl: asaasConfig.webhookUrl || '',
        apiKey: '***',
        webhookToken: webhookToken ? '***' : ''
      }
    });
  } catch (error: any) {
    logger.error('Error saving Asaas config:', error);
    throw new AppError(error.message || "Erro ao salvar configuração do Asaas");
  }
};

// Atualizar configuração do Asaas
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, environment, enabled, webhookUrl, webhookToken }: Partial<AsaasConfigData> = req.body;

    const asaasConfig = await AsaasConfig.findOne();
    if (!asaasConfig) {
      throw new AppError("ERR_ASAAS_CONFIG_NOT_FOUND", 404);
    }

    const updateData: any = {};
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (environment !== undefined) {
      if (!['sandbox', 'production'].includes(environment)) {
        throw new AppError("ERR_ASAAS_INVALID_ENVIRONMENT", 400);
      }
      updateData.environment = environment;
    }
    if (enabled !== undefined) updateData.enabled = enabled;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl || null;
    if (webhookToken !== undefined) updateData.webhookToken = webhookToken || null;

    await asaasConfig.update(updateData);

    res.status(200).json({
      message: "Configuração do Asaas atualizada com sucesso",
      config: {
        enabled: asaasConfig.enabled,
        environment: asaasConfig.environment,
        webhookUrl: asaasConfig.webhookUrl || '',
        apiKey: asaasConfig.apiKey ? '***' : '',
        webhookToken: asaasConfig.webhookToken ? '***' : ''
      }
    });
  } catch (error: any) {
    logger.error('Error updating Asaas config:', error);
    throw new AppError(error.message || "Erro ao atualizar configuração do Asaas");
  }
};

// Testar conexão com Asaas
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const asaasConfig = await AsaasConfig.findOne();
    if (!asaasConfig || !asaasConfig.apiKey) {
      throw new AppError("ERR_ASAAS_CONFIG_NOT_FOUND", 404);
    }

    const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);
    
    // Tentar fazer uma requisição simples para testar a conexão
    try {
      const response = await asaasService.api.get('/customers?limit=1');
      res.status(200).json({
        success: true,
        message: "Conexão com Asaas estabelecida com sucesso",
        environment: asaasConfig.environment,
        responseStatus: response.status
      });
    } catch (apiError: any) {
      throw new AppError(`Erro na API do Asaas: ${apiError.response?.data?.errors?.[0]?.description || apiError.message}`);
    }
  } catch (error: any) {
    logger.error('Error testing Asaas connection:', error);
    throw new AppError(error.message || "Erro ao testar conexão com Asaas");
  }
};

// Criar empresa no Asaas
export const createCompanyInAsaas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      throw new AppError("ERR_COMPANY_ID_REQUIRED", 400);
    }

    const result = await CreateAsaasCustomerForCompanyService({ companyId });

    res.status(200).json({
      success: true,
      message: "Empresa criada no Asaas com sucesso",
      customer: result.customer,
      subscription: result.subscription
    });
  } catch (error: any) {
    logger.error('Error creating company in Asaas:', error);
    throw new AppError(error.message || "Erro ao criar empresa no Asaas");
  }
};

// Sincronizar todas as empresas com Asaas
export const syncAllCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SyncAllCompaniesWithAsaasService();
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error syncing all companies with Asaas:', error);
    throw new AppError(error.message || "Erro ao sincronizar empresas com Asaas");
  }
};

// Sincronizar faturas do Asaas
export const syncInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, limit } = req.body;
    
    const result = await SyncAsaasInvoicesService({
      companyId: companyId ? parseInt(companyId) : undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    res.status(200).json({
      success: true,
      message: "Sincronização de faturas concluída",
      ...result
    });
  } catch (error: any) {
    logger.error('Error syncing Asaas invoices:', error);
    throw new AppError(error.message || "Erro ao sincronizar faturas do Asaas");
  }
};

// Webhook principal do Asaas
export const webhookPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const signature = req.headers['asaas-signature'] as string;

    logger.info('Received Asaas webhook:', { event: payload.event, id: payload.payment?.id || payload.subscription?.id });

    await ProcessAsaasWebhookService({ payload, signature });

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Error processing Asaas webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook seguro do Asaas (com validação de token)
export const webhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const signature = req.headers['asaas-signature'] as string;

    logger.info('Received secure Asaas webhook:', { event: payload.event, id: payload.payment?.id || payload.subscription?.id });

    await ProcessAsaasWebhookService({ payload, signature });

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Error processing secure Asaas webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook de debug (temporário)
export const webhookDebug = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    
    logger.info('Received debug Asaas webhook:', JSON.stringify(payload, null, 2));

    await ProcessAsaasWebhookService({ payload });

    res.status(200).json({ received: true, debug: true });
  } catch (error: any) {
    logger.error('Error processing debug Asaas webhook:', error);
    res.status(500).json({ error: error.message, debug: true });
  }
};

// Reprocessar atualizações de assinatura que falharam
export const retrySubscriptionUpdates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { retryRequests }: RetrySubscriptionUpdatesRequest = req.body;

    if (!retryRequests || !Array.isArray(retryRequests) || retryRequests.length === 0) {
      throw new AppError("ERR_INVALID_RETRY_REQUESTS", 400);
    }

    // Validar cada request
    for (const request of retryRequests) {
      if (!request.companyId || !request.expectedValue || !request.planId) {
        throw new AppError("ERR_INVALID_RETRY_REQUEST_FORMAT", 400);
      }
    }

    logger.info(`Starting retry operation for ${retryRequests.length} subscription updates`);

    const results = await RetryFailedSubscriptionUpdatesService(retryRequests);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Retry operation completed: ${successCount} successful, ${failCount} failed`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount
      }
    });

  } catch (error: any) {
    logger.error('Error in retrySubscriptionUpdates:', error);
    throw new AppError(error.message || "Erro ao reprocessar atualizações de assinatura");
  }
};

// Verificar status de assinatura
export const getSubscriptionStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      throw new AppError("ERR_COMPANY_ID_REQUIRED", 400);
    }

    // Aqui você pode implementar lógica para verificar o status da assinatura
    // Por exemplo, comparar o valor no banco local com o valor no Asaas
    
    res.status(200).json({
      message: "Feature not implemented yet",
      companyId: parseInt(companyId)
    });

  } catch (error: any) {
    logger.error('Error in getSubscriptionStatus:', error);
    throw new AppError(error.message || "Erro ao verificar status da assinatura");
  }
};