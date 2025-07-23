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

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  const io = getIO();
  
  // CORREÇÃO: Emitir apenas para as salas apropriadas baseado no status e origem da mensagem
  console.log(`📨 New message from ${message.fromMe ? 'agent' : 'customer'} for ticket ${message.ticketId} (status: ${message.ticket.status})`);
  
  if (message.fromMe) {
    // Mensagem do agente - emitir apenas para o ticket específico
    console.log(`👤 Agent message - emitting only to ticket room`);
    io.to(`ticket:${message.ticketId}`)
      .emit(`company-${companyId}-appMessage`, {
        action: "create",
        message,
        ticket: message.ticket,
        contact: message.ticket.contact
      });
  } else {
    // Mensagem do cliente - emitir para notificações e status apropriado
    console.log(`💬 Customer message - emitting to notification and status:${message.ticket.status}`);
    io.to(`ticket:${message.ticketId}`)
      .to("notification")
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