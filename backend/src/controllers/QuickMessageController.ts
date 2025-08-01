import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListService from "../services/QuickMessageService/ListService";
import CreateService from "../services/QuickMessageService/CreateService";
import ShowService from "../services/QuickMessageService/ShowService";
import UpdateService from "../services/QuickMessageService/UpdateService";
import DeleteService from "../services/QuickMessageService/DeleteService";
import FindService from "../services/QuickMessageService/FindService";

import QuickMessage from "../models/QuickMessage";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  userId: string | number;
};

type StoreData = {
  shortcode: string;
  message: string;
  userId: number | number;
};

type FindParams = {
  companyId: string;
  userId: string;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber, userId } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    userId
  });

  res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateService({
    ...data,
    companyId,
    userId: req.user.id
  });

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "create",
    record
  });

  res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const record = await ShowService(id);

  res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = req.body as StoreData;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    userId: req.user.id,
    id,
  });

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "update",
    record
  });

  res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "delete",
    id
  });

  res.status(200).json({ message: "Contact deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query as FindParams;
  const { companyId } = req.user;
  const records: QuickMessage[] = await FindService({ companyId, userId });

  res.status(200).json(records);
};
