import { Request, Response } from "express";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Queue from "../models/Queue";
import Ticket from "../models/Ticket";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import CheckIsValidContact from "../services/WbotServices/CheckIsValidContact";
import { SendMessage } from "../helpers/SendMessage";

import {sendFacebookMessageMedia} from "../services/FacebookServices/sendFacebookMessageMedia";
import sendFaceMessage from "../services/FacebookServices/sendFacebookMessage";

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  if (profile !== "admin") {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId,
    companyId,
    queues
  });

  if (ticket.channel === "whatsapp") {
    SetTicketMessagesAsRead(ticket);
  }

  res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;

  const ticket = await ShowTicketService(ticketId, companyId);
  const { channel } = ticket;
  if (channel === "whatsapp") {
    SetTicketMessagesAsRead(ticket);
  }

  if (medias) {
    if (channel === "whatsapp") {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await SendWhatsAppMedia({ media, ticket });
        })
      );
    }

    if (["facebook", "instagram"].includes(channel)) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await sendFacebookMessageMedia({ media, ticket });
        })
      );
    }


  } else {
    if (["facebook", "instagram"].includes(channel)) {
      console.log(`Checking if ${ticket.contact.number} is a valid ${channel} contact`)
      await sendFaceMessage({ body, ticket, quotedMsg });
    }

    if (channel === "whatsapp") {
      await SendWhatsAppMessage({ body, ticket, quotedMsg });
    }
  }

  res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  // First get the message to get the whatsappId and ticketId
  const message = await Message.findByPk(messageId, {
    include: [{ model: Ticket, as: "ticket" }]
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  const whatsappId = message.ticket.whatsappId;
  
  const deletedMessage = await DeleteWhatsAppMessage(messageId, whatsappId);

  const io = getIO();
  io.to(`ticket:${deletedMessage.ticketId}`).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message: deletedMessage
  });

  res.send();
};

export const send = async (req: Request, res: Response): Promise<void> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new AppError("Conexão WhatsApp não encontrada. Verifique se o token está correto.", 404);
    }

    if (!whatsapp.status || whatsapp.status !== "CONNECTED") {
      throw new AppError("WhatsApp não está conectado. Verifique a conexão na seção 'Conexões'.", 400);
    }

    if (messageData.number === undefined) {
      throw new AppError("O número é obrigatório", 400);
    }

    const numberToTest = messageData.number;
    const body = messageData.body;

    const companyId = whatsapp.companyId;

    try {
      const CheckValidNumber = await CheckContactNumber(numberToTest, companyId);
      const number = CheckValidNumber.jid.replace(/\D/g, "");

      if (medias) {
        // Enviar mídia diretamente
        await Promise.all(
          medias.map(async (media: Express.Multer.File) => {
            await SendMessage(whatsapp, {
              number,
              body: media.originalname,
              mediaPath: media.path
            });
          })
        );
      } else {
        // Enviar mensagem de texto diretamente
        await SendMessage(whatsapp, {
          number,
          body
        });
      }

      res.send({ mensagem: "Mensagem enviada com sucesso" });
    } catch (checkError: any) {
      if (checkError.message === "ERR_CHECK_NUMBER") {
        throw new AppError("Número não possui WhatsApp ativo", 400);
      } else if (checkError.message === "ERR_NO_DEF_WAPP_FOUND") {
        throw new AppError("Nenhuma conexão WhatsApp padrão encontrada. Configure uma conexão como padrão na seção 'Conexões'.", 400);
      } else {
        throw new AppError(`Erro ao validar número: ${checkError.message}`, 400);
      }
    }
  } catch (err: any) {
    // Se já é um AppError, apenas re-throw
    if (err instanceof AppError) {
      throw err;
    }
    
    // Para outros erros, log e throw genérico
    console.error("Erro no envio de mensagem:", err);
    throw new AppError(
      "Não foi possível enviar a mensagem, tente novamente em alguns instantes",
      500
    );
  }
};
