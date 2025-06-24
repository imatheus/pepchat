import AppError from "../../errors/AppError";
import CompanyPlan from "../../models/CompanyPlan";
import Plan from "../../models/Plan";

interface Request {
  companyId: number;
  basePlanId: number;
  users: number;
  connections?: number;
  queues?: number;
}

const CreateCompanyPlanService = async ({
  companyId,
  basePlanId,
  users,
  connections,
  queues
}: Request): Promise<CompanyPlan> => {
  // Buscar o plano base
  const basePlan = await Plan.findByPk(basePlanId);
  if (!basePlan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  // Validar número mínimo de usuários
  if (users < 1) {
    throw new AppError("ERR_INVALID_USERS_COUNT", 400);
  }

  // Calcular valores baseados no plano base e número de usuários
  const pricePerUser = basePlan.value;
  const totalValue = pricePerUser * users;

  // Usar valores do plano base ou valores customizados
  const finalConnections = connections || basePlan.connections * users;
  const finalQueues = queues || basePlan.queues * users;

  // Verificar se já existe um plano ativo para a empresa
  const existingPlan = await CompanyPlan.findOne({
    where: {
      companyId,
      isActive: true
    }
  });

  if (existingPlan) {
    // Desativar o plano anterior
    await existingPlan.update({ isActive: false });
  }

  // Criar o novo plano da empresa
  const companyPlan = await CompanyPlan.create({
    companyId,
    basePlanId,
    name: `${basePlan.name} - ${users} usuário${users > 1 ? 's' : ''}`,
    users,
    connections: finalConnections,
    queues: finalQueues,
    pricePerUser,
    totalValue,
    useWhatsapp: basePlan.useWhatsapp,
    useFacebook: basePlan.useFacebook,
    useInstagram: basePlan.useInstagram,
    useCampaigns: basePlan.useCampaigns,
    isActive: true
  });

  return companyPlan;
};

export default CreateCompanyPlanService;