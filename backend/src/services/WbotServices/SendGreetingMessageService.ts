import fs from "fs";
import path from "path";
import { logger } from "../../utils/logger";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import SendWhatsAppMedia from "./SendWhatsAppMedia";
import { getWbot } from "../../libs/wbot";
import formatBody from "../../helpers/Mustache";
import { verifyMessage } from "./wbotMessageListener";
import { Op } from "sequelize";
import CreateMessageService from "../MessageServices/CreateMessageService";
import UploadHelper from "../../helpers/UploadHelper";

interface GreetingFile {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

const SendGreetingMessageService = async (
  ticket: Ticket,
  contact: Contact,
  whatsappId: number,
  companyId: number
): Promise<void> => {
  try {
    // Verificar se já existe algum ticket anterior para este contato
    // Se existir, não enviar mensagem de saudação
    const existingTicket = await Ticket.findOne({
      where: {
        contactId: contact.id,
        companyId,
        id: {
          [Op.ne]: ticket.id // Excluir o ticket atual da busca
        }
      },
      order: [["createdAt", "ASC"]] // Buscar o mais antigo primeiro
    });

    if (existingTicket) {
      logger.info(`Contact ${contact.id} already has previous tickets. Skipping greeting message for ticket ${ticket.id}`);
      return;
    }

    // Buscar informações do WhatsApp
    const whatsapp = await Whatsapp.findByPk(whatsappId, {
      include: ["queues"]
    });

    if (!whatsapp) {
      logger.error(`WhatsApp connection not found: ${whatsappId}`);
      return;
    }

    // Verificar se há mensagem de saudação configurada
    if (!whatsapp.greetingMessage || whatsapp.greetingMessage.trim() === "") {
      logger.info(`No greeting message configured for WhatsApp ${whatsappId}`);
      return;
    }

    // Buscar arquivos de saudação
    const uploadsDir = path.resolve(__dirname, "..", "..", "..", "uploads");
    const greetingDir = path.join(uploadsDir, companyId.toString(), "connections", whatsappId.toString());
    
    let greetingFiles: GreetingFile[] = [];
    
    if (fs.existsSync(greetingDir)) {
      const files = fs.readdirSync(greetingDir);
      greetingFiles = files.map(filename => {
        const filePath = path.join(greetingDir, filename);
        const stats = fs.statSync(filePath);
        
        // Determinar mimetype baseado na extensão
        const ext = path.extname(filename).toLowerCase();
        let mimetype = "application/octet-stream";
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
          mimetype = `image/${ext.substring(1)}`;
        } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
          mimetype = `video/${ext.substring(1)}`;
        } else if (['.pdf'].includes(ext)) {
          mimetype = 'application/pdf';
        } else if (['.doc', '.docx'].includes(ext)) {
          mimetype = 'application/msword';
        }
        
        return {
          filename,
          path: filePath,
          mimetype,
          size: stats.size
        };
      });
    }

    // Obter instância do bot
    const wbot = getWbot(whatsappId);
    if (!wbot) {
      logger.error(`WhatsApp bot not found for ID: ${whatsappId}`);
      return;
    }

    // Enviar mensagem de saudação formatada
    const formattedGreeting = formatBody(whatsapp.greetingMessage, contact);
    await SendWhatsAppMessage({ body: formattedGreeting, ticket });

    // Enviar arquivos de saudação se existirem
    if (greetingFiles.length > 0) {
      logger.info(`Sending ${greetingFiles.length} greeting files for ticket ${ticket.id}`);
      
      for (const file of greetingFiles) {
        try {
          // Construir o JID corretamente para grupos e contatos individuais
          const isGroup = ticket.contact.isGroup || ticket.contact.number.includes("-") || ticket.contact.number.endsWith("@g.us");
          let jid: string;
          
          if (ticket.contact.number.includes("@")) {
            jid = ticket.contact.number;
          } else {
            jid = `${ticket.contact.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
          }

          const fileBuffer = fs.readFileSync(file.path);
          let sentMessage: any;
          
          if (file.mimetype.startsWith('image/')) {
            // Enviar como imagem
            sentMessage = await wbot.sendMessage(jid, {
              image: fileBuffer,
              caption: ""
            });
          } else if (file.mimetype.startsWith('video/')) {
            // Enviar como vídeo
            sentMessage = await wbot.sendMessage(jid, {
              video: fileBuffer,
              caption: "",
              mimetype: file.mimetype
            });
          } else {
            // Enviar como documento
            sentMessage = await wbot.sendMessage(jid, {
              document: fileBuffer,
              fileName: file.filename,
              mimetype: file.mimetype
            });
          }

          // Salvar arquivo no diretório organizado
          const fileName = UploadHelper.generateFileName(file.filename);
          const uploadConfig = {
            companyId: ticket.companyId,
            category: 'chat' as const,
            ticketId: ticket.id
          };

          let mediaPath: string;
          try {
            mediaPath = await UploadHelper.saveBuffer(fileBuffer, uploadConfig, fileName);
          } catch (err) {
            logger.error(err, "Error organizing greeting media file");
            // Fallback para usar o caminho original
            mediaPath = file.filename;
          }

          // Criar registro da mensagem no banco de dados
          const mediaType = file.mimetype.split("/")[0];
          const messageData = {
            id: sentMessage.key.id,
            ticketId: ticket.id,
            contactId: undefined, // fromMe messages don't have contactId
            body: "", // Deixar vazio para não mostrar o nome do arquivo no chat
            fromMe: true,
            read: true,
            mediaType: mediaType,
            mediaUrl: mediaPath,
            ack: 1, // sent
            dataJson: JSON.stringify(sentMessage)
          };

          // Atualizar última mensagem do ticket com descrição mais amigável
          const lastMessageText = mediaType === 'image' ? '📷 Imagem' : 
                                 mediaType === 'video' ? '🎥 Vídeo' : 
                                 mediaType === 'audio' ? '🎵 Áudio' : 
                                 '📄 Documento';
          await ticket.update({ lastMessage: lastMessageText });

          // Criar mensagem e emitir evento socket
          await CreateMessageService({ 
            messageData, 
            companyId: ticket.companyId 
          });
          
          logger.info(`Greeting file sent successfully: ${file.filename}`);
          
          // Pequeno delay entre envios para evitar spam
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (fileError) {
          logger.error(fileError, `Error sending greeting file: ${file.filename}`);
        }
      }
    }

    logger.info(`Greeting message sent successfully for ticket ${ticket.id} (first contact with ${contact.name})`);
  } catch (error) {
    logger.error(error, `Error sending greeting message for ticket ${ticket.id}`);
  }
};

export default SendGreetingMessageService;