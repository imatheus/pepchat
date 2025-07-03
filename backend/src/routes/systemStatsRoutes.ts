import { Router } from "express";
import isAuth from "../middleware/isAuth";
import { requireSuperUser } from "../middleware/authorization";
import * as SystemStatsController from "../controllers/SystemStatsController";

const systemStatsRoutes = Router();

// Todas as rotas requerem autenticação e super usuário
systemStatsRoutes.get("/system/stats", isAuth, requireSuperUser, SystemStatsController.getSystemStats);
systemStatsRoutes.get("/system/user-growth", isAuth, requireSuperUser, SystemStatsController.getUserGrowthStats);
systemStatsRoutes.get("/system/companies", isAuth, requireSuperUser, SystemStatsController.getDetailedCompanyStats);

export default systemStatsRoutes;