import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CompanyPlan from "../../models/CompanyPlan";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "./AsaasService";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import moment from "moment";

interface Request {
  companyId: number;
}

interface Response {
  success: boolean;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  message: string;
}

const CreateAsaasCustomerForCompanyService = async ({
  companyId
}: Request): Promise<Response> => {
  try {
    // Buscar configuração global do Asaas
    const asaasConfig = await AsaasConfig.findOne();
    
    if (!asaasConfig || !asaasConfig.enabled || !asaasConfig.apiKey) {
      return {
        success: false,
        message: "Configuração do Asaas não encontrada ou inativa"
      };
    }

    // Buscar dados da empresa
    const company = await Company.findByPk(companyId);

    if (!company) {
      throw new AppError("Empresa não encontrada", 404);
    }

    // Buscar o plano personalizado da empresa (que considera o número de usuários)
    let companyPlan = await CompanyPlan.findOne({
      where: {
        companyId,
        isActive: true
      },
      include: [{ model: Plan, as: 'basePlan' }]
    });

    // Se não existe plano personalizado, buscar o plano base da empresa
    let planValue = 0;
    let planName = "";
    
    if (companyPlan) {
      planValue = companyPlan.totalValue;
      planName = companyPlan.name;
    } else {
      // Fallback: buscar plano base da empresa
      const companyWithPlan = await Company.findByPk(companyId, {
        include: [{ model: Plan, as: 'plan' }]
      });
      
      if (companyWithPlan && companyWithPlan.plan) {
        planValue = companyWithPlan.plan.value; // Valor base do plano (1 usuário)
        planName = companyWithPlan.plan.name;
      } else {
        return {
          success: false,
          message: "Empresa não possui plano configurado"
        };
      }
    }

    // Verificar se a empresa já foi sincronizada com o Asaas
    if (company.asaasCustomerId && company.asaasSubscriptionId) {
      return {
        success: false,
        message: "Empresa já foi sincronizada com o Asaas"
      };
    }

    // Criar instância do serviço Asaas
    const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);

    // Preparar dados do cliente
    const customerData = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      mobilePhone: company.phone,
      cpfCnpj: company.document,
      observations: `Cliente criado automaticamente - Sistema Smart Atendimento - Empresa ID: ${company.id}`
    };

    // Criar cliente no Asaas
    const asaasCustomer = await asaasService.createCustomer(customerData);

    logger.info(`Cliente Asaas criado: ${asaasCustomer.id} para empresa ${company.name}`);

    // Calcular data de início da assinatura (7 dias de trial)
    const nextDueDate = moment().add(7, 'days').format('YYYY-MM-DD');

    // Preparar dados da assinatura usando o valor correto do plano
    const subscriptionData = {
      customer: asaasCustomer.id!,
      billingType: 'BOLETO',
      value: planValue, // Usar o valor correto (personalizado ou base)
      nextDueDate,
      cycle: 'MONTHLY',
      description: `${planName}`,
      externalReference: `company_${companyId}_plan_${companyPlan?.id || 'base'}`
    };

    // Criar assinatura no Asaas
    const asaasSubscription = await asaasService.createSubscription(subscriptionData);

    logger.info(`Assinatura Asaas criada: ${asaasSubscription.id} para empresa ${company.name}`);

    // Atualizar a empresa com os IDs do Asaas
    await company.update({
      asaasCustomerId: asaasCustomer.id!,
      asaasSubscriptionId: asaasSubscription.id!,
      asaasSyncedAt: new Date()
    });

    return {
      success: true,
      asaasCustomerId: asaasCustomer.id!,
      asaasSubscriptionId: asaasSubscription.id!,
      message: `Cliente e assinatura criados no Asaas com sucesso`
    };

  } catch (error: any) {
    logger.error('Error creating Asaas customer for company:', error);
    return {
      success: false,
      message: error.message || "Erro ao criar cliente no Asaas"
    };
  }
};

export default CreateAsaasCustomerForCompanyService;