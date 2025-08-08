import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";
import AudioConverter from "../utils/AudioConverter";

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
      // Ler imagem como Buffer para garantir envio correto
      const imageBuffer = fs.readFileSync(mediaPath);
      return {
        image: imageBuffer,
        caption: body
      };
    case "video":
      // Ler vídeo como Buffer para garantir envio correto
      const videoBuffer = fs.readFileSync(mediaPath);
      return {
        video: videoBuffer,
        caption: body
      };
    case "audio":
      // Para áudios, tentar converter para OGG/Opus para melhor compatibilidade PTT
      let finalMimetype = mimeType;
      let convertedPath: string | null = null;
      
      try {
        // Verificar se já está em OGG/Opus
        const isAlreadyOggOpus = await AudioConverter.isOggOpus(mediaPath);
        
        if (!isAlreadyOggOpus) {
          logger.info(`Converting audio to OGG/Opus for better PTT compatibility: ${mediaPath}`);
          
          // Converter para OGG/Opus
          const tempOutputPath = mediaPath.replace(path.extname(mediaPath), '_helper_converted.ogg');
          convertedPath = await AudioConverter.convertToPTT(mediaPath, tempOutputPath);
          
          finalMimetype = 'audio/ogg; codecs=opus';
          
          logger.info(`Audio successfully converted to OGG/Opus`);
          
          // Limpar arquivo temporário após um tempo
          setTimeout(() => {
            AudioConverter.cleanupTempFile(convertedPath!);
          }, 10000); // 10 segundos
          
          // Ler áudio convertido como Buffer (OBRIGATÓRIO para PTT funcionar)
          const convertedAudioBuffer = fs.readFileSync(convertedPath);
          
          return {
            audio: convertedAudioBuffer, // Buffer direto - NÃO usar { url }
            mimetype: finalMimetype,
            ptt: true
            // NÃO incluir fileName - isso quebra o PTT!
            // NÃO incluir caption - PTT não tem caption
          };
        } else {
          finalMimetype = 'audio/ogg; codecs=opus';
          logger.info(`Audio already in OGG/Opus format`);
        }
      } catch (conversionError) {
        logger.warn(`Audio conversion failed, using original format:`, conversionError);
        // Manter mimetype original
      }
      
      // Ler áudio como Buffer (OBRIGATÓRIO para PTT funcionar)
      const audioBuffer = fs.readFileSync(mediaPath);
      
      return {
        audio: audioBuffer, // Buffer direto - NÃO usar { url }
        mimetype: finalMimetype,
        ptt: true // Sempre marcar como PTT
        // NÃO incluir fileName - isso quebra o PTT!
        // NÃO incluir caption - PTT não tem caption
      };
    default:
      // Para documentos, ler como Buffer também
      const documentBuffer = fs.readFileSync(mediaPath);
      return {
        document: documentBuffer,
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