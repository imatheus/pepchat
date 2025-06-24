import * as Yup from "yup";
import { Request, Response } from "express";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Company from "../models/Company";

import ListCompaniesService from "../services/CompanyService/ListCompaniesService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import UpdateCompanyService from "../services/CompanyService/UpdateCompanyService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import UpdateSchedulesService from "../services/CompanyService/UpdateSchedulesService";
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";
import FindAllCompaniesService from "../services/CompanyService/FindAllCompaniesService";
import SyncCompanyDueDateService from "../services/CompanyService/SyncCompanyDueDateService";
import CreateCompanyWithTrialService from "../services/CompanyService/CreateCompanyWithTrialService";
import CheckCompanyExpirationService from "../services/CompanyService/CheckCompanyExpirationService";
import User from "../models/User";


type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type CompanyData = {
  name: string;
  id?: number;
  phone?: string;
  email?: string; 
  fullName?: string;
  document?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
  trialExpiration?: string;
};

type SchedulesData = {
  schedules: [];
};


export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { companies, count, hasMore } = await ListCompaniesService({
    searchParam,
    pageNumber
  });

  res.json({ companies, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const newCompany: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newCompany);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const company = await CreateCompanyService(newCompany);

  res.status(200).json(company);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Garante que o id é um número válido
  const companyId = Number(id);
  if (isNaN(companyId)) {
    throw new AppError("ID da empresa inválido", 400);
  }

  const company = await ShowCompanyService(companyId);

  res.status(200).json(company);
};

export const list = async (req: Request, res: Response): Promise<void> => {
  const companies: Company[] = await FindAllCompaniesService();

  res.status(200).json(companies);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const companyData: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(companyData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const company = await UpdateCompanyService({ id, ...companyData });

  res.status(200).json(company);
};

export const updateSchedules = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { schedules }: SchedulesData = req.body;
  const { id } = req.params;

  const company = await UpdateSchedulesService({
    id,
    schedules
  });

  res.status(200).json(company);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const company = await DeleteCompanyService(id);

  res.status(200).json(company);
};

export const syncDueDate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { dueDate, updateAsaas = true, updateTrialExpiration = true } = req.body;

  const schema = Yup.object().shape({
    dueDate: Yup.string().required("Data de vencimento é obrigatória")
  });

  try {
    await schema.validate({ dueDate });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const result = await SyncCompanyDueDateService({
    companyId: parseInt(id),
    dueDate,
    updateAsaas,
    updateTrialExpiration
  });

  res.status(200).json(result);
};

export const checkExpiration = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await CheckCompanyExpirationService();
  res.status(200).json(result);
};

export const storeWithTrial = async (req: Request, res: Response): Promise<void> => {
  const newCompany: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    email: Yup.string().email().required(),
    document: Yup.string().required()
  });

  try {
    await schema.validate(newCompany);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const result = await CreateCompanyWithTrialService(newCompany);

  res.status(200).json(result);
};
