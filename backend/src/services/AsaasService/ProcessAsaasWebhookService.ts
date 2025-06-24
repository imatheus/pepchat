import fs from "fs";
import path from "path";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "./AsaasService";
import SyncCompanyDueDateService from "../CompanyService/SyncCompanyDueDateService";
import EnsureDefaultCompanyService from "../CompanyService/EnsureDefaultCompanyService";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import moment from "moment";

interface WebhookPayload {
  id?: string;
  event: string;
  dateCreated?: string;
  payment?: {
    object?: string;
    id: string;
    dateCreated?: string;
    customer: string;
    subscription?: string;
    value: number;
    netValue: number;
    originalValue?: number;
    description: string;
    billingType: string;
    status: string;
    dueDate?: string;
    originalDueDate: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    confirmedDate?: string;
    invoiceUrl: string;
    invoiceNumber: string;
    paymentMethod?: string;
    externalReference?: string;
    bankSlipUrl?: string;
    nossoNumero?: string;
    deleted?: boolean;
    anticipated?: boolean;
    anticipable?: boolean;
    creditDate?: string;
    estimatedCreditDate?: string;
    transactionReceiptUrl?: string;
    lastInvoiceViewedDate?: string;
    lastBankSlipViewedDate?: string;
    discount?: any;
    fine?: any;
    interest?: any;
    postalService?: boolean;
    custody?: any;
    escrow?: any;
    refunds?: any;
  };
  subscription?: {
    object?: string;
    id: string;
    dateCreated?: string;
    customer: string;
    paymentLink?: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    description: string;
    billingType: string;
    deleted?: boolean;
    status: string;
    externalReference?: string;
    checkoutSession?: string;
    sendPaymentByPostalService?: boolean;
    fine?: any;
    interest?: any;
    split?: any;
  };
}

interface Request {
  payload: WebhookPayload;
  signature?: string;
}

const ProcessAsaasWebhookService = async ({
  payload,
  signature
}: Request): Promise<void> => {
  try {
    const eventId = payload.payment?.id || payload.subscription?.id || 'unknown';
    logger.info(`Processing Asaas webhook: ${payload.event} for ${eventId}`);

    // Validar payload básico
    if (!payload.event) {
      throw new AppError("Invalid webhook payload: missing event");
    }

    // Buscar configuração global do Asaas
    const asaasConfig = await AsaasConfig.findOne();

    if (!asaasConfig) {
      logger.warn(`Asaas config not found for event ${payload.event}`);
      return;
    }

    // Validar webhook se necessário
    if (signature) {
      const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);
      const isValid = asaasService.validateWebhook(payload, signature);
      if (!isValid) {
        throw new AppError("Invalid webhook signature");
      }
    }

    // Processar diferentes eventos
    switch (payload.event) {
      case 'PAYMENT_CREATED':
        if (payload.payment) {
          await handlePaymentCreated(payload, asaasConfig);
        } else {
          logger.warn(`PAYMENT_CREATED event without payment data: ${eventId}`);
        }
        break;
      case 'PAYMENT_UPDATED':
        if (payload.payment) {
          await handlePaymentUpdated(payload, asaasConfig);
        } else {
          logger.warn(`PAYMENT_UPDATED event without payment data: ${eventId}`);
        }
        break;
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        if (payload.payment) {
          await handlePaymentConfirmed(payload, asaasConfig);
        } else {
          logger.warn(`${payload.event} event without payment data: ${eventId}`);
        }
        break;
      case 'PAYMENT_OVERDUE':
        if (payload.payment) {
          await handlePaymentOverdue(payload, asaasConfig);
        } else {
          logger.warn(`PAYMENT_OVERDUE event without payment data: ${eventId}`);
        }
        break;
      case 'PAYMENT_DELETED':
        if (payload.payment) {
          await handlePaymentDeleted(payload, asaasConfig);
        } else {
          logger.warn(`PAYMENT_DELETED event without payment data: ${eventId}`);
        }
        break;
      case 'SUBSCRIPTION_CREATED':
        if (payload.subscription) {
          await handleSubscriptionCreated(payload, asaasConfig);
        } else {
          logger.warn(`SUBSCRIPTION_CREATED event without subscription data: ${eventId}`);
        }
        break;
      case 'SUBSCRIPTION_UPDATED':
        if (payload.subscription) {
          await handleSubscriptionUpdated(payload, asaasConfig);
        } else {
          logger.warn(`SUBSCRIPTION_UPDATED event without subscription data: ${eventId}`);
        }
        break;
      default:
        logger.info(`Unhandled webhook event: ${payload.event}`);
    }

  } catch (error: any) {
    logger.error('Error processing Asaas webhook:', error);
    
    // Se for erro de chave estrangeira, não relançar como erro crítico
    if (error.message && error.message.includes('chave estrangeira')) {
      logger.warn('Foreign key constraint error in webhook - data inconsistency detected');
      return; // Não relançar o erro para evitar retry infinito
    }
    
    throw new AppError(error.message || "Erro ao processar webhook do Asaas");
  }
};

