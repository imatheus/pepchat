import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { sendText } from "./graphAPI";
import formatBody from "../../helpers/Mustache";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { v4 as uuidv4 } from "uuid";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
}

const sendFaceMessage = async ({ body, ticket, quotedMsg }: Request): Promise<Message> => {
  const { number } = ticket.contact;
  try {
    // Format body with quoted message if exists
    let formattedBody = formatBody(body, ticket.contact);
    if (quotedMsg) {
      formattedBody = `> ${quotedMsg.body}\n\n${formattedBody}`;
    }

    await sendText(
      number,
      formattedBody,
      ticket.whatsapp.facebookUserToken
    );

    // Create message record in database
    const messageData = {
      id: uuidv4(),
      ticketId: ticket.id,
      contactId: undefined, // fromMe messages don't have contactId
      body,
      fromMe: true,
      read: true,
      mediaType: "chat",
      quotedMsgId: quotedMsg?.id,
      ack: 1, // sent
      dataJson: JSON.stringify({ body, quotedMsg })
    };

    // Update ticket's last message
    await ticket.update({ lastMessage: body });

    // Create message and emit socket event
    const newMessage = await CreateMessageService({ 
      messageData, 
      companyId: ticket.companyId 
    });

    return newMessage;
    
  } catch (err) {
    console.log("Error sending Facebook message:", err);
    throw new AppError("ERR_SENDING_FACEBOOK_MSG");
  }
};

export default sendFaceMessage;
