import { FindOptions } from "sequelize/types";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import Queue from "../../models/Queue";
import UploadHelper from "../../helpers/UploadHelper";
import Contact from "../../models/Contact";

interface Request {
  ticketId: string;
  companyId: number;
  pageNumber?: string;
  queues?: number[];
}

interface Response {
  messages: Message[];
  ticket: Ticket;
  count: number;
  hasMore: boolean;
}

const ListMessagesService = async ({
  pageNumber = "1",
  ticketId,
  companyId,
  queues = []
}: Request): Promise<Response> => {
  const ticket = await ShowTicketService(ticketId, companyId);

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const options: FindOptions = {
    where: {
      ticketId,
      companyId
    }
  };

  if (queues.length > 0) {
    (options as any).where["queueId"] = {
      [Op.or]: {
        [Op.in]: queues,
        [Op.eq]: null
      }
    };
  }

  const { count, rows: messages } = await Message.findAndCountAll({
    ...options,
    limit,
    offset,
    subQuery: false, // garantir LEFT JOIN adequado com include e limit em alguns dialetos
    include: [
      {
        model: Contact,
        as: "contact",
        required: false // mensagens fromMe têm contactId = null
      },
      {
        model: Message,
        as: "quotedMsg",
        required: false,
        include: [
          {
            model: Contact,
            as: "contact",
            required: false
          }
        ]
      },
      {
        model: Queue,
        as: "queue",
        required: false
      }
    ],
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + messages.length;

  // Construir URLs completas para arquivos de mídia
  const messagesWithFullUrls = messages.map(message => {
    if ((message as any).getDataValue && message.mediaUrl && !message.mediaUrl.startsWith('http')) {
      const fullMediaUrl = UploadHelper.getFileUrl((message as any).getDataValue("mediaUrl") || message.mediaUrl);
      (message as any).mediaUrl = fullMediaUrl;
    }
    return message;
  });

  return {
    messages: messagesWithFullUrls.reverse(),
    ticket,
    count,
    hasMore
  };
};

export default ListMessagesService;