// Lidar com criação de assinatura
const handleSubscriptionCreated = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.subscription) {
      logger.warn('Subscription data not found in payload');
      return;
    }

    // Tentar identificar a empresa pelo externalReference
    let targetCompanyId = null;
    if (payload.subscription.externalReference) {
      const match = payload.subscription.externalReference.match(/company_(\d+)_/);
      if (match) {
        targetCompanyId = parseInt(match[1]);
      }
    }

    if (!targetCompanyId) {
      logger.warn(`Could not identify company for subscription ${payload.subscription.id}`);
      return;
    }

    // Atualizar a empresa com o ID da assinatura
    const company = await Company.findByPk(targetCompanyId);
    if (company) {
      await company.update({
        asaasSubscriptionId: payload.subscription.id,
        asaasSyncedAt: new Date()
      });
      
      logger.info(`Company ${targetCompanyId} updated with subscription ${payload.subscription.id}`);
    }

  } catch (error: any) {
    logger.error('Error handling subscription created:', error);
    throw error;
  }
};

// Lidar com atualização de assinatura
const handleSubscriptionUpdated = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.subscription) {
      logger.warn('Subscription data not found in payload');
      return;
    }

    // Tentar identificar a empresa pelo externalReference
    let targetCompanyId = null;
    if (payload.subscription.externalReference) {
      const match = payload.subscription.externalReference.match(/company_(\d+)_/);
      if (match) {
        targetCompanyId = parseInt(match[1]);
      }
    }

    // Se não conseguiu identificar pela externalReference, tentar pelo asaasSubscriptionId
    if (!targetCompanyId) {
      const company = await Company.findOne({
        where: { asaasSubscriptionId: payload.subscription.id }
      });
      
      if (company) {
        targetCompanyId = company.id;
      }
    }

    if (!targetCompanyId) {
      logger.warn(`Could not identify company for subscription ${payload.subscription.id}`);
      return;
    }

    // Buscar a empresa
    const company = await Company.findByPk(targetCompanyId);
    if (!company) {
      logger.warn(`Company ${targetCompanyId} not found for subscription ${payload.subscription.id}`);
      return;
    }

    // Atualizar apenas timestamp de sincronização
    // A data de vencimento da empresa agora vem das faturas, não da assinatura
    const updateData: any = {
      asaasSyncedAt: new Date()
    };

    await company.update(updateData);

    // Emitir evento via Socket.IO para informar sobre atualização da assinatura
    const io = getIO();
    io.emit(`company-${company.id}-status-updated`, {
      action: "subscription_updated",
      company: {
        id: company.id,
        value: payload.subscription.value,
        description: payload.subscription.description
      },
      subscription: {
        id: payload.subscription.id,
        nextDueDate: payload.subscription.nextDueDate,
        value: payload.subscription.value,
        description: payload.subscription.description,
        status: payload.subscription.status
      }
    });

    logger.info(`Subscription updated for company ${company.id}, subscription ${payload.subscription.id}`);

  } catch (error: any) {
    logger.error('Error handling subscription updated:', error);
    throw error;
  }
};

