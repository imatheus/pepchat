import { WASocket } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";
import UploadHelper from "../../helpers/UploadHelper";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import AudioConverter from "../../utils/AudioConverter";
import { shouldSendAsPTT, getMimetypeForFormat } from "../../config/audio.config";

const execAsync = promisify(exec);

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
}

const SendWhatsAppMedia = async ({
  media,
  ticket
}: Request): Promise<Message> => {
  console.log("🎵 SendWhatsAppMedia called with:", {
    mediaType: media.mimetype,
    fileName: media.originalname,
    fileSize: media.size,
    ticketId: ticket.id,
    ticketChannel: ticket.channel,
    contactNumber: ticket.contact.number
  });
  
  try {
    const wbot = await GetTicketWbot(ticket);
    
    // Verificar se o wbot está conectado
    if (!wbot || !wbot.user) {
      console.error("❌ WhatsApp bot not connected or user not available");
      throw new AppError("ERR_WAPP_NOT_CONNECTED");
    }
    
    console.log("✅ WhatsApp bot connected, user:", wbot.user.id);

    // Determine message type based on media mimetype
    let messageContent: any;
    const mediaType = media.mimetype.split("/")[0];
    
    switch (mediaType) {
      case "image":
        const imageBuffer = fs.readFileSync(media.path);
        messageContent = {
          image: imageBuffer,
          caption: media.originalname
        };
        console.log("🖼️ Image buffer size:", imageBuffer.length, "bytes");
        break;
      case "video":
        const videoBuffer = fs.readFileSync(media.path);
        messageContent = {
          video: videoBuffer,
          caption: media.originalname
        };
        console.log("🎥 Video buffer size:", videoBuffer.length, "bytes");
        break;
      case "audio":
        let finalAudioBuffer: Buffer;
        let finalMimetype: string;
        let convertedAudioPath: string | null = null;
        let audioFormat: string = 'unknown';
        let sendAsPTT: boolean = true; // Padrão: enviar como PTT
        
        try {
          console.log("🔄 Iniciando processamento de áudio com estratégia iOS-compatível...");
          
          if (AudioConverter.isFFmpegAvailable()) {
            // NOVA ESTRATÉGIA: Usar conversão com múltiplos formatos
            const tempBasePath = media.path.replace(path.extname(media.path), '_converted');
            const conversionResult = await AudioConverter.convertToPTTNew(media.path, tempBasePath);
            
            convertedAudioPath = conversionResult.path;
            finalMimetype = getMimetypeForFormat(conversionResult.format);
            audioFormat = conversionResult.format;
            
            // Verificar se a conversão foi bem-sucedida
            if (fs.existsSync(convertedAudioPath) && fs.statSync(convertedAudioPath).size > 0) {
              console.log(`✅ Conversão ${audioFormat.toUpperCase()} concluída com sucesso`);
              finalAudioBuffer = fs.readFileSync(convertedAudioPath);
              
              // Determinar se deve enviar como PTT baseado na configuração
              sendAsPTT = shouldSendAsPTT(audioFormat);
              console.log(`📱 Formato ${audioFormat.toUpperCase()}: ${sendAsPTT ? 'PTT (mensagem de voz)' : 'áudio normal'} baseado na configuração`);
            } else {
              throw new Error('Conversão falhou - arquivo de saída inválido');
            }
          } else {
            console.warn("⚠️ FFmpeg não disponível - usando arquivo original");
            console.warn("💡 Para melhor compatibilidade iOS, instale FFmpeg: npm install");
            
            // Usar arquivo original como fallback
            finalAudioBuffer = fs.readFileSync(media.path);
            finalMimetype = AudioConverter.getBestMimetype(media.path);
            audioFormat = 'original';
          }
        } catch (conversionError) {
          console.warn("⚠️ Audio conversion failed, using original format:", conversionError);
          
          // Fallback: usar o arquivo original com melhor mimetype
          finalAudioBuffer = fs.readFileSync(media.path);
          finalMimetype = AudioConverter.getBestMimetype(media.path);
          audioFormat = 'fallback';
          
          console.log("📱 Using fallback mimetype:", finalMimetype);
        }
        
        // Validação do buffer de áudio
        if (!finalAudioBuffer || finalAudioBuffer.length === 0) {
          throw new Error("Buffer de áudio está vazio ou inválido");
        }
        
        if (!Buffer.isBuffer(finalAudioBuffer)) {
          throw new Error("finalAudioBuffer não é um Buffer válido");
        }
        
        const audioSizeKB = (finalAudioBuffer.length / 1024).toFixed(1);
        console.log("📊 Áudio processado:", {
          tamanho: `${audioSizeKB}KB`,
          formato: audioFormat,
          mimetype: finalMimetype,
          convertido: !!convertedAudioPath,
          enviarComoPTT: sendAsPTT
        });
        
        // Verificar se o arquivo não está muito pequeno
        if (parseFloat(audioSizeKB) < 2) {
          console.warn(`⚠️ Arquivo muito pequeno (${audioSizeKB}KB) - pode causar problemas no iOS`);
        }
        
        // Configurar mensagem de áudio
        if (sendAsPTT) {
          // Enviar como PTT (Push-to-Talk) - mensagem de voz
          messageContent = {
            audio: finalAudioBuffer,
            mimetype: finalMimetype,
            ptt: true
          };
          console.log("🎤 Mensagem configurada como PTT (mensagem de voz)");
        } else {
          // Enviar como áudio normal - arquivo de áudio
          messageContent = {
            audio: finalAudioBuffer,
            mimetype: finalMimetype,
            ptt: false
            // fileName: media.originalname // Opcional para áudio normal
          };
          console.log("🎵 Mensagem configurada como áudio normal (arquivo de áudio)");
        }
        
        // Limpar arquivo temporário se foi criado
        if (convertedAudioPath && convertedAudioPath !== media.path) {
          // Agendar limpeza após o envio
          setTimeout(() => {
            AudioConverter.cleanupTempFile(convertedAudioPath!);
          }, 5000); // 5 segundos após o envio
        }
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

    // Verificar se o arquivo existe
    if (!fs.existsSync(media.path)) {
      console.error("❌ Audio file does not exist:", media.path);
      throw new AppError("ERR_AUDIO_FILE_NOT_FOUND");
    }
    
    // Preparar envio
    console.log("🚀 Preparando envio para:", jid);
    
    // Enviar mensagem via Baileys
    console.log('📤 Enviando mensagem...');
    
    const sentMessage = await wbot.sendMessage(jid, messageContent);
    
    console.log("✅ Mensagem enviada com sucesso:", {
      id: sentMessage?.key?.id,
      status: sentMessage?.status
    });

    // Debug: verificar se sentMessage foi retornado corretamente
    if (!sentMessage || !sentMessage.key || !sentMessage.key.id) {
      console.error("Error: sentMessage or sentMessage.key.id is undefined", {
        sentMessage,
        hasKey: !!sentMessage?.key,
        hasId: !!sentMessage?.key?.id
      });
      throw new AppError("ERR_SENDING_WAPP_MSG: Invalid message response");
    }

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