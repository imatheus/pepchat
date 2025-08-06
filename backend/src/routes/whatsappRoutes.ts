import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as WhatsAppController from "../controllers/WhatsAppController";

const whatsappRoutes = express.Router();
const upload = multer(uploadConfig);

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);


whatsappRoutes.post("/webchat/", isAuth, WhatsAppController.storeWebChat);

whatsappRoutes.post("/whatsapp/", isAuth, WhatsAppController.store);

whatsappRoutes.get("/whatsapp/:whatsappId", isAuth, WhatsAppController.show);

whatsappRoutes.put("/whatsapp/:whatsappId", isAuth, WhatsAppController.update);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  isAuth,
  WhatsAppController.remove
);

// Rotas para arquivos de saudação
whatsappRoutes.post(
  "/whatsapp/:whatsappId/greeting-media",
  isAuth,
  upload.array("media"),
  WhatsAppController.uploadGreetingMedia
);

whatsappRoutes.get(
  "/whatsapp/:whatsappId/greeting-media",
  isAuth,
  WhatsAppController.listGreetingMedia
);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId/greeting-media/:filename",
  isAuth,
  WhatsAppController.deleteGreetingMedia
);

export default whatsappRoutes;