// Lidar com criação de pagamento
const handlePaymentCreated = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.payment) {
      logger.warn('Payment data not found in payload');
      return;
    }

    // Verificar se a fatura já existe
    const existingInvoice = await Invoices.findOne({
      where: { asaasInvoiceId: payload.payment.id }
    });

    if (existingInvoice) {
      logger.info(`Invoice already exists for payment ${payload.payment.id}`);
      return;
    }

    // Tentar identificar a empresa pelo externalReference
    let targetCompanyId = null;
    if (payload.payment.externalReference) {
      const match = payload.payment.externalReference.match(/company_(\d+)_/);
      if (match) {
        targetCompanyId = parseInt(match[1]);
      }
    }

    // Verificar se a empresa existe
    if (targetCompanyId) {
      const companyExists = await Company.findByPk(targetCompanyId);
      if (!companyExists) {
        logger.warn(`Company ${targetCompanyId} not found for payment ${payload.payment.id}`);
        targetCompanyId = null;
      }
    }

    // Se não conseguiu identificar ou empresa não existe, garantir que existe uma empresa padrão
    if (!targetCompanyId) {
      try {
        const { company } = await EnsureDefaultCompanyService();
        targetCompanyId = company.id;
        logger.info(`Using default company ${company.id} for payment ${payload.payment.id}`);
      } catch (error: any) {
        logger.error(`Failed to ensure default company for payment ${payload.payment.id}:`, error);
        return;
      }
    }

    if (!targetCompanyId) {
      logger.warn(`Could not identify any valid company for payment ${payload.payment.id}`);
      return;
    }

    // Criar nova fatura
    const invoice = await Invoices.create({
      detail: payload.payment.description || `Fatura Asaas - ${payload.payment.id}`,
      status: payload.payment.status,
      value: payload.payment.value,
      dueDate: payload.payment.originalDueDate,
      companyId: targetCompanyId,
      asaasInvoiceId: payload.payment.id,
      asaasSubscriptionId: payload.payment.subscription,
      billingType: payload.payment.billingType,
      invoiceUrl: payload.payment.invoiceUrl
    });

    logger.info(`Invoice created: ${invoice.id} for payment ${payload.payment.id}`);

    // Atualizar a data de vencimento da empresa com a data da nova fatura
    if (targetCompanyId && payload.payment.originalDueDate) {
      try {
        await SyncCompanyDueDateService({
          companyId: targetCompanyId,
          dueDate: payload.payment.originalDueDate,
          updateAsaas: false, // Não atualizar Asaas pois a fatura veio de lá
          updateTrialExpiration: false // Não alterar trial quando nova fatura é criada
        });
        
        logger.info(`Company ${targetCompanyId} due date updated to ${payload.payment.originalDueDate} after new invoice creation`);
      } catch (syncError: any) {
        logger.error(`Error syncing company due date after invoice creation: ${syncError.message}`);
        
        // Fallback: atualizar diretamente a data de vencimento da empresa
        const company = await Company.findByPk(targetCompanyId);
        if (company) {
          await company.update({
            dueDate: payload.payment.originalDueDate
          });
          logger.info(`Company ${targetCompanyId} due date updated via fallback to ${payload.payment.originalDueDate}`);
        }
      }

      // Emitir evento via Socket.IO para atualizar a interface em tempo real
      const io = getIO();
      io.emit(`company-${targetCompanyId}-status-updated`, {
        action: "company_due_date_updated",
        company: {
          id: targetCompanyId,
          dueDate: payload.payment.originalDueDate
        },
        invoice: {
          id: invoice.id,
          dueDate: payload.payment.originalDueDate,
          asaasInvoiceId: payload.payment.id
        }
      });

      io.emit(`company-${targetCompanyId}-due-date-updated`, {
        action: "new_invoice_created",
        company: {
          id: targetCompanyId,
          newDueDate: payload.payment.originalDueDate
        },
        invoice: {
          id: invoice.id,
          dueDate: payload.payment.originalDueDate,
          asaasInvoiceId: payload.payment.id
        }
      });
    }

  } catch (error: any) {
    logger.error('Error handling payment created:', error);
    throw error;
  }
};

