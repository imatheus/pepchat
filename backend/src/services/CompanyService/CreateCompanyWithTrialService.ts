import moment from "moment";
import AppError from "../../errors/AppError";
import CreateCompanyService from "./CreateCompanyService";

interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  fullName?: string;
  document?: string;
  status?: boolean;
  planId?: number;
  users?: number;
  campaignsEnabled?: boolean;
  recurrence?: string;
  trialDays?: number; // Número de dias de trial (padrão: 7)
}

const CreateCompanyWithTrialService = async (
  companyData: CompanyData
) => {
  const trialDays = companyData.trialDays || 7;
  
  // Calcular data de vencimento (hoje + dias de trial)
  const dueDate = moment().add(trialDays, 'days').format('YYYY-MM-DD');
  
  // Calcular data de expiração do trial (hoje + dias de trial)
  const trialExpiration = moment().add(trialDays, 'days').format('YYYY-MM-DD');

  // Criar empresa com as datas calculadas
  const company = await CreateCompanyService({
    ...companyData,
    dueDate,
    trialExpiration,
    status: true // Ativar empresa durante o período de trial
  });

  return {
    company,
    trialDays,
    dueDate,
    trialExpiration,
    message: `Empresa criada com ${trialDays} dias de avaliação. Vencimento: ${moment(dueDate).format('DD/MM/YYYY')}`
  };
};

export default CreateCompanyWithTrialService;