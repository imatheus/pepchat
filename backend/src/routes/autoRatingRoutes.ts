import express from "express";
import isAuth from "../middleware/isAuth";
import * as AutoRatingController from "../controllers/AutoRatingController";

const autoRatingRoutes = express.Router();

// Rota para verificar o status da avaliação automática
autoRatingRoutes.get("/auto-rating/status", isAuth, AutoRatingController.getAutoRatingStatus);

// Rota para atualizar o status da avaliação automática
autoRatingRoutes.put("/auto-rating/status", isAuth, AutoRatingController.updateAutoRatingStatus);

// Rota para obter todas as configurações de avaliação
autoRatingRoutes.get("/auto-rating/settings", isAuth, AutoRatingController.getAutoRatingSettings);

export default autoRatingRoutes;