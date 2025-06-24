import { Request, Response } from "express";
import MigrateCompanyPlansService from "../services/CompanyService/MigrateCompanyPlansService";

export const migrateCompanyPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await MigrateCompanyPlansService();
    
    res.status(200).json({
      success: result.success,
      message: `Migração concluída: ${result.migrated} empresas migradas, ${result.errors} erros`,
      data: {
        migrated: result.migrated,
        errors: result.errors,
        details: result.details
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro durante migração",
      error: error.message
    });
  }
};