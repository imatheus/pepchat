import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";
import ValidateCampaignLimitsService from "./ValidateCampaignLimitsService";

interface Data {
  name: string;
  status: string;
  confirmation: boolean;
  scheduledAt: string | null;
  companyId: number;
  contactListId: number;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage1?: string;
  confirmationMessage2?: string;
  confirmationMessage3?: string;
  confirmationMessage4?: string;
  confirmationMessage5?: string;
}

const CreateService = async (data: Data): Promise<Campaign> => {
  const { name, companyId, contactListId } = data;

  const ticketnoteSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "ERR_CAMPAIGN_INVALID_NAME")
      .required("ERR_CAMPAIGN_REQUIRED")
  });

  try {
    await ticketnoteSchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  // VALIDAÇÃO CRÍTICA DE SEGURANÇA: Verificar limites do plano no backend
  await ValidateCampaignLimitsService({
    companyId,
    contactListId
  });

  if (data.scheduledAt != null && data.scheduledAt != "") {
    data.status = "PROGRAMADA";
  }

  // Convert scheduledAt string to Date if provided
  const campaignData = {
    ...data,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null
  };

  const record = await Campaign.create(campaignData);

  await record.reload({
    include: [
      { model: ContactList },
      { model: Whatsapp, attributes: ["id", "name"] }
    ]
  });

  return record;
};

export default CreateService;
