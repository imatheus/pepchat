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
  useFacebook: boolean;
  useInstagram: boolean;
  useCampaigns: boolean;
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
      useFacebook: companyPlan.useFacebook,
      useInstagram: companyPlan.useInstagram,
      useCampaigns: companyPlan.useCampaigns
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
      useFacebook: company.plan.useFacebook,
      useInstagram: company.plan.useInstagram,
      useCampaigns: company.plan.useCampaigns
    };
  }

  // Fallback: limites mínimos se não encontrar nenhum plano
  return {
    users: 1,
    connections: 1,
    queues: 1,
    useWhatsapp: true,
    useFacebook: false,
    useInstagram: false,
    useCampaigns: false
  };
};

export default GetCompanyActivePlanService;