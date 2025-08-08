import { WASocket } from "@adiwajshing/baileys";
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
        
        try {
          // Verificar se o arquivo é realmente OGG/Opus válido
          const isRealOggOpus = await AudioConverter.isOggOpus(media.path);
          
          if (isRealOggOpus) {
            console.log("✅ Audio is REAL OGG/Opus format - perfect for PTT");
            finalAudioBuffer = fs.readFileSync(media.path);
            finalMimetype = 'audio/ogg; codecs=opus';
          } else {
            console.log("❌ Audio is NOT real OGG/Opus - conversion required");
            
            if (AudioConverter.isFFmpegAvailable()) {
              console.log("🔄 Converting to REAL OGG/Opus for PTT compatibility");
              
              // Converter para OGG/Opus REAL
              const tempOutputPath = media.path.replace(path.extname(media.path), '_converted.ogg');
              convertedAudioPath = await AudioConverter.convertToPTT(media.path, tempOutputPath);
              
              // Verificar se a conversão criou um OGG real
              const isConvertedReal = AudioConverter.isRealOggFile(convertedAudioPath);
              
              if (isConvertedReal) {
                console.log("✅ Conversion successful - now REAL OGG/Opus");
                finalAudioBuffer = fs.readFileSync(convertedAudioPath);
                finalMimetype = 'audio/ogg; codecs=opus';
              } else {
                throw new Error('Conversão falhou - arquivo não é OGG real');
              }
            } else {
              console.log("❌ PROBLEMA: FFmpeg não disponível e arquivo não é OGG real!");
              console.log("🛠️ SOLUÇÃO: Execute 'npm install' no diretório backend");
              console.log("📝 Ou execute: ./install-deps-now.bat (Windows) ou ./install-deps-now.sh (Linux)");
              
              // Usar arquivo original mas avisar claramente
              finalAudioBuffer = fs.readFileSync(media.path);
              finalMimetype = AudioConverter.getBestMimetype(media.path);
              
              console.log("⚠️ AVISO: Enviando arquivo original (pode não funcionar como PTT)");
              console.log("📱 Mimetype usado:", finalMimetype);
              console.log("🔄 Para PTT funcionar 100%, instale FFmpeg e reinicie o servidor");
            }
          }
        } catch (conversionError) {
          console.warn("⚠️ Audio conversion failed, using original format:", conversionError);
          
          // Fallback: usar o arquivo original com melhor mimetype
          finalAudioBuffer = fs.readFileSync(media.path);
          finalMimetype = AudioConverter.getBestMimetype(media.path);
          
          console.log("📱 Using fallback mimetype:", finalMimetype);
        }
        
        // 🔍 DIAGNÓSTICO CRÍTICO: Verificar se buffer é válido
        console.log("🔍 DIAGNÓSTICO BUFFER:", {
          bufferExists: !!finalAudioBuffer,
          bufferLength: finalAudioBuffer?.length || 0,
          bufferType: typeof finalAudioBuffer,
          isBuffer: Buffer.isBuffer(finalAudioBuffer),
          first10Bytes: finalAudioBuffer?.slice(0, 10).toString('hex') || 'N/A',
          mimetype: finalMimetype
        });
        
        // Validar buffer antes do envio
        if (!finalAudioBuffer || finalAudioBuffer.length === 0) {
          throw new Error("❌ ERRO CRÍTICO: Buffer de áudio está vazio ou inválido!");
        }
        
        if (!Buffer.isBuffer(finalAudioBuffer)) {
          throw new Error("❌ ERRO CRÍTICO: finalAudioBuffer não é um Buffer válido!");
        }
        
        // Configurar mensagem de áudio como PTT (Push-to-Talk)
        messageContent = {
          audio: finalAudioBuffer, // Buffer do áudio (OBRIGATÓRIO)
          mimetype: finalMimetype, // Mimetype correto (OBRIGATÓRIO)
          ptt: true, // Flag PTT (OBRIGATÓRIO para mensagem de voz)
          // NÃO incluir fileName - isso faz o WhatsApp tratar como arquivo!
          // NÃO incluir caption - PTT não tem caption
          // seconds: 10 // Opcional - duração estimada
        };
        
        console.log("🎤 Audio message configured as PTT:", {
          mimetype: finalMimetype,
          bufferSize: finalAudioBuffer.length,
          isPTT: true,
          isConverted: !!convertedAudioPath
        });
        
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
    
    const fileStats = fs.statSync(media.path);
    // 🔍 DIAGNÓSTICO FINAL: Verificar tudo antes do envio
    console.log("🔍 DIAGNÓSTICO ENVIO FINAL:", {
      mediaType,
      jid,
      ticketId: ticket.id,
      originalMimetype: media.mimetype,
      finalMimetype: messageContent.mimetype,
      filename: media.originalname,
      originalFileSize: fileStats.size,
      filePath: media.path,
      hasBuffer: !!(messageContent.audio || messageContent.image || messageContent.video),
      bufferSize: messageContent.audio?.length || messageContent.image?.length || messageContent.video?.length || 'N/A',
      messageContentKeys: Object.keys(messageContent),
      isPTT: messageContent.ptt,
      hasFileName: !!messageContent.fileName,
      hasCaption: !!messageContent.caption
    });
    
    // Verificar versão do Baileys
    try {
      const baileysPackage = require('@adiwajshing/baileys/package.json');
      console.log('🔍 VERSÃO BAILEYS:', baileysPackage.version);
    } catch (e) {
      try {
        const baileysPackage = require('@whiskeysockets/baileys/package.json');
        console.log('🔍 VERSÃO BAILEYS (whiskeysockets):', baileysPackage.version);
      } catch (e2) {
        console.log('🔍 Não foi possível detectar versão do Baileys');
      }
    }

    // 🔍 DIAGNÓSTICO: Envio via Baileys
    console.log('🚀 Enviando mensagem via Baileys...');
    console.log('🔍 messageContent final:', JSON.stringify({
      ...messageContent,
      audio: messageContent.audio ? `Buffer(${messageContent.audio.length} bytes)` : undefined
    }, null, 2));
    
    const sentMessage = await wbot.sendMessage(jid, messageContent);
    
    console.log('🔍 RESPOSTA BAILEYS:', {
      success: !!sentMessage,
      messageId: sentMessage?.key?.id,
      status: sentMessage?.status,
      timestamp: sentMessage?.messageTimestamp,
      fromMe: sentMessage?.key?.fromMe,
      remoteJid: sentMessage?.key?.remoteJid,
      hasMessage: !!sentMessage?.message,
      messageType: sentMessage?.message ? Object.keys(sentMessage.message)[0] : 'unknown'
    });
    console.log("✅ Message sent successfully, response:", {
      messageId: sentMessage?.key?.id,
      status: sentMessage?.status,
      timestamp: sentMessage?.messageTimestamp,
      fromMe: sentMessage?.key?.fromMe,
      remoteJid: sentMessage?.key?.remoteJid
    });
    
    // Aguardar um pouco para verificar se há atualização de status
    setTimeout(() => {
      console.log("🔄 Checking message status after 2 seconds:", {
        messageId: sentMessage?.key?.id,
        currentStatus: sentMessage?.status
      });
    }, 2000);

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