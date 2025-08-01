import { Request, Response } from "express";

// Facebook and Instagram webhooks have been removed from the system
// This controller is no longer functional

export const index = async (req: Request, res: Response): Promise<void> => {
  res.status(404).json({
    message: "Facebook and Instagram integrations have been removed"
  });
};

export const webHook = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(404).json({
    message: "Facebook and Instagram webhooks have been removed"
  });
};