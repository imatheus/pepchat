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
      const { scheduleQueue } = await import("../../queues");
      
      if (!scheduleQueue) {
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
      // Não falhar se o sistema de filas não estiver disponível
      // O agendamento será processado quando o sistema for reiniciado
      logger.info(`Schedule ${schedule.id} will be processed when queue system is available`);
    }
    
  } catch (error) {
    logger.error(`Error in ScheduleJobService for schedule ${schedule.id}:`, error);
    // Não propagar o erro para não impedir a criação do agendamento
    logger.warn(`Schedule ${schedule.id} created but job scheduling failed - will be processed on system restart`);
  }
};

export default ScheduleJobService;