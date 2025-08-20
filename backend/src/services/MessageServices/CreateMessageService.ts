import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import UploadHelper from "../../helpers/UploadHelper";

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
  quotedMsgId?: string;
  dataJson?: string;
  remoteJid?: string;
  participant?: string;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
  // Garantir que body nunca seja nulo/undefined (coluna NOT NULL no banco)
  const payload = { ...messageData, body: messageData.body ?? "", companyId } as any;
  await Message.upsert(payload);

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: ["contact", "queue", "user", "users"]
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

  // Construir URL completa para arquivos de mídia se necessário
  if (message.mediaUrl && !message.mediaUrl.startsWith('http')) {
    const fullMediaUrl = UploadHelper.getFileUrl(message.mediaUrl);
    // Atualizar o objeto message com a URL completa para o frontend
    (message as any).mediaUrl = fullMediaUrl;
  }

  const io = getIO();

  // Sanitizar payload para reduzir tamanho
  const safeMessage: any = JSON.parse(JSON.stringify(message));
  if (safeMessage?.dataJson) delete safeMessage.dataJson;

  // Emitir apenas uma vez para o room específico do ticket
  io
    .to(`ticket:${message.ticketId}`)
    .to(`company-${companyId}-ticket:${message.ticketId}`)
    .to(`company:${companyId}`)
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message: safeMessage,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  // Se for mensagem do cliente, também emitir para notificações (mas não duplicar)
  if (!message.fromMe) {
    io
      .to("notification")
      .to(`company-${companyId}-notification`)
      .to(`status:${message.ticket.status}`)
      .to(`company-${companyId}-${message.ticket.status}`)
      .emit(`company-${companyId}-appMessage`, {
        action: "create",
        message: safeMessage,
        ticket: message.ticket,
        contact: message.ticket.contact
      });
  }

  return message;
};

export default CreateMessageService;