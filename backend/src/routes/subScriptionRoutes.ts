import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";
import { validateWebhookToken } from "../middleware/webhookAuth";
import { webhookLimiter } from "../middleware/security";

const subscriptionRoutes = express.Router();
subscriptionRoutes.post("/subscription", isAuth, SubscriptionController.createSubscription);
subscriptionRoutes.post("/subscription/create/webhook", webhookLimiter, validateWebhookToken("SUBSCRIPTION_WEBHOOK_TOKEN"), SubscriptionController.createWebhook);
subscriptionRoutes.post("/subscription/webhook/:type?", webhookLimiter, validateWebhookToken("SUBSCRIPTION_WEBHOOK_TOKEN"), SubscriptionController.webhook);

export default subscriptionRoutes;
