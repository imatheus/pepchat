import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
  channel?: string;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
  await Message.upsert({ ...messageData, companyId });

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: ["contact", "queue"]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  const io = getIO();
  
  // Emitir apenas uma vez para o room específico do ticket
  io.to(`ticket:${message.ticketId}`)
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  // Se for mensagem do cliente, também emitir para notificações (mas não duplicar)
  if (!message.fromMe) {
    io.to("notification")
      .to(`status:${message.ticket.status}`)
      .emit(`company-${companyId}-appMessage`, {
        action: "create",
        message,
        ticket: message.ticket,
        contact: message.ticket.contact
      });
  }

  return message;
};

export default CreateMessageService;