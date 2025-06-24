import "reflect-metadata";
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { join } from "path";

import "./database";
import "./queues";
import routes from "./routes";
import AppError from "./errors/AppError";
import uploadConfig from "./config/upload";
import { logger } from "./utils/logger";

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(join(__dirname, "..", "public")));
app.use("/uploads", express.static(join(__dirname, "..", "uploads")));

app.use(routes);

const errorHandler: express.ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

export default app;