import { WASocket } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  isButton?: boolean;
  isList?: boolean;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  isButton = false,
  isList = false
}: Request): Promise<Message> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    
    // Prepare quoted message if exists
    let quotedMsgData = null;
    if (quotedMsg) {
      quotedMsgData = {
        key: {
          id: quotedMsg.id,
          fromMe: quotedMsg.fromMe,
          remoteJid: `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`
        },
        message: {
          conversation: quotedMsg.body
        }
      };
    }

    let messageContent: any;
    let sentMessage: any;

    // Determine message type and content
    if (isButton || isList) {
      console.log(`Sending interactive message - isButton: ${isButton}, isList: ${isList}`);
      try {
        // Parse the JSON message for buttons/lists
        const parsedMessage = JSON.parse(body);
        console.log("Parsed message:", JSON.stringify(parsedMessage, null, 2));
        
        if (isButton && parsedMessage.interactiveButtons) {
          console.log("Sending button message with interactiveButtons:", parsedMessage.interactiveButtons);
          // Send button message using text fallback (interactive buttons not supported in current Baileys)
          sentMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
            {
              text: parsedMessage.text + "\n\n" + (parsedMessage.footer || "Escolha uma opção:")
            },
            quotedMsgData ? { quoted: quotedMsgData } : {}
          );
        } else if (isList && parsedMessage.sections) {
          console.log("Sending list message with sections:", parsedMessage.sections);
          // Send list message using text fallback (interactive lists not supported in current Baileys)
          sentMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
            {
              text: parsedMessage.text + "\n\n" + (parsedMessage.footer || "Escolha uma opção:")
            },
            quotedMsgData ? { quoted: quotedMsgData } : {}
          );
        } else {
          // Fallback to text if parsing fails
          sentMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
            { text: body },
            quotedMsgData ? { quoted: quotedMsgData } : {}
          );
        }
      } catch (parseError) {
        console.log("Error parsing interactive message, falling back to text:", parseError);
        // Fallback to text message
        sentMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
          { text: body },
          quotedMsgData ? { quoted: quotedMsgData } : {}
        );
      }
    } else {
      // Regular text message
      sentMessage = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { text: body },
        quotedMsgData ? { quoted: quotedMsgData } : {}
      );
    }

    // Extract text content for database storage
    let messageBody = body;
    if (isButton || isList) {
      try {
        const parsedMessage = JSON.parse(body);
        messageBody = parsedMessage.text || body;
      } catch {
        messageBody = body;
      }
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

  } catch (err) {
    console.log("Error sending WhatsApp message:", err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;