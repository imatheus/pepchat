import * as Yup from "yup";
import { Request, Response } from "express";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Plan from "../models/Plan";

import ListPlansService from "../services/PlanService/ListPlansService";
import CreatePlanService from "../services/PlanService/CreatePlanService";
import UpdatePlanService from "../services/PlanService/UpdatePlanService";
import ShowPlanService from "../services/PlanService/ShowPlanService";
import FindAllPlanService from "../services/PlanService/FindAllPlanService";
import DeletePlanService from "../services/PlanService/DeletePlanService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type StorePlanData = {
  name: string;
  id?: number | string;
  users: number | 0;
  connections: number | 0;
  queues: number | 0;
  value: number;
  useWhatsapp?: boolean;
  useFacebook?: boolean;
  useInstagram?: boolean;
  useCampaigns?: boolean;
};

type UpdatePlanData = {
  name: string;
  id?: number | string;
  users?: number;
  connections?: number;
  queues?: number;
  value?: number;
  useWhatsapp?: boolean;
  useFacebook?: boolean;
  useInstagram?: boolean;
  useCampaigns?: boolean;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { plans, count, hasMore } = await ListPlansService({
    searchParam,
    pageNumber
  });

  res.json({ plans, count, hasMore });
};

export const list = async (req: Request, res: Response): Promise<void> => {
  const plans: Plan[] = await FindAllPlanService();

  res.status(200).json(plans);
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const newPlan: StorePlanData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newPlan);
  } catch (err) {
    throw new AppError(err.message);
  }

  const plan = await CreatePlanService(newPlan);

  // const io = getIO();
  // io.emit("plan", {
  //   action: "create",
  //   plan
  // });

  res.status(200).json(plan);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const plan = await ShowPlanService(id);

  res.status(200).json(plan);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const planData: UpdatePlanData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id, name, users, connections, queues, value, useWhatsapp, useFacebook, useInstagram, useCampaigns } = planData;

  const plan = await UpdatePlanService({
    id,
    name,
    users,
    connections,
    queues,
    value,
    useWhatsapp,
    useFacebook,
    useInstagram,
    useCampaigns
  });

  // const io = getIO();
  // io.emit("plan", {
  //   action: "update",
  //   plan
  // });

  res.status(200).json(plan);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const plan = await DeletePlanService(id);

  res.status(200).json(plan);
};
