import * as Yup from "yup";
import moment from "moment";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import ShowService from "./ShowService";
import ScheduleJobService from "./ScheduleJobService";
import { logger } from "../../utils/logger";

interface ScheduleData {
  id?: number;
  body?: string;
  sendAt?: string;
  sentAt?: string;
  contactId?: number;
  companyId?: number;
  ticketId?: number;
  userId?: number;
  status?: string;
}

interface Request {
  scheduleData: ScheduleData;
  id: string | number;
  companyId: number;
}

const UpdateService = async ({
  scheduleData,
  id,
  companyId
}: Request): Promise<Schedule | undefined> => {
  let schedule = await ShowService(id, companyId);

  if (schedule?.companyId !== companyId) {
    throw new AppError("Não é possível alterar registros de outra empresa");
  }

  // Verificar se já foi enviado
  if (schedule.sentAt) {
    throw new AppError("Não é possível alterar um agendamento já enviado");
  }

  const schema = Yup.object().shape({
    body: Yup.string().min(5)
  });

  const {
    body,
    sendAt,
    sentAt,
    contactId,
    ticketId,
    userId,
  } = scheduleData;

  try {
    await schema.validate({ body });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  // Se a data de envio mudou, validar e reagendar (independente do status atual)
  const shouldReschedule = !!sendAt && new Date(sendAt).getTime() !== schedule.sendAt.getTime();
  
  let normalizedSendAt: moment.Moment | null = null;
  if (shouldReschedule) {
    // Normalizar nova data (suporta data e hora, com correção de fuso se necessário)
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(sendAt));
    const hasTime = /\d{2}:\d{2}/.test(String(sendAt));
    const hasExplicitTz = /([Zz]|[+-]\d{2}:?\d{2})$/.test(String(sendAt));
    const defaultOffsetMinutes = process.env.APP_TZ_OFFSET
      ? parseInt(String(process.env.APP_TZ_OFFSET), 10)
      : -180; // -03:00 default

    normalizedSendAt = moment(sendAt);
    if (!isDateOnly && hasTime && !hasExplicitTz) {
      normalizedSendAt = moment(String(sendAt)).utcOffset(defaultOffsetMinutes, true);
    }

    if (isDateOnly) {
      const baseDay = moment(String(sendAt));
      const now = moment();
      if (baseDay.isSame(now, 'day')) {
        normalizedSendAt = now.add(2, 'minutes').seconds(0).milliseconds(0);
      } else {
        const base = moment(String(sendAt)).startOf('day').add(8, 'hours');
        normalizedSendAt = moment(base.format('YYYY-MM-DDTHH:mm')).utcOffset(defaultOffsetMinutes, true);
      }
    }

    if (!normalizedSendAt.isValid()) {
      throw new AppError("Data de envio inválida");
    }
    
    if (normalizedSendAt.isBefore(moment().add(1, 'minute'))) {
      throw new AppError("A data de envio deve ser pelo menos 1 minuto no futuro");
    }

    // Cancelar jobs existentes para este agendamento
    try {
      const { scheduleQueue } = await import("../../queues");
      
      if (scheduleQueue) {
        const jobs = await scheduleQueue.getJobs(['waiting', 'delayed']);
        for (const job of jobs) {
          if (job.data.scheduleId === schedule.id) {
            await job.remove();
            logger.info(`Removed existing job for schedule ${schedule.id}`);
          }
        }
      }
    } catch (error) {
      logger.warn(`Error removing existing jobs for schedule ${schedule.id} (continuing with update):`, error);
    }
  }

  await schedule.update({
    body,
    sendAt: shouldReschedule ? normalizedSendAt!.toDate() : schedule.sendAt,
    sentAt: shouldReschedule ? null : (sentAt ? new Date(sentAt) : schedule.sentAt),
    contactId,
    ticketId,
    userId,
    status: shouldReschedule ? 'PENDENTE' : (schedule as any).status,
  });

  await schedule.reload();

  // Garantir include com profilePicUrl no retorno e socket
  try {
    schedule = await Schedule.findByPk(schedule.id, {
      include: [
        { model: require("../../models/Contact").default, as: "contact", attributes: ["id", "name", "profilePicUrl"] },
        { model: require("../../models/User").default, as: "user", attributes: ["id", "name"] }
      ]
    }) || schedule;
  } catch {}

  // Reagendar se necessário (não falhar se não conseguir)
  if (shouldReschedule) {
    try {
      await ScheduleJobService(schedule);
      logger.info(`Schedule ${schedule.id} updated and rescheduled successfully`);
    } catch (error) {
      logger.warn(`Error rescheduling job for schedule ${schedule.id}, but update was successful:`, error);
      // Não falhar a atualização se o job scheduling falhar
    }
  }

  return schedule;
};

export default UpdateService;
