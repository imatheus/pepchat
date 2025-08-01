import Company from "../../models/Company";
import CompanyPlan from "../../models/CompanyPlan";
import Plan from "../../models/Plan";

interface Request {
  companyId: number;
}

interface PlanLimits {
  users: number;
  connections: number;
  queues: number;
  useWhatsapp: boolean;
  useCampaigns: boolean;
  campaignContactsLimit: number;
  campaignsPerMonthLimit: number;
}

const GetCompanyActivePlanService = async ({
  companyId
}: Request): Promise<PlanLimits> => {
  // Primeiro, tenta buscar o plano personalizado da empresa
  const companyPlan = await CompanyPlan.findOne({
    where: {
      companyId,
      isActive: true
    },
    include: [
      {
        model: Plan,
        as: "basePlan"
      }
    ]
  });

  if (companyPlan) {
    // Se existe um plano personalizado, usa os limites dele
    return {
      users: companyPlan.users,
      connections: companyPlan.connections,
      queues: companyPlan.queues,
      useWhatsapp: companyPlan.useWhatsapp,
      useCampaigns: companyPlan.useCampaigns,
      campaignContactsLimit: companyPlan.campaignContactsLimit || 150,
      campaignsPerMonthLimit: companyPlan.campaignsPerMonthLimit || 4
    };
  }

  // Se não existe plano personalizado, busca o plano padrão da empresa
  const company = await Company.findByPk(companyId, {
    include: [
      {
        model: Plan,
        as: "plan"
      }
    ]
  });

  if (company && company.plan) {
    // Usa os limites do plano padrão
    return {
      users: company.plan.users,
      connections: company.plan.connections,
      queues: company.plan.queues,
      useWhatsapp: company.plan.useWhatsapp,
      useCampaigns: company.plan.useCampaigns,
      campaignContactsLimit: company.plan.campaignContactsLimit || 150,
      campaignsPerMonthLimit: company.plan.campaignsPerMonthLimit || 4
    };
  }

  // Fallback: limites mínimos se não encontrar nenhum plano
  return {
    users: 1,
    connections: 1,
    queues: 1,
    useWhatsapp: true,
    useCampaigns: false,
    campaignContactsLimit: 0, // Sem campanhas no fallback
    campaignsPerMonthLimit: 0
  };
};

export default GetCompanyActivePlanService;