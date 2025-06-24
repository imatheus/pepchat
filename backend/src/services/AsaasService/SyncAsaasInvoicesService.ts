import fs from "fs";
import path from "path";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "./AsaasService";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import moment from "moment";

interface Request {
  companyId?: number; // Opcional - se não informado, busca de todas as empresas
  limit?: number;
  offset?: number;
}

interface Response {
  totalInvoices: number;
  synchronized: number;
  updated: number;
  errors: string[];
  details: Array<{
    invoiceId: string;
    companyId?: number;
    companyName?: string;
    status: 'created' | 'updated' | 'error';
    message: string;
  }>;
}

const SyncAsaasInvoicesService = async ({
  companyId,
  limit = 100,
  offset = 0
}: Request): Promise<Response> => {
  try {
    // Buscar configuração global do Asaas
    const asaasConfig = await AsaasConfig.findOne();

    if (!asaasConfig || !asaasConfig.enabled || !asaasConfig.apiKey) {
      throw new AppError("Configuração do Asaas não encontrada ou inativa", 400);
    }

    // Criar instância do serviço Asaas
    const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);

    const result: Response = {
      totalInvoices: 0,
      synchronized: 0,
      updated: 0,
      errors: [],
      details: []
    };

    // Buscar pagamentos do Asaas
    let payments;
    if (companyId) {
      // Buscar pagamentos de uma empresa específica (se tivermos como identificar)
      payments = await asaasService.getSubscriptionPayments("", limit, offset);
    } else {
      // Buscar todos os pagamentos recentes
      try {
        const response = await asaasService.api.get('/payments', {
          params: {
            limit,
            offset,
            dateCreated: moment().subtract(30, 'days').format('YYYY-MM-DD') // Últimos 30 dias
          }
        });
        payments = response.data;
      } catch (error: any) {
        throw new AppError(`Erro ao buscar pagamentos do Asaas: ${error.message}`);
      }
    }

    result.totalInvoices = payments.data?.length || 0;

    logger.info(`Sincronizando ${result.totalInvoices} faturas do Asaas`);

    // Processar cada pagamento
    for (const payment of payments.data || []) {
      try {
        // Tentar identificar a empresa pelo externalReference ou customer
        let targetCompanyId = null;
        let companyName = "Não identificada";

        if (payment.externalReference) {
          const match = payment.externalReference.match(/company_(\d+)_/);
          if (match) {
            targetCompanyId = parseInt(match[1]);
          }
        }

        // Se não conseguiu identificar pela referência, tentar pelo customer
        if (!targetCompanyId && payment.customer) {
          // Buscar empresa pelo customer ID do Asaas (seria necessário armazenar essa relação)
          // Por enquanto, vamos usar a primeira empresa ativa como fallback
          const company = await Company.findOne({ where: { status: true } });
          if (company) {
            targetCompanyId = company.id;
            companyName = company.name;
          }
        } else if (targetCompanyId) {
          const company = await Company.findByPk(targetCompanyId);
          if (company) {
            companyName = company.name;
          }
        }

        if (!targetCompanyId) {
          result.errors.push(`Não foi possível identificar a empresa para o pagamento ${payment.id}`);
          result.details.push({
            invoiceId: payment.id,
            status: 'error',
            message: 'Empresa não identificada'
          });
          continue;
        }

        // Verificar se a fatura já existe
        const existingInvoice = await Invoices.findOne({
          where: { asaasInvoiceId: payment.id }
        });

        if (existingInvoice) {
          // Atualizar fatura existente se necessário
          const needsUpdate = 
            existingInvoice.status !== payment.status ||
            (payment.paymentDate && existingInvoice.paymentDate !== new Date(payment.paymentDate)) ||
            existingInvoice.paymentMethod !== payment.paymentMethod;

          if (needsUpdate) {
            await existingInvoice.update({
              status: payment.status,
              paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
              paymentMethod: payment.paymentMethod,
              invoiceUrl: payment.invoiceUrl
            });

            // Se o pagamento foi confirmado, ativar a empresa
            if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
              await Company.update(
                { status: true },
                { where: { id: targetCompanyId } }
              );
            }

            result.updated++;
            result.details.push({
              invoiceId: payment.id,
              companyId: targetCompanyId,
              companyName,
              status: 'updated',
              message: 'Fatura atualizada com sucesso'
            });
          }
        } else {
          // Criar nova fatura
          const invoice = await Invoices.create({
            detail: payment.description || `Fatura Asaas - ${payment.id}`,
            status: payment.status,
            value: payment.value,
            dueDate: payment.originalDueDate,
            companyId: targetCompanyId,
            asaasInvoiceId: payment.id,
            asaasSubscriptionId: payment.subscription,
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
            billingType: payment.billingType,
            invoiceUrl: payment.invoiceUrl
          });

          // Baixar e salvar PDF da fatura
          await downloadAndSaveInvoicePDF(payment.id, asaasConfig, invoice.id, targetCompanyId);

          // Se o pagamento foi confirmado, ativar a empresa
          if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
            await Company.update(
              { status: true },
              { where: { id: targetCompanyId } }
            );
          }

          result.synchronized++;
          result.details.push({
            invoiceId: payment.id,
            companyId: targetCompanyId,
            companyName,
            status: 'created',
            message: 'Fatura criada com sucesso'
          });
        }

        logger.info(`Fatura ${payment.id} processada para empresa ${companyName}`);

      } catch (error: any) {
        const errorMsg = `Erro ao processar pagamento ${payment.id}: ${error.message}`;
        logger.error(errorMsg);
        result.errors.push(errorMsg);
        result.details.push({
          invoiceId: payment.id,
          status: 'error',
          message: error.message
        });
      }
    }

    logger.info(`Sincronização de faturas concluída: ${result.synchronized} criadas, ${result.updated} atualizadas, ${result.errors.length} erros`);

    return result;

  } catch (error: any) {
    logger.error('Error syncing Asaas invoices:', error);
    throw new AppError(error.message || "Erro ao sincronizar faturas do Asaas");
  }
};

// Baixar e salvar PDF da fatura
const downloadAndSaveInvoicePDF = async (paymentId: string, asaasConfig: AsaasConfig, invoiceId: number, companyId: number): Promise<void> => {
  try {
    const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);
    
    // Baixar PDF
    const pdfBuffer = await asaasService.downloadInvoicePDF(paymentId);
    
    // Criar diretório se não existir
    const currentMonth = moment().format('YYYY-MM');
    const invoiceDir = path.join(process.cwd(), 'uploads', companyId.toString(), 'invoices', currentMonth);
    
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
    
    // Salvar arquivo
    const fileName = `invoice_${invoiceId}_${paymentId}.pdf`;
    const filePath = path.join(invoiceDir, fileName);
    
    fs.writeFileSync(filePath, pdfBuffer);
    
    logger.info(`PDF da fatura salvo: ${filePath}`);
    
  } catch (error: any) {
    logger.error('Error downloading and saving invoice PDF:', error);
    // Não lançar erro para não interromper a sincronização
  }
};

export default SyncAsaasInvoicesService;