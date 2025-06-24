import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

interface Request {
  messageId: string;
  body: string;
  read?: boolean;
}

const UpdateMessageService = async ({
  messageId,
  body,
  read = false
}: Request): Promise<Message> => {
  const message = await Message.findByPk(messageId, {
    include: [
      {
        model: Ticket,
        as: "ticket"
      }
    ]
  });

  if (!message) {
    throw new AppError("ERR_NO_MESSAGE_FOUND", 404);
  }

  await message.update({ body, read });

  await message.reload();

  const { ticket } = message;

  if (ticket) {
    // Se a mensagem for a última, atualiza o ticket
    if (new Date(message.createdAt).getTime() >= new Date(ticket.updatedAt).getTime()) {
      await ticket.update({ lastMessage: message.body });
    }
  }

  return message;
};

export default UpdateMessageService;