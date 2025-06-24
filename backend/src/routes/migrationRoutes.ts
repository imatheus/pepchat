import express from "express";
import * as MigrationController from "../controllers/MigrationController";
import isAuth from "../middleware/isAuth";

const migrationRoutes = express.Router();

migrationRoutes.post("/migrations/company-plans", isAuth, MigrationController.migrateCompanyPlans);

export default migrationRoutes;