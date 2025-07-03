import { Router } from "express";
import * as WebChatController from "../controllers/WebChatController";
import { validateWebhookToken } from "../middleware/webhookAuth";
import { webhookLimiter } from "../middleware/security";

const webChatRoutes = Router();

webChatRoutes.post("/webchat/message", webhookLimiter, validateWebhookToken("WEBCHAT_TOKEN"), WebChatController.receiveMessage);

export default webChatRoutes;