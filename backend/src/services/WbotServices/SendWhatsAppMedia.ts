import { WASocket } from "@adiwajshing/baileys";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";
import UploadHelper from "../../helpers/UploadHelper";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
}

const SendWhatsAppMedia = async ({
  media,
  ticket
}: Request): Promise<Message> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    // Determine message type based on media mimetype
    let messageContent: any;
    const mediaType = media.mimetype.split("/")[0];
    
    switch (mediaType) {
      case "image":
        messageContent = {
          image: { url: media.path },
          caption: media.originalname
        };
        break;
      case "video":
        messageContent = {
          video: { url: media.path },
          caption: media.originalname
        };
        break;
      case "audio":
        messageContent = {
          audio: { url: media.path },
          mimetype: media.mimetype
        };
        break;
      default:
        messageContent = {
          document: { url: media.path },
          mimetype: media.mimetype,
          fileName: media.originalname
        };
    }

    // Construir o JID corretamente para grupos e contatos individuais
    const isGroup = ticket.contact.isGroup || ticket.contact.number.includes("-") || ticket.contact.number.endsWith("@g.us");
    let jid: string;
    
    if (ticket.contact.number.includes("@")) {
      jid = ticket.contact.number;
    } else {
      jid = `${ticket.contact.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
    }

    const sentMessage = await wbot.sendMessage(jid, messageContent);

    // Organizar arquivo por empresa e categoria
    const fileName = UploadHelper.generateFileName(media.originalname);
    const uploadConfig = {
      companyId: ticket.companyId,
      category: 'chat' as const,
      ticketId: ticket.id
    };

    let mediaPath: string;
    try {
      // Salvar arquivo no diretório organizado
      if (media.buffer) {
        mediaPath = await UploadHelper.saveBuffer(media.buffer, uploadConfig, fileName);
      } else {
        mediaPath = await UploadHelper.moveFile(media.path, uploadConfig, fileName);
      }
    } catch (err) {
      console.log("Error organizing media file:", err);
      throw new AppError("ERR_SAVING_MEDIA");
    }

    // Create message record in database
    const messageData = {
      id: sentMessage.key.id,
      ticketId: ticket.id,
      contactId: undefined, // fromMe messages don't have contactId
      body: "", // Deixar vazio para não mostrar o nome do arquivo no chat
      fromMe: true,
      read: true,
      mediaType: mediaType,
      mediaUrl: mediaPath, // Usar caminho organizado
      ack: 1, // sent
      dataJson: JSON.stringify(sentMessage)
    };

    // Update ticket's last message with friendly description
    const lastMessageText = mediaType === 'image' ? '📷 Imagem' : 
                           mediaType === 'video' ? '🎥 Vídeo' : 
                           mediaType === 'audio' ? '🎵 Áudio' : 
                           '📄 Documento';
    await ticket.update({ lastMessage: lastMessageText });

    // Create message and emit socket event
    const newMessage = await CreateMessageService({ 
      messageData, 
      companyId: ticket.companyId 
    });

    return newMessage;

  } catch (err) {
    console.log("Error sending WhatsApp media:", err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;