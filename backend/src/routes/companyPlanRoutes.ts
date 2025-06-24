import express from "express";
import isAuth from "../middleware/isAuth";

import * as CompanyPlanController from "../controllers/CompanyPlanController";

const companyPlanRoutes = express.Router();

companyPlanRoutes.post("/company-plans", isAuth, CompanyPlanController.store);
companyPlanRoutes.get("/company-plans", isAuth, CompanyPlanController.show);
companyPlanRoutes.put("/company-plans/:companyPlanId", isAuth, CompanyPlanController.update);

export default companyPlanRoutes;