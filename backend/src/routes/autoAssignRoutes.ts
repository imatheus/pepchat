import { Router, Request, Response, NextFunction } from "express";
import isAuth from "../middleware/isAuth";
import * as AutoAssignController from "../controllers/AutoAssignController";

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const autoAssignRoutes = Router();

// Executar auto-atribuição para a empresa do usuário logado
autoAssignRoutes.post("/auto-assign/execute", isAuth, asyncHandler(AutoAssignController.executeAutoAssign));

// Executar auto-atribuição para todas as empresas (apenas super admins)
autoAssignRoutes.post("/auto-assign/execute-all", isAuth, asyncHandler(AutoAssignController.executeAutoAssignForAllCompanies));

export default autoAssignRoutes;