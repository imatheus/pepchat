import AppError from "../../errors/AppError";
import CompanyPlan from "../../models/CompanyPlan";
import Plan from "../../models/Plan";

interface Request {
  companyPlanId: number;
  users: number;
  connections?: number;
  queues?: number;
}

const UpdateCompanyPlanService = async ({
  companyPlanId,
  users,
  connections,
  queues
}: Request): Promise<CompanyPlan> => {
  const companyPlan = await CompanyPlan.findByPk(companyPlanId, {
    include: [
      {
        model: Plan,
        as: "basePlan"
      }
    ]
  });

  if (!companyPlan) {
    throw new AppError("ERR_COMPANY_PLAN_NOT_FOUND", 404);
  }

  // Validar número mínimo de usuários
  if (users < 1) {
    throw new AppError("ERR_INVALID_USERS_COUNT", 400);
  }

  // Recalcular valores
  const pricePerUser = companyPlan.basePlan.value;
  const totalValue = pricePerUser * users;

  // Usar valores customizados ou calcular baseado no plano base
  const finalConnections = connections || companyPlan.basePlan.connections * users;
  const finalQueues = queues || companyPlan.basePlan.queues * users;

  // Atualizar o plano
  await companyPlan.update({
    name: `${companyPlan.basePlan.name} - ${users} usuário${users > 1 ? 's' : ''}`,
    users,
    connections: finalConnections,
    queues: finalQueues,
    totalValue
  });

  await companyPlan.reload({
    include: [
      {
        model: Plan,
        as: "basePlan"
      }
    ]
  });

  return companyPlan;
};

export default UpdateCompanyPlanService;