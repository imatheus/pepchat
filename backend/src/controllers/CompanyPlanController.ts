import { Request, Response } from "express";
import * as Yup from "yup";

import AppError from "../errors/AppError";
import CreateCompanyPlanService from "../services/CompanyPlanService/CreateCompanyPlanService";
import FindCompanyPlanService from "../services/CompanyPlanService/FindCompanyPlanService";
import UpdateCompanyPlanService from "../services/CompanyPlanService/UpdateCompanyPlanService";

export const store = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    basePlanId: Yup.number().required(),
    users: Yup.number().min(1).required(),
    connections: Yup.number().optional(),
    queues: Yup.number().optional()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("ERR_INVALID_DATA", 400);
  }

  const { basePlanId, users, connections, queues } = req.body;

  const companyPlan = await CreateCompanyPlanService({
    companyId,
    basePlanId,
    users,
    connections,
    queues
  });

  res.status(200).json(companyPlan);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;

  const companyPlan = await FindCompanyPlanService({ companyId });

  res.status(200).json(companyPlan);
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const { companyPlanId } = req.params;

  const schema = Yup.object().shape({
    users: Yup.number().min(1).required(),
    connections: Yup.number().optional(),
    queues: Yup.number().optional()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("ERR_INVALID_DATA", 400);
  }

  const { users, connections, queues } = req.body;

  const companyPlan = await UpdateCompanyPlanService({
    companyPlanId: parseInt(companyPlanId),
    users,
    connections,
    queues
  });

  res.status(200).json(companyPlan);
};