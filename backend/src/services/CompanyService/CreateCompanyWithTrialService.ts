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
  
  // Se trialExpiration já foi fornecido pelo frontend, usar ele
  // Senão, calcular baseado nos dias de trial
  let finalTrialExpiration;
  let finalDueDate;
  
  if (companyData.trialExpiration) {
    // Frontend já enviou trialExpiration
    finalTrialExpiration = companyData.trialExpiration;
    finalDueDate = companyData.dueDate || moment().add(trialDays, 'days').format('YYYY-MM-DD');
  } else {
    // Calcular data de vencimento (hoje + dias de trial)
    finalDueDate = moment().add(trialDays, 'days').format('YYYY-MM-DD');
    // Calcular data de expiração do trial (hoje + dias de trial)
    finalTrialExpiration = moment().add(trialDays, 'days').toISOString();
  }

  // Criar empresa com as datas calculadas
  const company = await CreateCompanyService({
    ...companyData,
    dueDate: finalDueDate,
    trialExpiration: finalTrialExpiration,
    status: true // Ativar empresa durante o período de trial
  });

  return {
    company,
    trialDays,
    dueDate: finalDueDate,
    trialExpiration: finalTrialExpiration,
    message: `Empresa criada com ${trialDays} dias de avaliação. Vencimento: ${moment(finalDueDate).format('DD/MM/YYYY')}`
  };
};

export default CreateCompanyWithTrialService;