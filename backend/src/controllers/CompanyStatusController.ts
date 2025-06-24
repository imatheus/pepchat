import { Request, Response } from "express";
import SyncCompanyStatusService from "../services/CompanyService/SyncCompanyStatusService";
import AppError from "../errors/AppError";

export const syncStatus = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.params;
  const { forceUpdate = false } = req.body;

  if (!companyId) {
    throw new AppError("ID da empresa é obrigatório", 400);
  }

  try {
    const result = await SyncCompanyStatusService({
      companyId: parseInt(companyId),
      forceUpdate
    });

    return res.status(200).json({
      success: true,
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          status: result.company.status,
          dueDate: result.company.dueDate,
          trialExpiration: result.company.trialExpiration
        },
        statusChanged: result.statusChanged,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        isInTrial: result.isInTrial,
        isExpired: result.isExpired,
        message: result.message
      }
    });
  } catch (error: any) {
    throw new AppError(error.message || "Erro ao sincronizar status da empresa", 500);
  }
};

export const getStatus = async (req: Request, res: Response): Promise<Response> => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new AppError("Empresa não identificada", 400);
  }

  try {
    const result = await SyncCompanyStatusService({
      companyId,
      forceUpdate: false
    });

    return res.status(200).json({
      success: true,
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          status: result.company.status,
          dueDate: result.company.dueDate,
          trialExpiration: result.company.trialExpiration
        },
        isInTrial: result.isInTrial,
        isExpired: result.isExpired,
        message: result.message
      }
    });
  } catch (error: any) {
    throw new AppError(error.message || "Erro ao obter status da empresa", 500);
  }
};