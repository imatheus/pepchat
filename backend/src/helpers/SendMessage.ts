import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
};

// Função para aguardar um tempo específico
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Função para enviar mensagem com retry automático
const sendMessageWithRetry = async (
  wbot: any,
  jid: string,
  content: any,
  maxRetries: number = 3
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar se a conexão ainda está ativa
      if (!wbot.user) {
        throw new Error("WhatsApp connection lost");
      }

      // Enviar mensagem com timeout personalizado
      const sentMessage = await Promise.race([
        wbot.sendMessage(jid, content),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Custom timeout")), 30000) // 30 segundos
        )
      ]);

      return sentMessage;
      
    } catch (error: any) {
      lastError = error;
      
      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s...
        await sleep(waitTime);
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError;
};

const getMessageOptions = async (body: string, mediaPath: string) => {
  const mimeType = require('mime-types').lookup(mediaPath);
  const mediaType = mimeType ? mimeType.split("/")[0] : "document";
  
  switch (mediaType) {
    case "image":
      return {
        image: { url: mediaPath },
        caption: body
      };
    case "video":
      return {
        video: { url: mediaPath },
        caption: body
      };
    case "audio":
      return {
        audio: { url: mediaPath },
        mimetype: mimeType
      };
    default:
      return {
        document: { url: mediaPath },
        mimetype: mimeType,
        fileName: path.basename(mediaPath)
      };
  }
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<any> => {
  try {
    const wbot = await GetWhatsappWbot(whatsapp);
    
    // Verificar se a conexão est�� ativa
    if (!wbot.user) {
      throw new Error("WhatsApp connection is not active");
    }
    
    // Verificar se é um grupo (contém "-" no número) ou conversa individual
    const numberStr = messageData.number.toString();
    const isGroup = numberStr.includes("-");
    const chatId = `${messageData.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;

    let message;

    if (messageData.mediaPath) {
      const options = await getMessageOptions(
        messageData.body,
        messageData.mediaPath
      );
      if (options) {
        message = await sendMessageWithRetry(wbot, chatId, options);
      }
    } else {
      const body = `\u200e${messageData.body}`;
      message = await sendMessageWithRetry(wbot, chatId, { text: body });
    }

    return message;
  } catch (err: any) {
    logger.error(`❌ Erro ao enviar mensagem:`, err);
    
    // Verificar tipo específico de erro para mensagem mais clara
    if (err.message?.includes("Timed Out") || err.message?.includes("timeout")) {
      throw new Error("Timeout ao enviar mensagem. Verifique a conexão do WhatsApp.");
    } else if (err.message?.includes("connection")) {
      throw new Error("Conexão WhatsApp perdida. Reconecte na seção Conexões.");
    } else if (err.message?.includes("not found") || err.message?.includes("invalid")) {
      throw new Error("Destinatário não encontrado ou inválido.");
    } else {
      throw new Error(`Erro ao enviar mensagem: ${err.message}`);
    }
  }
};