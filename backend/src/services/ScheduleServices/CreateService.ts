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

  // Normalizar sendAt para lidar com datas sem horário (ex.: "YYYY-MM-DD") e ajustar horários de hoje no passado
  // Além disso, corrigir fuso horário quando o servidor estiver em UTC e o cliente enviar horário local sem offset.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(sendAt);
  const hasTime = /\d{2}:\d{2}/.test(sendAt);
  const hasExplicitTz = /([Zz]|[+-]\d{2}:?\d{2})$/.test(sendAt);

  const defaultOffsetMinutes = process.env.APP_TZ_OFFSET
    ? parseInt(String(process.env.APP_TZ_OFFSET), 10)
    : -180; // Padrão: -03:00 (Brasil)

  let normalizedSendAt = moment(sendAt);
  // Se possui horário mas não possui timezone explícito, aplicar offset padrão mantendo a hora local informada
  if (!isDateOnly && hasTime && !hasExplicitTz) {
    normalizedSendAt = moment(sendAt).utcOffset(defaultOffsetMinutes, true);
  }

  const now = moment();
  if (isDateOnly) {
    // Se vier apenas a data, ajustar para daqui a 2 minutos no dia atual selecionado
    const baseDay = moment(sendAt);
    if (baseDay.isSame(now, 'day')) {
      normalizedSendAt = now.clone().add(2, 'minutes').seconds(0).milliseconds(0);
    } else {
      // Para outras datas (futuras), definir um horário padrão (08:00) no fuso local configurado
      const base = moment(sendAt).startOf('day').add(8, 'hours');
      // Aplicar offset padrão mantendo 08:00 como hora local desejada
      normalizedSendAt = moment(base.format('YYYY-MM-DDTHH:mm')).utcOffset(defaultOffsetMinutes, true);
    }
  }

  // Se for no mesmo dia e o horário informado já passou (ou é muito próximo), ajustar para daqui a 2 minutos
  const minFuture = now.clone().add(1, 'minute');
  if (normalizedSendAt.isSame(now, 'day') && normalizedSendAt.isBefore(minFuture)) {
    normalizedSendAt = now.clone().add(2, 'minutes').seconds(0).milliseconds(0);
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
