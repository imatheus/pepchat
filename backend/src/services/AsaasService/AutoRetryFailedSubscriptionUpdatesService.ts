import * as cron from "node-cron";
import { Op } from "sequelize";
import { logger } from "../../utils/logger";
import Company from "../../models/Company";
import CompanyPlan from "../../models/CompanyPlan";
import Plan from "../../models/Plan";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "./AsaasService";
import RetryFailedSubscriptionUpdatesService from "./RetryFailedSubscriptionUpdatesService";

interface FailedUpdate {
  companyId: number;
  expectedValue: number;
  planId: number;
  currentAsaasValue: number;
  difference: number;
}

class AutoRetryFailedSubscriptionUpdatesService {
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    // Executar a cada 30 minutos
    this.cronJob = cron.schedule('*/30 * * * *', () => {
      this.checkAndRetryFailedUpdates();
    }, {
      scheduled: false // Não iniciar automaticamente
    });
  }

  // Iniciar o serviço de retry automático
  start(): void {
    if (this.cronJob) {
      this.cronJob.start();
      logger.info('Auto retry service for failed subscription updates started');
    }
  }

  // Parar o serviço de retry automático
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Auto retry service for failed subscription updates stopped');
    }
  }

  // Verificar e reprocessar atualizações que falharam
  private async checkAndRetryFailedUpdates(): Promise<void> {
    if (this.isRunning) {
      logger.info('Auto retry service is already running, skipping this execution');
      return;
    }

    this.isRunning = true;

    try {
      logger.info('Starting automatic check for failed subscription updates...');

      // Verificar se o Asaas está configurado
      const asaasConfig = await AsaasConfig.findOne();
      if (!asaasConfig || !asaasConfig.enabled || !asaasConfig.apiKey) {
        logger.info('Asaas not configured or disabled, skipping auto retry');
        return;
      }

      const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);

      // Buscar todas as empresas com assinatura no Asaas
      const companies = await Company.findAll({
        where: {
          asaasSubscriptionId: { [Op.ne]: null }
        },
        include: [
          {
            model: Plan,
            as: 'plan'
          },
          {
            model: CompanyPlan,
            as: 'companyPlans',
            where: { isActive: true },
            required: false
          }
        ]
      });

      if (companies.length === 0) {
        logger.info('No companies with Asaas subscriptions found');
        return;
      }

      logger.info(`Checking ${companies.length} companies for subscription value mismatches...`);

      const failedUpdates: FailedUpdate[] = [];

      // Verificar cada empresa
      for (const company of companies) {
        try {
          if (!company.asaasSubscriptionId) continue;

          // Calcular valor esperado
          let expectedValue = 0;
          let planId = 0;

          const activeCompanyPlan = company.companyPlans?.find(cp => cp.isActive);
          if (activeCompanyPlan) {
            expectedValue = activeCompanyPlan.totalValue;
            planId = activeCompanyPlan.basePlanId;
          } else if (company.plan) {
            expectedValue = company.plan.value;
            planId = company.plan.id;
          } else {
            logger.warn(`Company ${company.name} (ID: ${company.id}) has no plan configured`);
            continue;
          }

          // Buscar valor atual no Asaas
          try {
            const subscription = await asaasService.getSubscription(company.asaasSubscriptionId);
            const currentAsaasValue = subscription.value;

            // Verificar se há diferença significativa (mais de R$ 0.01)
            const difference = Math.abs(currentAsaasValue - expectedValue);
            if (difference > 0.01) {
              logger.warn(`Value mismatch found for company ${company.name}: Expected ${expectedValue}, Asaas has ${currentAsaasValue}`);
              
              failedUpdates.push({
                companyId: company.id,
                expectedValue: expectedValue,
                planId: planId,
                currentAsaasValue: currentAsaasValue,
                difference: difference
              });
            }

          } catch (asaasError: any) {
            logger.error(`Error checking subscription for company ${company.name}: ${asaasError.message}`);
          }

        } catch (companyError: any) {
          logger.error(`Error processing company ${company.id}: ${companyError.message}`);
        }
      }

      // Se encontrou diferenças, tentar corrigir
      if (failedUpdates.length > 0) {
        logger.info(`Found ${failedUpdates.length} subscription value mismatches. Starting retry process...`);

        const retryRequests = failedUpdates.map(failed => ({
          companyId: failed.companyId,
          expectedValue: failed.expectedValue,
          planId: failed.planId,
          maxRetries: 2 // Menos tentativas no processo automático
        }));

        const results = await RetryFailedSubscriptionUpdatesService(retryRequests);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        logger.info(`Auto retry completed: ${successCount} successful, ${failCount} failed`);

        // Log detalhado dos resultados
        results.forEach(result => {
          if (result.success) {
            logger.info(`✓ Successfully updated subscription for company ${result.companyName} (ID: ${result.companyId})`);
          } else {
            logger.error(`✗ Failed to update subscription for company ${result.companyName} (ID: ${result.companyId}): ${result.error}`);
          }
        });

      } else {
        logger.info('No subscription value mismatches found');
      }

    } catch (error: any) {
      logger.error('Error in auto retry service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Executar verificação manual (para testes)
  async runManualCheck(): Promise<void> {
    logger.info('Running manual check for failed subscription updates...');
    await this.checkAndRetryFailedUpdates();
  }

  // Verificar status do serviço
  getStatus(): { isRunning: boolean; isScheduled: boolean } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob ? this.cronJob.getStatus() === 'scheduled' : false
    };
  }
}

// Instância singleton
const autoRetryService = new AutoRetryFailedSubscriptionUpdatesService();

export default autoRetryService;