import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Plan from "../../models/Plan";

interface PlanData {
  name: string;
  users: number;
  connections: number;
  queues: number;
  value: number;
  useWhatsapp?: boolean;
  useCampaigns?: boolean;
  campaignContactsLimit?: number;
  campaignsPerMonthLimit?: number;
}

const CreatePlanService = async (planData: PlanData): Promise<Plan> => {
  const { name } = planData;

  const planSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_PLAN_INVALID_NAME")
      .required("ERR_PLAN_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_PLAN_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const planWithSameName = await Plan.findOne({
              where: { name: value }
            });

            return !planWithSameName;
          }
          return false;
        }
      ),
    users: Yup.number()
      .min(0, "ERR_PLAN_INVALID_USERS")
      .required("ERR_PLAN_INVALID_USERS"),
    connections: Yup.number()
      .min(0, "ERR_PLAN_INVALID_CONNECTIONS")
      .required("ERR_PLAN_INVALID_CONNECTIONS"),
    queues: Yup.number()
      .min(0, "ERR_PLAN_INVALID_QUEUES")
      .required("ERR_PLAN_INVALID_QUEUES"),
    value: Yup.number()
      .min(0, "ERR_PLAN_INVALID_VALUE")
      .required("ERR_PLAN_INVALID_VALUE"),
    useWhatsapp: Yup.boolean(),
    useCampaigns: Yup.boolean(),
    campaignContactsLimit: Yup.number()
      .min(0, "ERR_PLAN_INVALID_CAMPAIGN_CONTACTS_LIMIT")
      .nullable(),
    campaignsPerMonthLimit: Yup.number()
      .min(0, "ERR_PLAN_INVALID_CAMPAIGNS_PER_MONTH_LIMIT")
      .nullable()
  });

  try {
    await planSchema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const plan = await Plan.create(planData);

  return plan;
};

export default CreatePlanService;
