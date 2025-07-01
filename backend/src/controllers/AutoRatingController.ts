import { Request, Response } from "express";
import Setting from "../models/Setting";
import { isAutoRatingEnabled, createAutoRatingSetting } from "../services/TicketServices/AutoRatingService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    companyId: number;
    profile: string;
  };
}

export const getAutoRatingStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user!;
    
    const isEnabled = await isAutoRatingEnabled(companyId);
    
    return res.json({
      enabled: isEnabled,
      message: isEnabled ? "Avaliação automática está habilitada" : "Avaliação automática está desabilitada"
    });
  } catch (error) {
    console.error("Erro ao verificar status da avaliação automática:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
};

export const updateAutoRatingStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user!;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        error: "O campo 'enabled' deve ser um valor booleano"
      });
    }

    // Buscar ou criar a configuração
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId,
        key: "autoRating"
      },
      defaults: {
        companyId,
        key: "autoRating",
        value: enabled ? "enabled" : "disabled"
      }
    });

    // Se já existia, atualizar
    if (!created) {
      await setting.update({
        value: enabled ? "enabled" : "disabled"
      });
    }

    return res.json({
      success: true,
      enabled,
      message: enabled 
        ? "Avaliação automática habilitada com sucesso" 
        : "Avaliação automática desabilitada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar status da avaliação automática:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
};

export const getAutoRatingSettings = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user!;
    
    const settings = await Setting.findAll({
      where: {
        companyId,
        key: ["autoRating", "userRating"]
      }
    });

    const autoRating = settings.find(s => s.key === "autoRating");
    const userRating = settings.find(s => s.key === "userRating");

    return res.json({
      autoRating: {
        enabled: autoRating?.value === "enabled",
        description: "Envio automático de solicitação de avaliação quando o ticket é fechado"
      },
      userRating: {
        enabled: userRating?.value === "enabled",
        description: "Sistema de avaliação manual (configuração legada)"
      }
    });
  } catch (error) {
    console.error("Erro ao buscar configurações de avaliação:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
};