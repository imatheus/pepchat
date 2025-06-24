import Schedule from "../../models/Schedule";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

const DeleteService = async (id: string | number, companyId: number): Promise<void> => {
  console.log(`🔧 DeleteService - Finding schedule ${id} for company ${companyId}`);
  
  const schedule = await Schedule.findOne({
    where: { id, companyId }
  });

  if (!schedule) {
    console.log(`🔧 DeleteService - Schedule ${id} not found`);
    throw new AppError("ERR_NO_SCHEDULE_FOUND", 404);
  }

  console.log(`🔧 DeleteService - Schedule ${schedule.id} found, proceeding with deletion`);

  // Tentar cancelar jobs pendentes (não bloquear se falhar)
  setTimeout(async () => {
    try {
      console.log(`🔧 DeleteService - Attempting to cancel jobs in background`);
      const { scheduleQueue } = await import("../../queues");
      
      if (scheduleQueue) {
        const jobs = await scheduleQueue.getJobs(['waiting', 'delayed']);
        for (const job of jobs) {
          if (job.data.scheduleId === schedule.id) {
            await job.remove();
            logger.info(`Removed job for deleted schedule ${schedule.id}`);
          }
        }
      }
    } catch (error) {
      logger.warn(`Background job cancellation failed for schedule ${schedule.id}:`, error);
    }
  }, 100); // Executar em background após 100ms

  console.log(`🔧 DeleteService - Destroying schedule ${schedule.id}`);
  await schedule.destroy();
  console.log(`🔧 DeleteService - Schedule ${schedule.id} destroyed successfully`);
  logger.info(`Schedule ${schedule.id} deleted successfully`);
};

export default DeleteService;
