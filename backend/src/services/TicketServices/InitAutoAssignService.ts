import { autoAssignQueue, redisAvailable } from "../../queues";
import { logger } from "../../utils/logger";
import Company from "../../models/Company";
import AutoAssignTicketService from "./AutoAssignTicketService";

/**
 * Serviço para inicializar jobs de auto-atribuição de tickets para todas as empresas
 */
const InitAutoAssignService = async (): Promise<void> => {
  try {
    logger.info("Initializing auto assign service...");

    // Buscar todas as empresas ativas
    const companies = await Company.findAll({
      where: { status: true },
      attributes: ["id", "name"]
    });

    if (companies.length === 0) {
      logger.info("No active companies found for auto assign");
      return;
    }

    logger.info(`Found ${companies.length} active companies for auto assign`);

    if (redisAvailable && autoAssignQueue) {
      // Se Redis estiver disponível, usar filas
      logger.info("Using Redis queue for auto assign jobs");

      // Limpar jobs existentes para evitar duplicatas
      const existingJobs = await autoAssignQueue.getRepeatableJobs();
      for (const job of existingJobs) {
        await autoAssignQueue.removeRepeatableByKey(job.key);
      }

      // Criar jobs recorrentes para cada empresa (executa a cada 2 minutos)
      for (const company of companies) {
        await autoAssignQueue.add(
          "ProcessAutoAssign",
          { companyId: company.id },
          {
            repeat: { cron: "*/2 * * * *" }, // A cada 2 minutos
            jobId: `auto-assign-${company.id}`,
            removeOnComplete: 10,
            removeOnFail: 5
          }
        );

        logger.info(`Auto assign job scheduled for company ${company.name} (${company.id})`);
      }

      logger.info("Auto assign jobs scheduled successfully with Redis");
    } else {
      // Se Redis não estiver disponível, executar diretamente em intervalos
      logger.info("Redis not available, using direct execution for auto assign");

      const executeAutoAssign = async () => {
        for (const company of companies) {
          try {
            await AutoAssignTicketService(company.id);
          } catch (error) {
            logger.error(error, `Error in direct auto assign for company ${company.id}`);
          }
        }
      };

      // Executar imediatamente
      await executeAutoAssign();

      // Configurar execução periódica (a cada 2 minutos)
      setInterval(executeAutoAssign, 2 * 60 * 1000);

      logger.info("Auto assign service initialized with direct execution");
    }

  } catch (error) {
    logger.error(error, "Error initializing auto assign service");
  }
};

/**
 * Serviço para executar auto-atribuição para uma empresa específica
 */
const ExecuteAutoAssignForCompany = async (companyId: number): Promise<void> => {
  try {
    if (redisAvailable && autoAssignQueue) {
      // Adicionar job imediato na fila
      await autoAssignQueue.add(
        "ProcessAutoAssign",
        { companyId },
        {
          priority: 10, // Alta prioridade para execução imediata
          removeOnComplete: 5,
          removeOnFail: 3
        }
      );
      
      logger.info(`Immediate auto assign job queued for company ${companyId}`);
    } else {
      // Executar diretamente
      await AutoAssignTicketService(companyId);
      logger.info(`Direct auto assign executed for company ${companyId}`);
    }
  } catch (error) {
    logger.error(error, `Error executing auto assign for company ${companyId}`);
  }
};

export { InitAutoAssignService, ExecuteAutoAssignForCompany };