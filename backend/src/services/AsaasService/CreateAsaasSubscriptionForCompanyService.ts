import moment from "moment";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CompanyPlan from "../../models/CompanyPlan";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "./AsaasService";
import { logger } from "../../utils/logger";

interface Request {
  companyId: number;
  planValue?: number; // Valor personalizado do plano (opcional)
  billingType?: string; // Tipo de cobrança (BOLETO, PIX, CREDIT_CARD, etc.)
  cycle?: string; // Ciclo de cobrança (MONTHLY, YEARLY, etc.)
}

interface Response {
  success: boolean;
  message: string;
  subscriptionId?: string;
  customerId?: string;
  nextDueDate?: string;
}

const CreateAsaasSubscriptionForCompanyService = async ({
  companyId,
  planValue,
  billingType = 'BOLETO',
  cycle = 'MONTHLY'
}: Request): Promise<Response> => {
  try {
    // Buscar a empresa
    const company = await Company.findByPk(companyId);

    if (!company) {
      throw new AppError("Empresa não encontrada", 404);
    }

    if (!company.dueDate) {
      throw new AppError("Empresa deve ter uma data de vencimento definida", 400);
    }

    // Buscar o plano personalizado da empresa
    let companyPlan = await CompanyPlan.findOne({
      where: {
        companyId,
        isActive: true
      },
      include: [{ model: Plan, as: 'basePlan' }]
    });

    // Buscar configuração do Asaas
    const asaasConfig = await AsaasConfig.findOne();
    if (!asaasConfig || !asaasConfig.enabled || !asaasConfig.apiKey) {
      throw new AppError("Configuração do Asaas não encontrada ou inativa", 400);
    }

    const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);

    // Se a empresa não tem customer no Asaas, criar primeiro
    if (!company.asaasCustomerId) {
      try {
        const customerData = {
          name: company.fullName || company.name,
          email: company.email,
          phone: company.phone,
          cpfCnpj: company.document
        };

        const asaasCustomer = await asaasService.createCustomer(customerData);
        
        await company.update({ 
          asaasCustomerId: asaasCustomer.id,
          asaasSyncedAt: new Date()
        });

        logger.info(`Cliente ${company.name} criado no Asaas: ${asaasCustomer.id}`);
      } catch (error: any) {
        throw new AppError(`Erro ao criar cliente no Asaas: ${error.message}`);
      }
    }

    // Determinar valor da assinatura
    let subscriptionValue = planValue;
    let subscriptionName = "Personalizado";
    
    if (!subscriptionValue && companyPlan) {
      subscriptionValue = companyPlan.totalValue; // Usar valor total do plano personalizado
      subscriptionName = companyPlan.name;
    } else if (!subscriptionValue) {
      // Fallback: buscar plano base da empresa
      const companyWithPlan = await Company.findByPk(companyId, {
        include: [{ model: Plan, as: 'plan' }]
      });
      
      if (companyWithPlan && companyWithPlan.plan) {
        subscriptionValue = companyWithPlan.plan.value; // Valor base do plano
        subscriptionName = companyWithPlan.plan.name;
      } else {
        subscriptionValue = 50; // Valor padrão
      }
    }

    // Criar assinatura no Asaas
    const subscriptionData = {
      customer: company.asaasCustomerId!,
      billingType,
      value: subscriptionValue,
      nextDueDate: company.dueDate,
      cycle,
      description: `${subscriptionName}`,
      externalReference: `company_${company.id}_subscription`
    };

    const asaasSubscription = await asaasService.createSubscription(subscriptionData);

    // Atualizar empresa com dados da assinatura
    await company.update({
      asaasSubscriptionId: asaasSubscription.id,
      asaasSyncedAt: new Date()
    });

    logger.info(`Assinatura criada no Asaas para empresa ${company.name}: ${asaasSubscription.id}`);

    return {
      success: true,
      message: `Assinatura criada com sucesso no Asaas`,
      subscriptionId: asaasSubscription.id,
      customerId: company.asaasCustomerId!,
      nextDueDate: asaasSubscription.nextDueDate
    };

  } catch (error: any) {
    logger.error('Error creating Asaas subscription for company:', error);
    throw new AppError(error.message || "Erro ao criar assinatura no Asaas");
  }
};

export default CreateAsaasSubscriptionForCompanyService;