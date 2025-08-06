import fs from "fs";
import path from "path";
import { logger } from "../../utils/logger";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import { getWbot } from "../../libs/wbot";
import formatBody from "../../helpers/Mustache";
import { verifyMessage } from "./wbotMessageListener";
import { Op } from "sequelize";

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
          const fileBuffer = fs.readFileSync(file.path);
          
          if (file.mimetype.startsWith('image/')) {
            // Enviar como imagem
            const sentMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                image: fileBuffer,
                caption: ""
              }
            );
            await verifyMessage(sentMessage, ticket, contact);
          } else if (file.mimetype.startsWith('video/')) {
            // Enviar como vídeo
            const sentMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                video: fileBuffer,
                caption: "",
                mimetype: file.mimetype
              }
            );
            await verifyMessage(sentMessage, ticket, contact);
          } else {
            // Enviar como documento
            const sentMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                document: fileBuffer,
                fileName: file.filename,
                mimetype: file.mimetype
              }
            );
            await verifyMessage(sentMessage, ticket, contact);
          }
          
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