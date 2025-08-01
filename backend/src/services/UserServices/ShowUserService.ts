import User from "../../models/User";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CompanyPlan from "../../models/CompanyPlan";

const ShowUserService = async (id: string | number): Promise<User> => {
  const user = await User.findByPk(id, {
    attributes: [
      "name",
      "id",
      "email",
      "companyId",
      "profile",
      "super",
      "tokenVersion",
      "profileImage"
    ],
    include: [
      { model: Queue, as: "queues", attributes: ["id", "name", "color"] },
      { 
        model: Company, 
        as: "company", 
        attributes: ["id", "name", "dueDate", "recurrence", "trialExpiration"],
        include: [
          { 
            model: Plan, 
            as: "plan", 
            attributes: ["id", "name", "users", "connections", "queues", "value", "useWhatsapp", "useFacebook", "useInstagram", "useCampaigns"] 
          },
          {
            model: CompanyPlan,
            as: "companyPlans",
            where: { isActive: true },
            required: false,
            attributes: ["id", "name", "users", "connections", "queues", "pricePerUser", "totalValue", "useWhatsapp", "useFacebook", "useInstagram", "useCampaigns"],
            include: [
              {
                model: Plan,
                as: "basePlan",
                attributes: ["id", "name", "value"]
              }
            ]
          }
        ]
      }
    ]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  return user;
};

export default ShowUserService;