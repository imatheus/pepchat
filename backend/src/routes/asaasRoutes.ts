import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuperUser from "../middleware/isSuperUser";
import * as AsaasController from "../controllers/AsaasController";
import { validateAsaasWebhook } from "../middleware/webhookAuth";
import { webhookLimiter } from "../middleware/security";

const asaasRoutes = Router();

// Rotas protegidas por autenticação e restritas a super usuários
asaasRoutes.get("/asaas", isAuth, isSuperUser, AsaasController.index);
asaasRoutes.post("/asaas", isAuth, isSuperUser, AsaasController.store);
asaasRoutes.put("/asaas", isAuth, isSuperUser, AsaasController.update);
asaasRoutes.post("/asaas/test", isAuth, isSuperUser, AsaasController.testConnection);
asaasRoutes.post("/asaas/create-company", isAuth, isSuperUser, AsaasController.createCompanyInAsaas);
asaasRoutes.post("/asaas/sync-all-companies", isAuth, isSuperUser, AsaasController.syncAllCompanies);
asaasRoutes.post("/asaas/sync-invoices", isAuth, isSuperUser, AsaasController.syncInvoices);

// Webhook com autenticação
asaasRoutes.post("/asaas/webhook", webhookLimiter, validateAsaasWebhook, AsaasController.webhook);
asaasRoutes.get("/asaas/webhook", (req, res) => {
  res.json({ 
    message: "Asaas Webhook endpoint is working", 
    method: "POST",
    timestamp: new Date().toISOString(),
    status: "ready"
  });
});

export default asaasRoutes;