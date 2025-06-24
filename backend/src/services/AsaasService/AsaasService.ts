import axios, { AxiosInstance } from "axios";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  observations?: string;
}

interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description: string;
  billingType: string;
  status: string;
  pixTransaction?: any;
  confirmedDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl: string;
  invoiceNumber: string;
  externalReference?: string;
  originalDueDate: string;
  paymentMethod?: string;
}

class AsaasService {
  public api: AxiosInstance; // Tornar público para uso em outros serviços
  private apiKey: string;
  private environment: string;

  constructor(apiKey: string, environment: string = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;
    
    const baseURL = environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';

    this.api = axios.create({
      baseURL,
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para logs
    this.api.interceptors.request.use(
      (config) => {
        logger.info(`Asaas API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Asaas API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        logger.info(`Asaas API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Asaas API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Criar cliente no Asaas
  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      const response = await this.api.post('/customers', customerData);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating Asaas customer:', error.response?.data || error.message);
      throw new AppError(`Erro ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Atualizar cliente no Asaas
  async updateCustomer(customerId: string, customerData: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    try {
      const response = await this.api.put(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating Asaas customer:', error.response?.data || error.message);
      throw new AppError(`Erro ao atualizar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Buscar cliente no Asaas
  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    try {
      const response = await this.api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting Asaas customer:', error.response?.data || error.message);
      throw new AppError(`Erro ao buscar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Criar assinatura no Asaas
  async createSubscription(subscriptionData: AsaasSubscription): Promise<AsaasSubscription> {
    try {
      const response = await this.api.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating Asaas subscription:', error.response?.data || error.message);
      throw new AppError(`Erro ao criar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Atualizar assinatura no Asaas
  async updateSubscription(subscriptionId: string, subscriptionData: Partial<AsaasSubscription>): Promise<AsaasSubscription> {
    try {
      const response = await this.api.put(`/subscriptions/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating Asaas subscription:', error.response?.data || error.message);
      throw new AppError(`Erro ao atualizar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Buscar assinatura no Asaas
  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    try {
      const response = await this.api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting Asaas subscription:', error.response?.data || error.message);
      throw new AppError(`Erro ao buscar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Cancelar assinatura no Asaas
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.api.delete(`/subscriptions/${subscriptionId}`);
    } catch (error: any) {
      logger.error('Error canceling Asaas subscription:', error.response?.data || error.message);
      throw new AppError(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Buscar pagamento no Asaas
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    try {
      const response = await this.api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting Asaas payment:', error.response?.data || error.message);
      throw new AppError(`Erro ao buscar pagamento no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Listar pagamentos de uma assinatura
  async getSubscriptionPayments(subscriptionId: string, limit: number = 100, offset: number = 0): Promise<{ data: AsaasPayment[], hasMore: boolean, totalCount: number }> {
    try {
      const response = await this.api.get(`/payments`, {
        params: {
          subscription: subscriptionId,
          limit,
          offset
        }
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error getting Asaas subscription payments:', error.response?.data || error.message);
      throw new AppError(`Erro ao buscar pagamentos da assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Baixar fatura em PDF
  async downloadInvoicePDF(paymentId: string): Promise<Buffer> {
    try {
      const response = await this.api.get(`/payments/${paymentId}/invoiceNumber`, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('Error downloading Asaas invoice PDF:', error.response?.data || error.message);
      throw new AppError(`Erro ao baixar PDF da fatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Validar webhook do Asaas
  validateWebhook(payload: any, signature: string): boolean {
    // Implementar validação de assinatura do webhook se necessário
    // Por enquanto, retorna true
    return true;
  }
}

export default AsaasService;