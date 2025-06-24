import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import Whatsapp from "../../models/Whatsapp";
import GetCompanyActivePlanService from "../CompanyService/GetCompanyActivePlanService";

interface QueueData {
  name: string;
  color: string;
  companyId: number;
  greetingMessage?: string;
  outOfHoursMessage?: string;
  schedules?: any[];
}

const CreateQueueService = async (queueData: QueueData): Promise<Queue> => {
  const { color, name, companyId } = queueData;

  // Usar o novo serviço para obter os limites do plano ativo
  const planLimits = await GetCompanyActivePlanService({ companyId });

  const queuesCount = await Queue.count({
    where: {
      companyId
    }
  });

  if (queuesCount >= planLimits.queues) {
    throw new AppError(`Número máximo de filas já alcançado: ${queuesCount}`);
  }

  const queueSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_QUEUE_INVALID_NAME")
      .required("ERR_QUEUE_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_QUEUE_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameName = await Queue.findOne({
              where: { name: value, companyId }
            });

            return !queueWithSameName;
          }
          return false;
        }
      ),
    color: Yup.string()
      .required("ERR_QUEUE_INVALID_COLOR")
      .test("Check-color", "ERR_QUEUE_INVALID_COLOR", async value => {
        if (value) {
          const colorTestRegex = /^#[0-9a-f]{3,6}$/i;
          return colorTestRegex.test(value);
        }
        return false;
      })
      .test(
        "Check-color-exists",
        "ERR_QUEUE_COLOR_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameColor = await Queue.findOne({
              where: { color: value, companyId }
            });
            return !queueWithSameColor;
          }
          return false;
        }
      )
  });

  try {
    await queueSchema.validate({ color, name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const queue = await Queue.create({
    ...queueData,
    schedules: queueData.schedules || []
  });

  // Automaticamente associar o novo setor a todos os WhatsApps da empresa
  const whatsapps = await Whatsapp.findAll({
    where: { companyId }
  });

  if (whatsapps.length > 0) {
    console.log(`[CREATE QUEUE] Associando setor "${queue.name}" a ${whatsapps.length} WhatsApp(s)`);
    
    for (const whatsapp of whatsapps) {
      await whatsapp.$add("queues", queue.id);
      console.log(`[CREATE QUEUE] Setor "${queue.name}" associado ao WhatsApp "${whatsapp.name}"`);
    }
  }

  return queue;
};

export default CreateQueueService;