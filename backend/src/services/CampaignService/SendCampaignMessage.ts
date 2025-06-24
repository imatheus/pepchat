import fs from "fs";
import path from "path";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

interface Request {
  body: string;
  number: string;
  whatsappId: number;
  companyId: number;
  mediaPath?: string;
  mediaName?: string;
}

const SendCampaignMessage = async ({
  body,
  number,
  whatsappId,
  companyId,
  mediaPath,
  mediaName
}: Request): Promise<void> => {
  try {
    // Buscar WhatsApp
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    if (!whatsapp) {
      throw new AppError("WhatsApp not found");
    }

    // Verificar se o WhatsApp está conectado
    if (whatsapp.status !== "CONNECTED") {
      throw new AppError("WhatsApp not connected");
    }

    // Obter bot do WhatsApp
    const wbot = getWbot(whatsappId);
    if (!wbot) {
      throw new AppError("WhatsApp bot not found");
    }

    // Formatar número para envio
    const formattedNumber = number.includes("@") 
      ? number 
      : `${number}@s.whatsapp.net`;

    // Verificar se há anexo para enviar
    if (mediaPath && mediaName) {
      // O mediaPath já vem no formato correto: "companyId/campaigns/filename"
      const fullMediaPath = path.resolve("uploads", mediaPath);
      
      logger.info(`Campaign media info - Path: ${mediaPath}, Name: ${mediaName}, Full path: ${fullMediaPath}`);
      
      // Verificar se o arquivo existe
      if (fs.existsSync(fullMediaPath)) {
        const stats = fs.statSync(fullMediaPath);
        logger.info(`Media file found - Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
        try {
          // Determinar tipo de mídia e mimetype baseado na extensão
          const extension = path.extname(mediaName).toLowerCase();
          let messageType = "document";
          let mimetype = "application/octet-stream";
          
          if (['.jpg', '.jpeg'].includes(extension)) {
            messageType = "image";
            mimetype = "image/jpeg";
          } else if (extension === '.png') {
            messageType = "image";
            mimetype = "image/png";
          } else if (['.gif'].includes(extension)) {
            messageType = "image";
            mimetype = "image/gif";
          } else if (['.webp'].includes(extension)) {
            messageType = "image";
            mimetype = "image/webp";
          } else if (['.mp4'].includes(extension)) {
            messageType = "video";
            mimetype = "video/mp4";
          } else if (['.avi'].includes(extension)) {
            messageType = "video";
            mimetype = "video/avi";
          } else if (['.mov'].includes(extension)) {
            messageType = "video";
            mimetype = "video/quicktime";
          } else if (['.mp3'].includes(extension)) {
            messageType = "audio";
            mimetype = "audio/mpeg";
          } else if (['.wav'].includes(extension)) {
            messageType = "audio";
            mimetype = "audio/wav";
          } else if (['.ogg'].includes(extension)) {
            messageType = "audio";
            mimetype = "audio/ogg";
          } else if (['.pdf'].includes(extension)) {
            messageType = "document";
            mimetype = "application/pdf";
          } else if (['.doc', '.docx'].includes(extension)) {
            messageType = "document";
            mimetype = "application/msword";
          } else if (['.xls', '.xlsx'].includes(extension)) {
            messageType = "document";
            mimetype = "application/vnd.ms-excel";
          } else if (['.txt'].includes(extension)) {
            messageType = "document";
            mimetype = "text/plain";
          }

          logger.info(`Media type detected: ${messageType}, mimetype: ${mimetype} for file: ${mediaName}`);

          // Ler arquivo como buffer para garantir compatibilidade
          const mediaBuffer = fs.readFileSync(fullMediaPath);
          
          // Preparar mensagem com mídia
          const messageContent: any = {};
          
          if (messageType === "image") {
            messageContent.image = mediaBuffer;
            if (body) messageContent.caption = body;
          } else if (messageType === "video") {
            messageContent.video = mediaBuffer;
            if (body) messageContent.caption = body;
          } else if (messageType === "audio") {
            messageContent.audio = mediaBuffer;
            messageContent.mimetype = mimetype;
          } else {
            messageContent.document = mediaBuffer;
            messageContent.fileName = mediaName;
            messageContent.mimetype = mimetype;
            if (body) messageContent.caption = body;
          }

          logger.info(`Sending media message to ${number}:`, { 
            messageType, 
            fileName: mediaName, 
            mimetype,
            bufferSize: mediaBuffer.length 
          });

          // Enviar mensagem com mídia
          await wbot.sendMessage(formattedNumber, messageContent);
          
          logger.info(`Campaign message with media sent successfully to ${number} via WhatsApp ${whatsappId}`);
          
        } catch (mediaError) {
          logger.error(`Error sending media for campaign to ${number}:`, mediaError);
          
          // Se falhar ao enviar mídia, enviar apenas texto
          if (body) {
            await wbot.sendMessage(formattedNumber, { text: body });
            logger.info(`Campaign text message sent as fallback to ${number}`);
          }
        }
      } else {
        logger.warn(`Media file not found: ${fullMediaPath}. Sending text only.`);
        
        // Se arquivo não existe, enviar apenas texto
        if (body) {
          await wbot.sendMessage(formattedNumber, { text: body });
        }
      }
    } else {
      // Enviar apenas mensagem de texto
      logger.info(`Sending text-only message to ${number}`);
      if (body) {
        await wbot.sendMessage(formattedNumber, { text: body });
      }
    }

    logger.info(`Campaign message sent successfully to ${number} via WhatsApp ${whatsappId}`);

  } catch (err) {
    logger.error(`Error sending campaign message to ${number}:`, err);
    throw new AppError("ERR_SENDING_CAMPAIGN_MSG");
  }
};

export default SendCampaignMessage;