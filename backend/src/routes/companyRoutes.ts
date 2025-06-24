import express from "express";
import isAuth from "../middleware/isAuth";
import isAuthWithExpiredAccess from "../middleware/isAuthWithExpiredAccess";

import * as CompanyController from "../controllers/CompanyController";
import * as CompanyStatusController from "../controllers/CompanyStatusController";

const companyRoutes = express.Router();

companyRoutes.get("/companies/list", isAuthWithExpiredAccess, CompanyController.list);
companyRoutes.get("/companies/check-expiration", isAuthWithExpiredAccess, CompanyController.checkExpiration);
companyRoutes.get("/companies", isAuthWithExpiredAccess, CompanyController.index);
companyRoutes.get("/companies/:id", isAuthWithExpiredAccess, CompanyController.show);
companyRoutes.post("/companies", isAuthWithExpiredAccess, CompanyController.store);
companyRoutes.post("/companies/with-trial", CompanyController.storeWithTrial);
companyRoutes.put("/companies/:id", isAuthWithExpiredAccess, CompanyController.update);
companyRoutes.put("/companies/:id/schedules", isAuthWithExpiredAccess, CompanyController.updateSchedules);
companyRoutes.put("/companies/:id/sync-due-date", isAuthWithExpiredAccess, CompanyController.syncDueDate);
companyRoutes.get("/companies/status", isAuthWithExpiredAccess, CompanyStatusController.getStatus);
companyRoutes.post("/companies/:companyId/sync-status", isAuthWithExpiredAccess, CompanyStatusController.syncStatus);
companyRoutes.delete("/companies/:id", isAuthWithExpiredAccess, CompanyController.remove);
companyRoutes.post("/companies/cadastro", CompanyController.storeWithTrial);
export default companyRoutes;
