import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";

import * as QuickMessageController from "../controllers/QuickMessageController";

const routes = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
});

routes.get("/quick-messages/list", isAuth, QuickMessageController.findList);

routes.get("/quick-messages", isAuth, QuickMessageController.index);

routes.get("/quick-messages/:id", isAuth, QuickMessageController.show);

routes.post("/quick-messages", isAuth, upload.single("media"), QuickMessageController.store);

routes.put("/quick-messages/:id", isAuth, upload.single("media"), QuickMessageController.update);

routes.delete("/quick-messages/:id", isAuth, QuickMessageController.remove);

export default routes;
