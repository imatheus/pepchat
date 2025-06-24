import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import SyncCompanyDueDateService from "./SyncCompanyDueDateService";

interface CompanyData {
  name: string;
  id?: number | string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
  trialExpiration?: string;
}

const UpdateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const company = await Company.findByPk(companyData.id);
  const {
    name,
    phone,
    email,
    status,
    planId,
    campaignsEnabled,
    dueDate,
    recurrence,
    trialExpiration
  } = companyData;

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  // Se uma dueDate está sendo definida, usar o serviço de sincronização
  if (dueDate) {
    await SyncCompanyDueDateService({
      companyId: company.id,
      dueDate,
      updateAsaas: true,
      updateTrialExpiration: true
    });
  }

  // Atualizar outros campos (exceto dueDate que já foi tratado acima)
  const updateData: any = {
    name,
    phone,
    email,
    status,
    planId,
    recurrence
  };

  // Só atualizar trialExpiration se não estiver definindo dueDate
  if (!dueDate && trialExpiration !== undefined) {
    updateData.trialExpiration = trialExpiration ? new Date(trialExpiration) : null;
  }

  await company.update(updateData);

  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      }
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }

  return company;
};

export default UpdateCompanyService;
