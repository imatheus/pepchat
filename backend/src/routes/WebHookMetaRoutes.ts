import { Router } from "express";
import * as WebHooksController from "../controllers/WebHookMetaController";
import { validateMetaWebhook } from "../middleware/webhookAuth";
import { webhookLimiter } from "../middleware/security";

const WebHookMetaRoutes = Router();

WebHookMetaRoutes.get("/", webhookLimiter, validateMetaWebhook, WebHooksController.index);
WebHookMetaRoutes.post("/", webhookLimiter, validateMetaWebhook, WebHooksController.webHook);

export default WebHookMetaRoutes;
