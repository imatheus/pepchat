import express from "express";
import isAuth from "../middleware/isAuth";

import * as PlanController from "../controllers/PlanController";

const planRoutes = express.Router();

// Rota pública para listar planos (para signup)
planRoutes.get("/plans/public", PlanController.list);

planRoutes.get("/plans", isAuth, PlanController.index);

planRoutes.get("/plans/list", isAuth, PlanController.list);

planRoutes.get("/plans/all", isAuth, PlanController.list);

planRoutes.get("/plans/:id", isAuth, PlanController.show);

planRoutes.post("/plans", isAuth, PlanController.store);

planRoutes.put("/plans/:id", isAuth, PlanController.update);

planRoutes.delete("/plans/:id", isAuth, PlanController.remove);

export default planRoutes;
