import { Op } from "sequelize";
import Campaign from "../../models/Campaign";
import ContactListItem from "../../models/ContactListItem";
import GetCompanyActivePlanService from "../CompanyService/GetCompanyActivePlanService";
import AppError from "../../errors/AppError";

interface Request {
  companyId: number;
  contactListId?: number;
  campaignId?: number; // Para edição de campanha existente
}

interface ValidationResult {
  isValid: boolean;
  maxContacts: number;
  currentMonthCampaigns: number;
  maxCampaignsPerMonth: number;
  contactsInList?: number;
}

const ValidateCampaignLimitsService = async ({
  companyId,
  contactListId,
  campaignId
}: Request): Promise<ValidationResult> => {
  // Obter limites do plano ativo da empresa
  const planLimits = await GetCompanyActivePlanService({ companyId });

  // Verificar se campanhas estão habilitadas no plano
  if (!planLimits.useCampaigns) {
    throw new AppError("Campanhas não estão habilitadas no seu plano atual", 403);
  }

  // Obter limites de campanhas
  const maxContacts = planLimits.campaignContactsLimit || 0;
  const maxCampaignsPerMonth = planLimits.campaignsPerMonthLimit || 0;

  // Verificar limite de campanhas por mês
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

  // Contar campanhas criadas no mês atual (excluindo a campanha sendo editada)
  const whereCondition: any = {
    companyId,
    createdAt: {
      [Op.between]: [firstDayOfMonth, lastDayOfMonth]
    }
  };

  // Se estamos editando uma campanha, excluí-la da contagem
  if (campaignId) {
    whereCondition.id = {
      [Op.ne]: campaignId
    };
  }

  const currentMonthCampaigns = await Campaign.count({
    where: whereCondition
  });

  let contactsInList = 0;
  
  // Se foi fornecida uma lista de contatos, verificar quantos contatos ela tem
  if (contactListId) {
    contactsInList = await ContactListItem.count({
      where: {
        contactListId,
        isWhatsappValid: true // Só contar contatos válidos
      }
    });

    // Validar limite de contatos por campanha
    if (contactsInList > maxContacts) {
      throw new AppError(
        `A lista de contatos possui ${contactsInList} contatos válidos, mas seu plano permite apenas ${maxContacts} contatos por campanha`,
        400
      );
    }
  }

  // Validar limite de campanhas por mês (apenas para novas campanhas)
  if (!campaignId && currentMonthCampaigns >= maxCampaignsPerMonth) {
    throw new AppError(
      `Você já atingiu o limite de ${maxCampaignsPerMonth} campanhas por mês. Aguarde o próximo mês ou faça upgrade do seu plano`,
      400
    );
  }

  return {
    isValid: true,
    maxContacts,
    currentMonthCampaigns,
    maxCampaignsPerMonth,
    contactsInList
  };
};

export default ValidateCampaignLimitsService;