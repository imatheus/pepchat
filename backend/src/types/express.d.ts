import { Request, Response, NextFunction } from "express";

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<Response | void>;

export type RequestHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Response | void;