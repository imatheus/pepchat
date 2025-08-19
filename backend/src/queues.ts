import Queue from "bull";
import * as Sentry from "@sentry/node";

import { logger } from "./utils/logger";

const redisConfig = {
  redis: {
    host: process.env.IO_REDIS_SERVER || "127.0.0.1",
    port: +(process.env.IO_REDIS_PORT || "6379"),
    password: process.env.IO_REDIS_PASSWORD || undefined,
    db: 3,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true
  }
};

let scheduleQueue: Queue.Queue | null = null;
let campaignQueue: Queue.Queue | null = null;
let autoAssignQueue: Queue.Queue | null = null;
let redisAvailable = false;

// Função para testar conexão Redis
const testRedisConnection = async () => {
  try {
    const testQueue = new Queue("TestQueue", redisConfig);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Redis connection timeout"));
      }, 5000);

      testQueue.on('ready', () => {
        clearTimeout(timeout);
        testQueue.close();
        resolve(true);
      });

      testQueue.on('error', (error) => {
        clearTimeout(timeout);
        testQueue.close();
        reject(error);
      });
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Inicializar filas com tratamento de erro
const initializeQueues = async () => {
  try {
    redisAvailable = await testRedisConnection();
    
    if (redisAvailable) {
      scheduleQueue = new Queue("ScheduleQueue", redisConfig);
      campaignQueue = new Queue("CampaignQueue", redisConfig);
      autoAssignQueue = new Queue("AutoAssignQueue", redisConfig);
      
      scheduleQueue.on('error', (error) => {
        logger.warn("Schedule queue error:", error.message);
        redisAvailable = false;
      });
      
      campaignQueue.on('error', (error) => {
        logger.warn("Campaign queue error:", error.message);
        redisAvailable = false;
      });

      autoAssignQueue.on('error', (error) => {
        logger.warn("Auto assign queue error:", error.message);
        redisAvailable = false;
      });
      
    } else {
      // Redis not available - campaigns will be processed directly (logging removed)
    }
  } catch (error) {
    redisAvailable = false;
  }
};

// Inicializar na importação
initializeQueues();

// Exportar filas (podem ser null se Redis não estiver disponível)
export { scheduleQueue, campaignQueue, autoAssignQueue, redisAvailable };

export const startQueueProcess = async () => {
  try {
    if (!redisAvailable || !scheduleQueue || !campaignQueue || !autoAssignQueue) {
      return;
    }

    // Importar processadores dinamicamente
    const ProcessScheduleJob = (await import("./services/ScheduleServices/ProcessScheduleJob")).default;
    const ProcessCampaignJob = (await import("./services/CampaignService/ProcessCampaignJob")).default;
    const ProcessAutoAssignJob = (await import("./services/TicketServices/ProcessAutoAssignJob")).default;

    // Processamento de agendamentos
    scheduleQueue.process("ProcessSchedule", ProcessScheduleJob);

    // Processamento de campanhas
    campaignQueue.process("ProcessCampaign", ProcessCampaignJob);

    // Processamento de auto-atribuição de tickets
    autoAssignQueue.process("ProcessAutoAssign", ProcessAutoAssignJob);

    // Event listeners para logs
    scheduleQueue.on("completed", (job, result) => {
    });

    scheduleQueue.on("failed", (job, err) => {
      logger.error(`Schedule job ${job.id} failed with error: ${err.message}`);
      Sentry.captureException(err);
    });

    campaignQueue.on("completed", (job, result) => {
    });

    campaignQueue.on("failed", (job, err) => {
      logger.error(`Campaign job ${job.id} failed with error: ${err.message}`);
      Sentry.captureException(err);
    });

    autoAssignQueue.on("completed", (job, result) => {
    });

    autoAssignQueue.on("failed", (job, err) => {
      logger.error(`Auto assign job ${job.id} failed with error: ${err.message}`);
      Sentry.captureException(err);
    });

    
    // Limpar jobs antigos (com tratamento de erro mais robusto)
    try {
      if (scheduleQueue && typeof scheduleQueue.clean === 'function') {
        await scheduleQueue.clean(24 * 60 * 60 * 1000, "completed");
        await scheduleQueue.clean(24 * 60 * 60 * 1000, "failed");
      }
      
      if (campaignQueue && typeof campaignQueue.clean === 'function') {
        await campaignQueue.clean(24 * 60 * 60 * 1000, "completed");
        await campaignQueue.clean(24 * 60 * 60 * 1000, "failed");
      }

      if (autoAssignQueue && typeof autoAssignQueue.clean === 'function') {
        await autoAssignQueue.clean(24 * 60 * 60 * 1000, "completed");
        await autoAssignQueue.clean(24 * 60 * 60 * 1000, "failed");
      }
    } catch (cleanError) {
      // Ignorar erros de limpeza silenciosamente
    }
    
    
  } catch (error) {
    // Não falhar a inicialização do servidor se as filas falharem
  }
};