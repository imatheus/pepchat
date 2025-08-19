import { Op } from "sequelize";
import moment from "moment";

import Schedule from "../../models/Schedule";
import ScheduleJobService from "./ScheduleJobService";
import { logger } from "../../utils/logger";

const ProcessPendingSchedules = async (): Promise<void> => {
  try {
    // Reduced logging - only log when schedules are found
    const pendingSchedules = await Schedule.findAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().subtract(1, 'day').toDate() // Últimas 24 horas para evitar spam
        }
      }
    });

    if (pendingSchedules.length > 0) {
      // Reagendar cada um
      for (const schedule of pendingSchedules) {
        try {
          await ScheduleJobService(schedule);
        } catch (error) {
          // Marcar como erro se não conseguir reagendar
          await schedule.update({ status: 'ERRO' });
        }
      }
    }

  } catch (error) {
    logger.error("Error processing schedules:", error);
  }
};

export default ProcessPendingSchedules;