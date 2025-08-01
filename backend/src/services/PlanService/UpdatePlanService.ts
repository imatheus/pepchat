import AppError from "../../errors/AppError";
import Plan from "../../models/Plan";

interface PlanData {
  name: string;
  id?: number | string;
  users?: number;
  connections?: number;
  queues?: number;
  value?: number;
  useWhatsapp?: boolean;
  useCampaigns?: boolean;
  campaignContactsLimit?: number;
  campaignsPerMonthLimit?: number;
}

const UpdatePlanService = async (planData: PlanData): Promise<Plan> => {
  const { id, name, users, connections, queues, value, useWhatsapp, useCampaigns, campaignContactsLimit, campaignsPerMonthLimit } = planData;

  const plan = await Plan.findByPk(id);

  if (!plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  // Validar se o nome não está sendo usado por outro plano
  if (name && name !== plan.name) {
    const existingPlan = await Plan.findOne({
      where: { name }
    });

    if (existingPlan && existingPlan.id !== plan.id) {
      throw new AppError("ERR_PLAN_NAME_ALREADY_EXISTS");
    }
  }

  // Validar valores numéricos se fornecidos
  if (users !== undefined && (isNaN(users) || users < 0)) {
    throw new AppError("ERR_PLAN_INVALID_USERS");
  }
  if (connections !== undefined && (isNaN(connections) || connections < 0)) {
    throw new AppError("ERR_PLAN_INVALID_CONNECTIONS");
  }
  if (queues !== undefined && (isNaN(queues) || queues < 0)) {
    throw new AppError("ERR_PLAN_INVALID_QUEUES");
  }
  if (value !== undefined && (isNaN(value) || value < 0)) {
    throw new AppError("ERR_PLAN_INVALID_VALUE");
  }
  if (campaignContactsLimit !== undefined && (isNaN(campaignContactsLimit) || campaignContactsLimit < 0)) {
    throw new AppError("ERR_PLAN_INVALID_CAMPAIGN_CONTACTS_LIMIT");
  }
  if (campaignsPerMonthLimit !== undefined && (isNaN(campaignsPerMonthLimit) || campaignsPerMonthLimit < 0)) {
    throw new AppError("ERR_PLAN_INVALID_CAMPAIGNS_PER_MONTH_LIMIT");
  }

  await plan.update({
    name,
    users,
    connections,
    queues,
    value,
    useWhatsapp,
    useCampaigns,
    campaignContactsLimit,
    campaignsPerMonthLimit
  });

  return plan;
};

export default UpdatePlanService;
