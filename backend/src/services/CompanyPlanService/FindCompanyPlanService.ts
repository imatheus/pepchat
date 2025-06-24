import CompanyPlan from "../../models/CompanyPlan";
import Plan from "../../models/Plan";

interface Request {
  companyId: number;
}

const FindCompanyPlanService = async ({
  companyId
}: Request): Promise<CompanyPlan | null> => {
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

  return companyPlan;
};

export default FindCompanyPlanService;