// Lidar com atualização de pagamento
const handlePaymentUpdated = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.payment) {
      logger.warn('Payment data not found in payload');
      return;
    }

    // Buscar fatura existente
    const invoice = await Invoices.findOne({
      where: { asaasInvoiceId: payload.payment.id },
      include: [{ model: Company, as: 'company' }]
    });

    if (!invoice) {
      logger.warn(`Invoice not found for payment ${payload.payment.id}`);
      return;
    }

    // Preparar dados para atualização da fatura
    const updateData: any = {
      status: payload.payment.status
    };

    let dueDateChanged = false;

    // Verificar se a data de vencimento foi alterada
    if (payload.payment.dueDate && payload.payment.dueDate !== invoice.dueDate) {
      updateData.dueDate = payload.payment.dueDate;
      dueDateChanged = true;
      logger.info(`Updating due date for invoice ${invoice.id} from ${invoice.dueDate} to ${payload.payment.dueDate}`);
    }

    // Atualizar outros campos se necessário
    if (payload.payment.value && payload.payment.value !== invoice.value) {
      updateData.value = payload.payment.value;
      logger.info(`Updating value for invoice ${invoice.id} from ${invoice.value} to ${payload.payment.value}`);
    }

    if (payload.payment.description && payload.payment.description !== invoice.detail) {
      updateData.detail = payload.payment.description;
    }

    if (payload.payment.billingType && payload.payment.billingType !== invoice.billingType) {
      updateData.billingType = payload.payment.billingType;
    }

    if (payload.payment.invoiceUrl && payload.payment.invoiceUrl !== invoice.invoiceUrl) {
      updateData.invoiceUrl = payload.payment.invoiceUrl;
    }

    // Atualizar a fatura
    await invoice.update(updateData);

    // Se a data de vencimento foi alterada, sincronizar com a empresa
    if (dueDateChanged && invoice.companyId) {
      try {
        await SyncCompanyDueDateService({
          companyId: invoice.companyId,
          dueDate: payload.payment.dueDate,
          updateAsaas: false, // Não atualizar Asaas pois a mudança veio de lá
          updateTrialExpiration: false // Não alterar trial em atualizações de data
        });
        
        logger.info(`Company ${invoice.companyId} due date synchronized to ${payload.payment.dueDate} after payment update`);
      } catch (syncError: any) {
        logger.error(`Error syncing company due date after payment update: ${syncError.message}`);
        
        // Fallback: atualizar diretamente a data de vencimento da empresa
        if (invoice.company) {
          await invoice.company.update({
            dueDate: payload.payment.dueDate
          });
          logger.info(`Company ${invoice.companyId} due date updated via fallback to ${payload.payment.dueDate}`);
        }
      }
    }

    // Emitir evento via Socket.IO para atualizar a interface em tempo real
    if (invoice.companyId) {
      const io = getIO();
      io.emit(`company-${invoice.companyId}-invoice-updated`, {
        action: "payment_updated",
        invoice: {
          id: invoice.id,
          status: payload.payment.status,
          dueDate: payload.payment.dueDate,
          value: payload.payment.value,
          asaasInvoiceId: payload.payment.id,
          updatedFields: Object.keys(updateData)
        }
      });

      // Se a data de vencimento foi alterada, emitir eventos específicos
      if (dueDateChanged) {
        io.emit(`company-${invoice.companyId}-due-date-updated`, {
          action: "due_date_changed",
          invoice: {
            id: invoice.id,
            oldDueDate: invoice.dueDate,
            newDueDate: payload.payment.dueDate,
            asaasInvoiceId: payload.payment.id
          }
        });

        // Emitir evento para atualizar dados da empresa no frontend
        io.emit(`company-${invoice.companyId}-status-updated`, {
          action: "company_due_date_updated",
          company: {
            id: invoice.companyId,
            dueDate: payload.payment.dueDate
          }
        });
      }
    }

    logger.info(`Payment updated for invoice ${invoice.id}, payment ${payload.payment.id}`);

  } catch (error: any) {
    logger.error('Error handling payment updated:', error);
    throw error;
  }
};

