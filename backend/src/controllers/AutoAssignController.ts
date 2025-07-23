import { Request, Response } from "express";
import { ExecuteAutoAssignForCompany } from "../services/TicketServices/InitAutoAssignService";
import AutoAssignTicketService from "../services/TicketServices/AutoAssignTicketService";

export const executeAutoAssign = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user;

    await AutoAssignTicketService(companyId);

    return res.status(200).json({
      message: "Auto assign executed successfully"
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

export const executeAutoAssignForAllCompanies = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Apenas super admins podem executar para todas as empresas
    if (req.user.profile !== "admin" || !req.user.super) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only super admins can execute auto assign for all companies"
      });
    }

    const Company = require("../models/Company").default;
    const companies = await Company.findAll({
      where: { status: true },
      attributes: ["id", "name"]
    });

    const results = [];
    for (const company of companies) {
      try {
        await AutoAssignTicketService(company.id);
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: "success"
        });
      } catch (error) {
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: "error",
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: "Auto assign executed for all companies",
      results
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};