import { Op } from "sequelize";
import moment from "moment";

import Schedule from "../../models/Schedule";
import ScheduleJobService from "./ScheduleJobService";
import { logger } from "../../utils/logger";

const ProcessPendingSchedules = async (): Promise<void> => {
  try {
    logger.info("Checking pending schedules...");

    // Buscar agendamentos pendentes
    const pendingSchedules = await Schedule.findAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().subtract(1, 'day').toDate() // Últimas 24 horas para evitar spam
        }
      }
    });

    if (pendingSchedules.length === 0) {
      logger.info("No pending schedules found");
    } else {
      logger.info(`Found ${pendingSchedules.length} pending schedules`);

      // Reagendar cada um
      for (const schedule of pendingSchedules) {
        try {
          await ScheduleJobService(schedule);
          logger.info(`Schedule ${schedule.id} rescheduled successfully`);
        } catch (error) {
          logger.error(`Error rescheduling schedule ${schedule.id}:`, error);
          // Marcar como erro se não conseguir reagendar
          await schedule.update({ status: 'ERRO' });
        }
      }

      logger.info("Schedule processing completed");
    }

  } catch (error) {
    logger.error("Error processing schedules:", error);
  }
};

export default ProcessPendingSchedules;