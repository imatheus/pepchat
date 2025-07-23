import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as AutoAssignController from "../controllers/AutoAssignController";

const autoAssignRoutes = Router();

// Executar auto-atribuição para a empresa do usuário logado
autoAssignRoutes.post("/auto-assign/execute", isAuth, AutoAssignController.executeAutoAssign);

// Executar auto-atribuição para todas as empresas (apenas super admins)
autoAssignRoutes.post("/auto-assign/execute-all", isAuth, AutoAssignController.executeAutoAssignForAllCompanies);

export default autoAssignRoutes;