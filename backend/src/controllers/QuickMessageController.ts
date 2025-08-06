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
import UploadHelper from "../helpers/UploadHelper";

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
  const media = req.file as Express.Multer.File;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  let mediaData = {};
  
  // Se há arquivo de mídia, processar e salvar
  if (media) {
    try {
      const fileName = UploadHelper.generateFileName(media.originalname);
      const uploadConfig = {
        companyId: companyId,
        category: 'responses' as const
      };

      let mediaPath: string;
      if (media.buffer) {
        mediaPath = await UploadHelper.saveBuffer(media.buffer, uploadConfig, fileName);
      } else {
        mediaPath = await UploadHelper.moveFile(media.path, uploadConfig, fileName);
      }

      const mediaType = media.mimetype.split("/")[0];
      
      mediaData = {
        mediaPath: mediaPath,
        mediaType: mediaType,
        mediaName: media.originalname
      };
    } catch (err) {
      console.log("Error saving quick message media:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }
  }

  const record = await CreateService({
    ...data,
    ...mediaData,
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
  const media = req.file as Express.Multer.File;

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

  let mediaData = {};
  
  // Se há arquivo de mídia, processar e salvar
  if (media) {
    try {
      // Buscar registro atual para deletar arquivo antigo se existir
      const currentRecord = await ShowService(id);
      if (currentRecord.mediaPath) {
        UploadHelper.deleteFile(currentRecord.mediaPath);
      }

      const fileName = UploadHelper.generateFileName(media.originalname);
      const uploadConfig = {
        companyId: companyId,
        category: 'responses' as const
      };

      let mediaPath: string;
      if (media.buffer) {
        mediaPath = await UploadHelper.saveBuffer(media.buffer, uploadConfig, fileName);
      } else {
        mediaPath = await UploadHelper.moveFile(media.path, uploadConfig, fileName);
      }

      const mediaType = media.mimetype.split("/")[0];
      
      mediaData = {
        mediaPath: mediaPath,
        mediaType: mediaType,
        mediaName: media.originalname
      };
    } catch (err) {
      console.log("Error updating quick message media:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }
  }

  const record = await UpdateService({
    ...data,
    ...mediaData,
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
