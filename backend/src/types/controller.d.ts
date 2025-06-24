import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      companyId?: string;
    }
  }
}

export type AsyncController = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void>;

export type Controller = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;