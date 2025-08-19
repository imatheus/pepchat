import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket"import fs from "fs";
import path from "path";
;

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
  const { companyId } = r  const media = req.file as Express.Multer.File;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catc  // Se há arquivo de mídia, salvar na pasta responses
  if (media) {
    try {
      const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
      const responsesDir = path.join(uploadsDir, companyId.toString(), "responses", data.shortcode);
      
      // Criar diretório se não existir
      if (!fs.existsSync(responsesDir)) {
        fs.mkdirSync(responsesDir, { recursive: true });
      }

      const fileName = UploadHelper.generateFileName(media.originalname);
      const filePath = path.join(responsesDir, fileName);
      
      // Salvar arquivo
      if (media.buffer) {
        fs.writeFileSync(filePath, media.buffer);
      } else {
        fs.renameSync(media.path, filePath);
      }
    } catch (err) {
      console.log("Error saving quick message media:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }
  }

  const record = await CreateService({
    ...data,
DIA");
    }
  }

  const record = await CreateService({
    ...data,
    ...mediaData,

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
  req: Req  const media = req.file as Express.Multer.File;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await sch  // Se há arquivo de mídia, salvar na pasta responses
  if (media) {
    try {
      // Buscar registro atual para deletar arquivos antigos se existir
      const currentRecord = await ShowService(id);
      const oldResponsesDir = path.join(
        path.resolve(__dirname, "..", "..", "uploads"),
        companyId.toString(),
        "responses",
        currentRecord.shortcode
      );
      
      // Deletar pasta antiga se existir
      if (fs.existsSync(oldResponsesDir)) {
        fs.rmSync(oldResponsesDir, { recursive: true, force: true });
      }

      const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
      const responsesDir = path.join(uploadsDir, companyId.toString(), "responses", data.shortcode);
      
      // Criar diretório se não existir
      if (!fs.existsSync(responsesDir)) {
        fs.mkdirSync(responsesDir, { recursive: true });
      }

      const fileName = UploadHelper.generateFileName(media.originalname);
      const filePath = path.join(responsesDir, fileName);
      
      // Salvar arquivo
      if (media.buffer) {
        fs.writeFileSync(filePath, media.buffer);
      } else {
        fs.renameSync(media.path, filePath);
      }
    } catch (err) {
      console.log("Error updating quick message media:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }
  }

  const record = await UpdateService({
    ...data,
ick message media:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }
  }

  const record = await UpdateService({
    ...data,
    ...mediaData,
y) {
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

  res.status(200)  // Buscar registro para deletar arquivos
  const record = await ShowService(id);
  const responsesDir = path.join(
    path.resolve(__dirname, "..", "..", "uploads"),
    companyId.toString(),
    "responses",
    record.shortcode
  );
  
  // Deletar pasta de arquivos se existir
  if (fs.existsSync(responsesDir)) {
    fs.rmSync(responsesDir, { recursive: true, force: true });
  }

.json(record);
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
): Promise
export const sendQuickMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quickMessageId, ticketId } = req.body;
  const { companyId } = req.user;

  if (!quickMessageId || !ticketId) {
    throw new AppError("Quick message ID and ticket ID are required");
  }

  // Buscar o ticket
  const ticket = await Ticket.findByPk(ticketId, {
    include: ["contact", "queue"]
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // Verificar se o ticket pertence à empresa do usuário
  if (ticket.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  await SendQuickMessageService({
    quickMessageId: parseInt(quickMessageId),
    ticket
  });

  res.status(200).json({ message: "Quick message sent successfully" });
};
<void> => {
  const params = req.query as FindParams;
  const records: QuickMessage[] = await FindService(params);

  res.status(200).json(records);
};
