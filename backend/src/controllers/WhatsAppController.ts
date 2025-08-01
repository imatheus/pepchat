import { Request, Response } from "express";
import { cacheLayer } from "../libs/cache";
import { getIO } from "../libs/socket";
import { getWbot, removeWbot } from "../libs/wbot";
import Whatsapp from "../models/Whatsapp";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";

interface WhatsappData {
  name: string;
  queueIds: number[];
  companyId: number;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
}

interface QueryParams {
  session?: number | string;
}

interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
}

interface Root {
  name: string;
  // eslint-disable-next-line camelcase
  access_token: string;
  // eslint-disable-next-line camelcase
  instagram_business_account: InstagramBusinessAccount;
  id: string;
}

export const index = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const { session } = req.query as QueryParams;
  const whatsapps = await ListWhatsAppsService({ companyId, session });

  res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    token
  }: WhatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    companyId,
    token
  });

  StartWhatsAppSession(whatsapp);

  const io = getIO();
  io.emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  res.status(200).json(whatsapp);
};


export const storeWebChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    name,
    welcomeMessage,
    primaryColor,
    position,
    companyName
  }: {
    name: string;
    welcomeMessage: string;
    primaryColor: string;
    position: string;
    companyName: string;
  } = req.body;
  const { companyId } = req.user;

  try {
    const { whatsapp } = await CreateWhatsAppService({
      name,
      status: "CONNECTED",
      isDefault: false,
      greetingMessage: welcomeMessage,
      complationMessage: "",
      outOfHoursMessage: "",
      queueIds: [],
      companyId,
      channel: "webchat",
      tokenMeta: JSON.stringify({
        primaryColor,
        position,
        companyName,
        welcomeMessage
      })
    });

    const io = getIO();
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp
    });

    res.status(200).json({
      message: "WebChat connection created successfully",
      whatsapp
    });
  } catch (error) {
    console.error("Error creating WebChat:", error);
    res.status(500).json({
      error: "Failed to create WebChat connection"
    });
  }
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { session } = req.query;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId, session);

  res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const io = getIO();

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  console.log(`Removendo conexão: ${whatsapp.name} (ID: ${whatsappId})`);

  if (whatsapp.channel === "whatsapp") {
    try {
      // Tentar desconectar o wbot se existir
      try {
        const wbot = getWbot(+whatsappId);
        if (wbot) {
          wbot.logout();
          wbot.ws.close();
        }
      } catch (err) {
        console.log("Wbot não encontrado ou já desconectado:", err.message);
      }

      // Remover da lista de sessões
      removeWbot(+whatsappId);
      
      // Limpar dados do Baileys
      await DeleteBaileysService(whatsappId);
      
      // Limpar cache
      await cacheLayer.delFromPattern(`sessions:${whatsappId}:*`);
      
      // Deletar do banco
      await DeleteWhatsAppService(whatsappId);

      console.log(`Conexão ${whatsapp.name} removida com sucesso`);

      io.emit(`company-${companyId}-whatsapp`, {
        action: "delete",
        whatsappId: +whatsappId
      });
    } catch (err) {
      console.error(`Erro ao remover conexão ${whatsapp.name}:`, err);
      throw err;
    }
  }

  if (whatsapp.channel === "webchat") {
    await DeleteWhatsAppService(whatsappId);

    console.log(`Conexão ${whatsapp.name} (${whatsapp.channel}) removida com sucesso`);

    io.emit(`company-${companyId}-whatsapp`, {
      action: "delete",
      whatsappId: +whatsappId
    });
  }

  res.status(200).json({ message: "Connection deleted successfully." });
};