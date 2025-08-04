import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import CompanyPlan from "../../models/CompanyPlan";
import Plan from "../../models/Plan";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "./AsaasService";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";

interface RetryRequest {
  companyId: number;
  expectedValue: number;
  planId: number;
  maxRetries?: number;
}

interface RetryResult {
  success: boolean;
  companyId: number;
  companyName: string;
  oldValue?: number;
  newValue?: number;
  error?: string;
  retryAttempt: number;
}

const RetryFailedSubscriptionUpdatesService = async (
  retryRequests: RetryRequest[]
): Promise<RetryResult[]> => {
  const results: RetryResult[] = [];

  // Buscar configuração do Asaas
  const asaasConfig = await AsaasConfig.findOne();
  if (!asaasConfig) {
    throw new AppError("ERR_ASAAS_CONFIG_NOT_FOUND");
  }

  const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);

  for (const request of retryRequests) {
    const maxRetries = request.maxRetries || 3;
    let retryAttempt = 0;
    let success = false;
    let lastError = "";

    while (retryAttempt < maxRetries && !success) {
      retryAttempt++;
      
      try {
        logger.info(`Retry attempt ${retryAttempt}/${maxRetries} for company ${request.companyId}`);

        // Buscar a empresa
        const company = await Company.findByPk(request.companyId, {
          include: [
            {
              model: CompanyPlan,
              as: 'companyPlans',
              where: { isActive: true },
              required: false
            },
            {
              model: Plan,
              as: 'plan'
            }
          ]
        });

        if (!company) {
          throw new AppError(`Company ${request.companyId} not found`);
        }

        if (!company.asaasSubscriptionId) {
          throw new AppError(`Company ${company.name} has no Asaas subscription ID`);
        }

        // Buscar o plano atual para verificar se o valor ainda está correto
        const plan = await Plan.findByPk(request.planId);
        if (!plan) {
          throw new AppError(`Plan ${request.planId} not found`);
        }

        // Verificar se o valor esperado ainda é válido
        let currentExpectedValue = request.expectedValue;
        let licenseCount = 1;
        let description = `${plan.name}`;

        const activeCompanyPlan = company.companyPlans?.find(cp => cp.isActive);
        if (activeCompanyPlan) {
          licenseCount = activeCompanyPlan.users;
          currentExpectedValue = plan.value * licenseCount;
          description = `${plan.name}`;
        }

        // Se o valor esperado mudou desde a última tentativa, atualizar
        if (currentExpectedValue !== request.expectedValue) {
          logger.info(`Expected value changed for company ${company.name}: ${request.expectedValue} → ${currentExpectedValue}`);
          request.expectedValue = currentExpectedValue;
        }

        // Buscar valor atual da assinatura no Asaas
        const currentSubscription = await asaasService.getSubscription(company.asaasSubscriptionId);
        const oldValue = currentSubscription.value;

        // Verificar se a atualização ainda é necessária
        if (oldValue === currentExpectedValue) {
          logger.info(`Subscription for company ${company.name} already has correct value: ${currentExpectedValue}`);
          success = true;
          
          results.push({
            success: true,
            companyId: company.id,
            companyName: company.name,
            oldValue: oldValue,
            newValue: currentExpectedValue,
            retryAttempt
          });
          
          continue;
        }

        // Tentar atualizar a assinatura
        await asaasService.updateSubscription(company.asaasSubscriptionId, {
          value: currentExpectedValue,
          description: description
        });

        success = true;
        logger.info(`Successfully updated subscription for company ${company.name} on retry attempt ${retryAttempt}: ${oldValue} → ${currentExpectedValue}`);

        // Emitir evento via Socket.IO
        const io = getIO();
        io.emit(`company-${company.id}-subscription-updated`, {
          action: "plan_value_adjusted_retry",
          company: {
            id: company.id,
            name: company.name
          },
          plan: {
            id: plan.id,
            name: plan.name
          },
          subscription: {
            oldTotalValue: oldValue,
            newTotalValue: currentExpectedValue,
            licenseCount: licenseCount
          },
          retryAttempt: retryAttempt
        });

        results.push({
          success: true,
          companyId: company.id,
          companyName: company.name,
          oldValue: oldValue,
          newValue: currentExpectedValue,
          retryAttempt
        });

      } catch (error: any) {
        lastError = error.message;
        logger.error(`Retry attempt ${retryAttempt} failed for company ${request.companyId}: ${error.message}`);
        
        // Se não é o último retry, aguardar antes da próxima tentativa
        if (retryAttempt < maxRetries) {
          const waitTime = Math.pow(2, retryAttempt) * 1000; // Backoff exponencial
          logger.info(`Waiting ${waitTime}ms before next retry attempt...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // Se todas as tentativas falharam
    if (!success) {
      const company = await Company.findByPk(request.companyId);
      results.push({
        success: false,
        companyId: request.companyId,
        companyName: company?.name || `Company ${request.companyId}`,
        error: lastError,
        retryAttempt: maxRetries
      });

      logger.error(`All retry attempts failed for company ${request.companyId}. Final error: ${lastError}`);
    }
  }

  // Log resumo dos resultados
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  logger.info(`Retry operation completed: ${successCount} successful, ${failCount} failed`);

  return results;
};

export default RetryFailedSubscriptionUpdatesService;