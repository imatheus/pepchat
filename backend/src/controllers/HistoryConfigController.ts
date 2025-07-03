import { Request, Response } from "express";
import HistoryConfigService from "../services/WbotServices/HistoryConfigService";
import { logger } from "../utils/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    companyId: number;
    profile: string;
  };
}

export const getHistoryConfig = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user!;
    
    const config = await HistoryConfigService.getHistoryConfig(companyId);
    
    return res.json(config);
  } catch (error) {
    logger.error(error, "Error getting history config");
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateHistoryConfig = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user!;
    const { enableHistorySync, historyDaysLimit, preventMassMessages } = req.body;

    // Validações
    if (historyDaysLimit !== undefined && (historyDaysLimit < 1 || historyDaysLimit > 30)) {
      return res.status(400).json({ error: "historyDaysLimit deve estar entre 1 e 30 dias" });
    }

    const config = {
      enableHistorySync,
      historyDaysLimit,
      preventMassMessages
    };

    await HistoryConfigService.updateHistoryConfig(companyId, config);
    
    const updatedConfig = await HistoryConfigService.getHistoryConfig(companyId);
    
    return res.json({
      message: "Configurações de histórico atualizadas com sucesso",
      config: updatedConfig
    });
  } catch (error) {
    logger.error(error, "Error updating history config");
    return res.status(500).json({ error: "Internal server error" });
  }
};