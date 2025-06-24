import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";
import UploadHelper from "../helpers/UploadHelper";

import ListService from "../services/CampaignService/ListService";
import CreateService from "../services/CampaignService/CreateService";
import ShowService from "../services/CampaignService/ShowService";
import UpdateService from "../services/CampaignService/UpdateService";
import DeleteService from "../services/CampaignService/DeleteService";
import FindService from "../services/CampaignService/FindService";

import Campaign from "../models/Campaign";

import AppError from "../errors/AppError";
import { CancelService } from "../services/CampaignService/CancelService";
import { RestartService } from "../services/CampaignService/RestartService";
import ProcessPendingCampaigns from "../services/CampaignService/ProcessPendingCampaigns";
import TestMediaSend from "../services/CampaignService/TestMediaSend";
import ProcessCampaignConfirmation from "../services/CampaignService/ProcessCampaignConfirmation";
import MessageVariables from "../helpers/MessageVariables";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  companyId: string | number;
};

type StoreData = {
  name: string;
  status: string;
  confirmation: boolean;
  scheduledAt: string;
  companyId: number;
  contactListId: number;
};

type FindParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId
  });

  res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateService({
    ...data,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-campaign`, {
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
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    id
  });

  const io = getIO();
  io.emit(`company-${companyId}-campaign`, {
    action: "update",
    record
  });

  res.status(200).json(record);
};

export const cancel = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  await CancelService(+id);

  res.status(204).json({ message: "Cancelamento realizado" });
};

export const restart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  await RestartService(+id);

  res.status(204).json({ message: "Reinício dos disparos" });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.emit(`company-${companyId}-campaign`, {
    action: "delete",
    id
  });

  res.status(200).json({ message: "Campaign deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const params = req.query as FindParams;
  const records: Campaign[] = await FindService(params);

  res.status(200).json(records);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { companyId } = req.user;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      throw new AppError("Campaign not found");
    }

    // Remover arquivo anterior se existir
    if (campaign.mediaPath) {
      UploadHelper.deleteFile(campaign.mediaPath);
    }

    // Organizar arquivo por empresa e categoria
    const fileName = UploadHelper.generateFileName(file.originalname);
    const uploadConfig = {
      companyId: companyId,
      category: 'campaigns' as const
    };

    let mediaPath: string;
    try {
      // Salvar arquivo no diretório organizado
      if (file.buffer) {
        mediaPath = await UploadHelper.saveBuffer(file.buffer, uploadConfig, fileName);
      } else {
        mediaPath = await UploadHelper.moveFile(file.path, uploadConfig, fileName);
      }
    } catch (err) {
      console.log("Error organizing campaign media file:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }

    // Atualizar campanha com novo caminho
    campaign.mediaPath = mediaPath;
    campaign.mediaName = file.originalname;
    await campaign.save();

    res.send({ 
      mensagem: "Arquivo anexado com sucesso",
      mediaPath: mediaPath,
      mediaName: file.originalname
    });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      throw new AppError("Campaign not found");
    }

    // Remover arquivo se existir
    if (campaign.mediaPath) {
      UploadHelper.deleteFile(campaign.mediaPath);
    }

    campaign.mediaPath = null;
    campaign.mediaName = null;
    await campaign.save();
    res.send({ mensagem: "Arquivo excluído com sucesso" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const processPending = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await ProcessPendingCampaigns();
    res.status(200).json({ message: "Pending campaigns processed successfully" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const testMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { number } = req.body;

    if (!number) {
      throw new AppError("Number is required");
    }

    // Buscar campanha
    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      throw new AppError("Campaign not found");
    }

    if (!campaign.mediaPath || !campaign.mediaName) {
      throw new AppError("Campaign has no media attached");
    }

    // Testar envio
    const result = await TestMediaSend({
      whatsappId: campaign.whatsappId || 1, // usar WhatsApp padrão se não definido
      number: number,
      mediaPath: campaign.mediaPath,
      mediaName: campaign.mediaName,
      message: campaign.message1 || "Teste de mídia"
    });

    res.status(200).json(result);
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const processConfirmation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { campaignId, contactNumber, responseMessage } = req.body;
    const { companyId } = req.user;

    if (!campaignId || !contactNumber || !responseMessage) {
      throw new AppError("Campaign ID, contact number and response message are required");
    }

    const result = await ProcessCampaignConfirmation({
      campaignId: parseInt(campaignId),
      contactNumber: contactNumber,
      responseMessage: responseMessage,
      companyId: companyId
    });

    res.status(200).json({
      success: result,
      message: result ? "Confirmation processed successfully" : "Confirmation not processed"
    });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const previewMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      throw new AppError("Message is required");
    }

    const preview = MessageVariables.generatePreview(message);
    const variables = MessageVariables.extractVariables(message);

    res.status(200).json({
      original: message,
      preview: preview,
      variables: variables,
      availableVariables: [
        'nome', 'numero', 'email'
      ]
    });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};
