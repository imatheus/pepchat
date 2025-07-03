import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as HistoryConfigController from "../controllers/HistoryConfigController";

const historyConfigRoutes = Router();

historyConfigRoutes.get("/history-config", isAuth, HistoryConfigController.getHistoryConfig as any);
historyConfigRoutes.put("/history-config", isAuth, HistoryConfigController.updateHistoryConfig as any);

export default historyConfigRoutes;