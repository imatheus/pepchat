import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as QuickMessageController from "../controllers/QuickMessageController";

const routes = express.Router();
const upload = multer(uploadConfig);

routes.get("/quick-messages/list", isAuth, QuickMessageController.findList);

routes.get("/quick-messages", isAuth, QuickMessageController.index);

routes.get("/quick-messages/:id", isAuth, QuickMessageController.show);

routes.post("/quick-messages", isAuth, QuickMessageController.store);

routes.put("/quick-messages/:id", isAuth, QuickMessageController.update);

routes.delete("/quick-messages/:id", isAuth, QuickMessageController.remove);

// Rotas para arquivos de mensagens rápidas
routes.post(
  "/quick-messages/:id/media",
  isAuth,
  upload.array("media"),
  QuickMessageController.uploadMedia
);

routes.get(
  "/quick-messages/:id/media",
  isAuth,
  QuickMessageController.listMedia
);

routes.delete(
  "/quick-messages/:id/media/:filename",
  isAuth,
  QuickMessageController.deleteMedia
);

// Rota para enviar mensagem rápida com arquivos
routes.post(
  "/quick-messages/send",
  isAuth,
  QuickMessageController.sendQuickMessage
);

export default routes;
