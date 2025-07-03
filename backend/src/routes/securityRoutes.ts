import { Router } from "express";
import isAuth from "../middleware/isAuth";
import { requireSuperUser } from "../middleware/authorization";
import * as SecurityController from "../controllers/SecurityController";

const securityRoutes = Router();

// Todas as rotas de segurança requerem autenticação e super usuário
securityRoutes.get("/security/events", isAuth, requireSuperUser, SecurityController.getSecurityEvents);
securityRoutes.get("/security/events/ip/:ip", isAuth, requireSuperUser, SecurityController.getSecurityEventsByIP);
securityRoutes.get("/security/summary", isAuth, requireSuperUser, SecurityController.getSecuritySummary);

export default securityRoutes;