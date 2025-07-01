import { Request, Response } from "express";
import GetCompanyActivePlanService from "../services/CompanyService/GetCompanyActivePlanService";
import ValidateCampaignLimitsService from "../services/CampaignService/ValidateCampaignLimitsService";
import { Op } from "sequelize";
import Campaign from "../models/Campaign";

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    companyId: number;
  };
}

export const getCampaignLimits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { companyId } = req.user;

  try {
    // Obter limites do plano ativo
    const planLimits = await GetCompanyActivePlanService({ companyId });

    // Contar campanhas do mês atual
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthCampaigns = await Campaign.count({
      where: {
        companyId,
        createdAt: {
          [Op.between]: [firstDayOfMonth, lastDayOfMonth]
        }
      }
    });

    const response = {
      useCampaigns: planLimits.useCampaigns,
      campaignContactsLimit: planLimits.campaignContactsLimit || 0,
      campaignsPerMonthLimit: planLimits.campaignsPerMonthLimit || 0,
      currentMonthCampaigns,
      remainingCampaigns: Math.max(0, (planLimits.campaignsPerMonthLimit || 0) - currentMonthCampaigns)
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting campaign limits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const validateCampaignLimits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const { contactListId, campaignId } = req.body;

  try {
    const validation = await ValidateCampaignLimitsService({
      companyId,
      contactListId,
      campaignId
    });

    res.status(200).json(validation);
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || "Validation failed",
      isValid: false 
    });
  }
};