import { WASocket } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { logger } from "../../utils/logger";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  isButton?: boolean;
  isList?: boolean;
}

// Função para aguardar um tempo específico
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Função para enviar mensagem com retry automático
const sendMessageWithRetry = async (
  wbot: WASocket,
  jid: string,
  content: any,
  options: any = {},
  maxRetries: number = 3
): Promise<any> => {
  let lastError: any;
  
  // Determinar timeout baseado no tipo de destinatário
  const isGroup = jid.endsWith("@g.us");
  const timeout = isGroup ? 45000 : 30000; // 45s para grupos, 30s para individuais
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar se a conexão ainda está ativa
      if (!wbot.user) {
        throw new Error("WhatsApp connection lost");
      }

      // Log para debug em produção

      // Enviar mensagem com timeout personalizado
      const sentMessage = await Promise.race([
        wbot.sendMessage(jid, content, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Message timeout after ${timeout}ms`)), timeout)
        )
      ]);

      return sentMessage;
      
    } catch (error: any) {
      lastError = error;
      logger.warn(`Message send attempt ${attempt} failed for ${jid}: ${error.message}`);
      
      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const waitTime = attempt * 3000; // 3s, 6s, 9s... (aumentado para grupos)
        await sleep(waitTime);
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  logger.error(`All ${maxRetries} attempts failed for ${jid}: ${lastError.message}`);
  throw lastError;
};

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  isButton = false,
  isList = false
}: Request): Promise<Message> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    
    // Verificar se a conexão está ativa
    if (!wbot.user) {
      throw new AppError("WhatsApp connection is not active");
    }

    // Detectar se é grupo de forma mais confiável
    const isGroup = ticket.contact.isGroup || ticket.contact.number.includes("-") || ticket.contact.number.endsWith("@g.us");
    
    // Construir o JID corretamente
    let jid: string;
    if (ticket.contact.number.includes("@")) {
      // Se já tem o domínio, usar como está
      jid = ticket.contact.number;
    } else {
      // Se não tem domínio, adicionar baseado no tipo
      jid = `${ticket.contact.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
    }
    
    // Prepare quoted message if exists
    let quotedMsgData = null;
    if (quotedMsg) {
      quotedMsgData = {
        key: {
          id: quotedMsg.id,
          fromMe: quotedMsg.fromMe,
          remoteJid: jid
        },
        message: {
          conversation: quotedMsg.body
        }
      };
    }

    let sentMessage: any;
    let messageBody = body;

    // Determine message type and content
    if (isButton || isList) {
      try {
        // Parse the JSON message for buttons/lists
        const parsedMessage = JSON.parse(body);
        messageBody = parsedMessage.text || body;
        
        if (isButton && parsedMessage.interactiveButtons) {
          // Send button message using text fallback
          const textContent = parsedMessage.text + "\n\n" + (parsedMessage.footer || "Escolha uma opção:");
          sentMessage = await sendMessageWithRetry(
            wbot,
            jid,
            { text: textContent },
            quotedMsgData ? { quoted: quotedMsgData } : {}
          );
        } else if (isList && parsedMessage.sections) {
          // Send list message using text fallback
          const textContent = parsedMessage.text + "\n\n" + (parsedMessage.footer || "Escolha uma opção:");
          sentMessage = await sendMessageWithRetry(
            wbot,
            jid,
            { text: textContent },
            quotedMsgData ? { quoted: quotedMsgData } : {}
          );
        } else {
          // Fallback to text if parsing fails
          sentMessage = await sendMessageWithRetry(
            wbot,
            jid,
            { text: body },
            quotedMsgData ? { quoted: quotedMsgData } : {}
          );
        }
      } catch (parseError) {
        // Fallback to text message
        sentMessage = await sendMessageWithRetry(
          wbot,
          jid,
          { text: body },
          quotedMsgData ? { quoted: quotedMsgData } : {}
        );
      }
    } else {
      // Regular text message
      sentMessage = await sendMessageWithRetry(
        wbot,
        jid,
        { text: body },
        quotedMsgData ? { quoted: quotedMsgData } : {}
      );
    }

    // Create message record in database
    const messageData = {
      id: sentMessage.key.id,
      ticketId: ticket.id,
      contactId: undefined, // fromMe messages don't have contactId
      body: messageBody,
      fromMe: true,
      read: true,
      mediaType: isButton ? "button" : isList ? "list" : "chat",
      quotedMsgId: quotedMsg?.id,
      ack: 1, // sent
      dataJson: JSON.stringify(sentMessage)
    };

    // Update ticket's last message
    await ticket.update({ lastMessage: messageBody });

    // Create message and emit socket event
    const newMessage = await CreateMessageService({ 
      messageData, 
      companyId: ticket.companyId 
    });

    return newMessage;

  } catch (err: any) {
    logger.error("❌ Erro ao enviar mensagem WhatsApp:", err);
    
    // Verificar tipo específico de erro para mensagem mais clara
    if (err.message?.includes("Timed Out") || err.message?.includes("timeout")) {
      throw new AppError("Timeout ao enviar mensagem. Verifique a conexão do WhatsApp.");
    } else if (err.message?.includes("connection")) {
      throw new AppError("Conexão WhatsApp perdida. Reconecte na seção Conexões.");
    } else if (err.message?.includes("not found") || err.message?.includes("invalid")) {
      throw new AppError("Destinatário não encontrado ou inválido.");
    } else {
      throw new AppError("Erro ao enviar mensagem. Tente novamente.");
    }
  }
};

export default SendWhatsAppMessage;