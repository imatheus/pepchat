import moment from "moment";
import { logger } from "../../utils/logger";
import Schedule from "../../models/Schedule";

interface ScheduleJobData {
  scheduleId: number;
  sendAt: string;
}

const ScheduleJobService = async (schedule: Schedule): Promise<void> => {
  try {
    const sendAt = moment(schedule.sendAt);
    const now = moment();
    
    // Calcular delay em milissegundos
    const delay = sendAt.diff(now);
    
    logger.info(`Attempting to schedule job for schedule ${schedule.id}`);
    
    try {
      // Importar scheduleQueue dinamicamente para evitar erros de inicialização
      const { scheduleQueue, redisAvailable } = await import("../../queues");
      
      if (!scheduleQueue || !redisAvailable) {
        throw new Error("Schedule queue not available");
      }
      
      if (delay <= 0) {
        // Se a data já passou, processar imediatamente
        logger.info(`Schedule ${schedule.id} is overdue, processing immediately`);
        await scheduleQueue.add(
          "ProcessSchedule",
          { scheduleId: schedule.id },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000
            }
          }
        );
      } else {
        // Agendar para o futuro
        logger.info(`Scheduling job for schedule ${schedule.id} to run at ${sendAt.format()}`);
        await scheduleQueue.add(
          "ProcessSchedule",
          { scheduleId: schedule.id },
          {
            delay,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000
            }
          }
        );
      }
      
      logger.info(`Job scheduled successfully for schedule ${schedule.id}`);
      
    } catch (queueError) {
      logger.warn(`Queue system not available for schedule ${schedule.id}:`, queueError);
      // Fallback: processar diretamente sem fila (caso Redis não esteja disponível)
      try {
        const { ProcessScheduleDirect } = await import("./ProcessScheduleDirect");
        // Se ainda falta tempo, agenda um setTimeout local para executar no horário exato com jitter
        const remaining = moment(schedule.sendAt).diff(moment());
        const jitter = (schedule.id % 500); // até 500ms de jitter para evitar rajadas simultâneas
        const waitMs = remaining > 0 ? remaining + 500 + jitter : 0; // pequeno buffer + jitter

        if (waitMs > 0) {
          logger.info(`Queue unavailable: will process schedule ${schedule.id} directly in ${waitMs} ms`);
          setTimeout(async () => {
            try {
              await ProcessScheduleDirect(schedule.id);
            } catch (e) {
              logger.warn(`Direct timed processing failed for schedule ${schedule.id}:`, e);
            }
          }, waitMs);
        } else {
          await ProcessScheduleDirect(schedule.id);
        }
      } catch (directError) {

        logger.warn(`Direct processing failed for schedule ${schedule.id}:`, directError);
        // Não falhar se o processamento direto também falhar
        logger.info(`Schedule ${schedule.id} will be processed when queue system is available`);
      }

    }
    
  } catch (error) {
    logger.error(`Error in ScheduleJobService for schedule ${schedule.id}:`, error);
    // Não propagar o erro para não impedir a criação do agendamento
    logger.warn(`Schedule ${schedule.id} created but job scheduling failed - will be processed on system restart`);
  }
};

export default ScheduleJobService;