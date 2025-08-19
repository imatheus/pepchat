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

  // Normalizar sendAt para lidar com datas sem horário (ex.: "YYYY-MM-DD")
  let normalizedSendAt = moment(sendAt);
  if (/^\d{4}-\d{2}-\d{2}$/.test(sendAt)) {
    // Se vier apenas a data, ajustar para daqui a 2 minutos no dia atual selecionado
    const baseDay = moment(sendAt);
    const now = moment();
    if (baseDay.isSame(now, 'day')) {
      normalizedSendAt = now.add(2, 'minutes').seconds(0).milliseconds(0);
    } else {
      // Para outras datas (futuras), definir um horário padrão (08:00) no fuso local do servidor
      normalizedSendAt = baseDay.hour(8).minute(0).second(0).millisecond(0);
    }
  }

  if (!normalizedSendAt.isValid()) {
    throw new AppError("Data de envio inválida");
  }

  // Exigir pelo menos 1 minuto no futuro
  if (normalizedSendAt.isBefore(moment().add(1, 'minute'))) {
    console.log("🔧 CreateService - Date validation failed");
    throw new AppError("A data de envio deve ser pelo menos 1 minuto no futuro");
  }

  console.log("🔧 CreateService - Creating schedule in database");

  let schedule = await Schedule.create({
    body,
    sendAt: normalizedSendAt.toDate(),
    contactId: typeof contactId === 'string' ? parseInt(contactId) : contactId,
    companyId: typeof companyId === 'string' ? parseInt(companyId) : companyId,
    userId: typeof userId === 'string' ? parseInt(userId) : userId,
    status: 'PENDENTE'
  });

  console.log("🔧 CreateService - Schedule created, reloading...");
  await schedule.reload();
  console.log("🔧 CreateService - Schedule reloaded successfully");

  // Garantir include com profilePicUrl no retorno e socket
  try {
    schedule = await Schedule.findByPk(schedule.id, {
      include: [
        { model: require("../../models/Contact").default, as: "contact", attributes: ["id", "name", "profilePicUrl"] },
        { model: require("../../models/User").default, as: "user", attributes: ["id", "name"] }
      ]
    }) || schedule;
  } catch {}

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