// Lidar com confirmação de pagamento
const handlePaymentConfirmed = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.payment) {
      logger.warn('Payment data not found in payload');
      return;
    }

    // Buscar fatura existente
    const invoice = await Invoices.findOne({
      where: { asaasInvoiceId: payload.payment.id },
      include: [{ model: Company, as: 'company' }]
    });

    if (!invoice) {
      logger.warn(`Invoice not found for payment ${payload.payment.id}`);
      return;
    }

    // Verificar se a empresa da fatura ainda existe
    if (!invoice.company) {
      logger.warn(`Company not found for invoice ${invoice.id}, payment ${payload.payment.id}`);
      return;
    }

    // Atualizar status da fatura
    const paymentDate = payload.payment.paymentDate || payload.payment.clientPaymentDate;
    const paymentMethod = payload.payment.paymentMethod || payload.payment.billingType;
    
    await invoice.update({
      status: payload.payment.status,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      paymentMethod: paymentMethod
    });

    // Atualizar status da empresa e data de vencimento
    let newDueDate: string | null = null;
    
    if (invoice.companyId) {
      const company = await Company.findByPk(invoice.companyId);
      
      if (company) {
        // Calcular nova data de vencimento (próximo mês a partir de hoje)
        newDueDate = moment().add(1, 'month').format('YYYY-MM-DD');
        
        try {
          // Usar o serviço de sincronização para atualizar a data de vencimento
          await SyncCompanyDueDateService({
            companyId: invoice.companyId,
            dueDate: newDueDate,
            updateAsaas: false, // Não atualizar Asaas pois o pagamento já foi processado
            updateTrialExpiration: false // Não alterar trial quando pagamento é confirmado
          });
          
          logger.info(`Company ${company.name} due date updated to ${newDueDate} after payment confirmation`);
        } catch (error: any) {
          logger.error(`Error updating company due date after payment: ${error.message}`);
          
          // Fallback robusto: ativar empresa e limpar trial
          await Company.update(
            { 
              status: true,
              dueDate: newDueDate,
              trialExpiration: null // Remover período de trial
            },
            { where: { id: invoice.companyId } }
          );
          
          logger.info(`Company ${invoice.companyId} activated via fallback after payment confirmation`);
        }
        
        // Recarregar empresa para pegar dados atualizados
        await company.reload();
      }

      // Emitir evento via Socket.IO para atualizar a interface em tempo real
      const io = getIO();
      io.emit(`company-${invoice.companyId}-invoice-paid`, {
        action: "payment_confirmed",
        invoice: {
          id: invoice.id,
          status: payload.payment.status,
          paymentDate: payload.payment.paymentDate,
          paymentMethod: payload.payment.paymentMethod,
          asaasInvoiceId: payload.payment.id
        },
        company: {
          id: invoice.companyId,
          status: true,
          newDueDate: newDueDate,
          trialExpiration: null
        }
      });
      
      // Emitir evento específico para recarregar dados da empresa no frontend
      io.emit(`company-${invoice.companyId}-status-updated`, {
        action: "company_reactivated",
        company: {
          id: invoice.companyId,
          status: true,
          dueDate: newDueDate,
          isExpired: false,
          isInTrial: false
        }
      });
    }

    logger.info(`Payment confirmed for invoice ${invoice.id}`);

  } catch (error: any) {
    logger.error('Error handling payment confirmed:', error);
    throw error;
  }
};

// Lidar com pagamento em atraso
const handlePaymentOverdue = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.payment) {
      logger.warn('Payment data not found in payload');
      return;
    }

    // Buscar fatura existente
    const invoice = await Invoices.findOne({
      where: { asaasInvoiceId: payload.payment.id },
      include: [{ model: Company, as: 'company' }]
    });

    if (!invoice) {
      logger.warn(`Invoice not found for payment ${payload.payment.id}`);
      return;
    }

    // Atualizar status da fatura
    await invoice.update({
      status: payload.payment.status
    });

    // Bloquear a empresa quando a fatura vence
    if (invoice.companyId && invoice.company) {
      const company = await Company.findByPk(invoice.companyId);
      
      if (company) {
        // Desativar a empresa
        await company.update({
          status: false // Bloquear empresa
        });
        
        logger.info(`Company ${company.name} (ID: ${company.id}) blocked due to overdue payment ${payload.payment.id}`);
        
        // Emitir evento via Socket.IO para notificar o frontend sobre o bloqueio
        const io = getIO();
        io.emit(`company-${invoice.companyId}-status-updated`, {
          action: "company_blocked",
          company: {
            id: invoice.companyId,
            status: false,
            isExpired: true,
            reason: "payment_overdue"
          },
          invoice: {
            id: invoice.id,
            status: payload.payment.status,
            asaasInvoiceId: payload.payment.id
          }
        });
      }
    }

    // Emitir evento via Socket.IO para atualizar a interface em tempo real
    if (invoice.companyId) {
      const io = getIO();
      io.emit(`company-${invoice.companyId}-invoice-updated`, {
        action: "payment_overdue",
        invoice: {
          id: invoice.id,
          status: payload.payment.status,
          asaasInvoiceId: payload.payment.id
        }
      });
    }

    logger.info(`Payment overdue for invoice ${invoice.id} - Company blocked`);

  } catch (error: any) {
    logger.error('Error handling payment overdue:', error);
    throw error;
  }
};

// Lidar com exclusão de pagamento
const handlePaymentDeleted = async (payload: WebhookPayload, asaasConfig: AsaasConfig): Promise<void> => {
  try {
    if (!payload.payment) {
      logger.warn('Payment data not found in payload');
      return;
    }

    // Buscar fatura existente
    const invoice = await Invoices.findOne({
      where: { asaasInvoiceId: payload.payment.id }
    });

    if (!invoice) {
      logger.warn(`Invoice not found for payment ${payload.payment.id}`);
      return;
    }

    // Remover fatura
    await invoice.destroy();

    logger.info(`Invoice deleted: ${invoice.id} for payment ${payload.payment.id}`);

  } catch (error: any) {
    logger.error('Error handling payment deleted:', error);
    throw error;
  }
};

export default ProcessAsaasWebhookService;