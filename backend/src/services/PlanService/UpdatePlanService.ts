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
  useFacebook?: boolean;
  useInstagram?: boolean;
  useCampaigns?: boolean;
}

const UpdatePlanService = async (planData: PlanData): Promise<Plan> => {
  const { id, name, users, connections, queues, value, useWhatsapp, useFacebook, useInstagram, useCampaigns } = planData;

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

  await plan.update({
    name,
    users,
    connections,
    queues,
    value,
    useWhatsapp,
    useFacebook,
    useInstagram,
    useCampaigns
  });

  return plan;
};

export default UpdatePlanService;
