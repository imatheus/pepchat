import ContactListItem from "../../models/ContactListItem";
import GetCompanyActivePlanService from "../CompanyService/GetCompanyActivePlanService";
import AppError from "../../errors/AppError";

interface Request {
  companyId: number;
  contactListId: number;
  newContactsCount: number; // Quantidade de novos contatos a serem importados
}

interface ValidationResult {
  isValid: boolean;
  maxContactsAllowed: number;
  currentContactsInList: number;
  availableSlots: number;
}

const ValidateContactImportService = async ({
  companyId,
  contactListId,
  newContactsCount
}: Request): Promise<ValidationResult> => {
  // Obter limites do plano ativo da empresa
  const planLimits = await GetCompanyActivePlanService({ companyId });

  // Verificar se campanhas estão habilitadas no plano
  if (!planLimits.useCampaigns) {
    throw new AppError("Campanhas não estão habilitadas no seu plano atual", 403);
  }

  const maxContactsAllowed = planLimits.campaignContactsLimit || 0;

  // Contar contatos atuais na lista
  const currentContactsInList = await ContactListItem.count({
    where: {
      contactListId,
      isWhatsappValid: true // Só contar contatos válidos
    }
  });

  const availableSlots = maxContactsAllowed - currentContactsInList;

  // Validar se a importação não excederá o limite
  if (newContactsCount > availableSlots) {
    throw new AppError(
      `Não é possível importar ${newContactsCount} contatos. ` +
      `Sua lista atual tem ${currentContactsInList} contatos válidos e seu plano permite até ${maxContactsAllowed} contatos por campanha. ` +
      `Você pode importar no máximo ${availableSlots} contatos adicionais.`,
      400
    );
  }

  // Validar se o total após importação não excederá o limite
  const totalAfterImport = currentContactsInList + newContactsCount;
  if (totalAfterImport > maxContactsAllowed) {
    throw new AppError(
      `Após a importação, a lista teria ${totalAfterImport} contatos, mas seu plano permite apenas ${maxContactsAllowed} contatos por campanha`,
      400
    );
  }

  return {
    isValid: true,
    maxContactsAllowed,
    currentContactsInList,
    availableSlots
  };
};

export default ValidateContactImportService;