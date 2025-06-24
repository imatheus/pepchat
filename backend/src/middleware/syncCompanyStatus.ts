import { Request, Response, NextFunction } from "express";
import SyncCompanyStatusService from "../services/CompanyService/SyncCompanyStatusService";
import { logger } from "../utils/logger";

// Cache para evitar múltiplas sincronizações da mesma empresa em pouco tempo
const syncCache = new Map<number, number>();
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos

const syncCompanyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companyId = req.user?.companyId || req.company?.id;
    
    if (!companyId) {
      return next();
    }

    const now = Date.now();
    const lastSync = syncCache.get(companyId);

    // Verificar se já foi sincronizado recentemente
    if (lastSync && (now - lastSync) < SYNC_INTERVAL) {
      return next();
    }

    // Sincronizar status da empresa em background
    SyncCompanyStatusService({ companyId })
      .then((result) => {
        if (result.statusChanged) {
          logger.info(`Status da empresa ${result.company.name} sincronizado: ${result.message}`);
        }
        syncCache.set(companyId, now);
      })
      .catch((error) => {
        logger.error(`Erro ao sincronizar status da empresa ${companyId}:`, error);
      });

    next();
  } catch (error) {
    logger.error("Erro no middleware de sincronização de status:", error);
    next();
  }
};

export default syncCompanyStatus;