import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as CampaignLimitsController from "../controllers/CampaignLimitsController";

const routes = Router();

// Obter limites de campanhas da empresa
routes.get("/campaign-limits", isAuth, CampaignLimitsController.getCampaignLimits);

// Validar limites antes de criar/editar campanha
routes.post("/campaign-limits/validate", isAuth, CampaignLimitsController.validateCampaignLimits);

export default routes;