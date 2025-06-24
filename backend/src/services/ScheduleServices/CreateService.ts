import * as Yup from "yup";
import moment from "moment";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import ScheduleJobService from "./ScheduleJobService";
import { logger } from "../../utils/logger";

interface Request {
  body: string;
  sendAt: string;
  contactId: number | string;
  companyId: number | string;
  userId?: number | string;
}

const CreateService = async ({
  body,
  sendAt,
  contactId,
  companyId,
  userId
}: Request): Promise<Schedule> => {
  console.log("🔧 CreateService - Starting validation");
  
  const schema = Yup.object().shape({
    body: Yup.string().required().min(5),
    sendAt: Yup.string().required()
  });

  try {
    await schema.validate({ body, sendAt });
    console.log("🔧 CreateService - Validation passed");
  } catch (err: any) {
    console.log("🔧 CreateService - Validation failed:", err.message);
    throw new AppError(err.message);
  }

  // Validar se a data de envio não é no passado (permitir até 2 minutos atrás)
  const sendAtMoment = moment(sendAt);
  const now = moment();
  
  if (!sendAtMoment.isValid()) {
    throw new AppError("Data de envio inválida");
  }
  
  if (sendAtMoment.isBefore(now.subtract(2, 'minutes'))) {
    console.log("🔧 CreateService - Date validation failed");
    throw new AppError("A data de envio deve ser pelo menos 1 minuto no futuro");
  }

  console.log("🔧 CreateService - Creating schedule in database");

  const schedule = await Schedule.create({
    body,
    sendAt: new Date(sendAt),
    contactId: typeof contactId === 'string' ? parseInt(contactId) : contactId,
    companyId: typeof companyId === 'string' ? parseInt(companyId) : companyId,
    userId: typeof userId === 'string' ? parseInt(userId) : userId,
    status: 'PENDENTE'
  });

  console.log("🔧 CreateService - Schedule created, reloading...");
  await schedule.reload();
  console.log("🔧 CreateService - Schedule reloaded successfully");

  // Agendar o job para processamento (não falhar se não conseguir)
  try {
    await ScheduleJobService(schedule);
    logger.info(`Schedule ${schedule.id} created and job scheduled successfully`);
  } catch (error) {
    logger.warn(`Error scheduling job for schedule ${schedule.id}, but schedule was created:`, error);
    // Não falhar a criação do agendamento se o job scheduling falhar
    // O job será processado quando o sistema for reiniciado
  }

  return schedule;
};

export default CreateService;
