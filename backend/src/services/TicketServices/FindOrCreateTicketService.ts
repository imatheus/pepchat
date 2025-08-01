import { subHours } from "date-fns";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import Setting from "../../models/Setting";
import { getIO } from "../../libs/socket"; // import para emissão socket

interface TicketData {
  status?: string;
  companyId?: number;
  unreadMessages?: number;
}

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  unreadMessages: number,
  companyId: number,
  groupContact?: Contact
): Promise<Ticket> => {
  let ticket = await Ticket.findOne({
    where: {
      status: {
        [Op.or]: ["open", "pending", "closed"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      companyId
    },
    order: [["id", "DESC"]]
  });

  let created = false;

  if (ticket) {
    // Se o ticket estava fechado, resetar para estado inicial
    if (ticket.status === "closed") {
      await ticket.update({ 
        unreadMessages,
        status: "pending",
        userId: null,
        queueId: null,
        chatbot: false,
        queueOptionId: null
      });
      
      // Recarregar o ticket para garantir que os valores foram atualizados
      await ticket.reload();
    } else {
      await ticket.update({ unreadMessages });
    }
  }

  if (!ticket && groupContact) {
    ticket = await Ticket.findOne({
      where: {
        contactId: groupContact.id
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages,
        companyId
      });

      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }

    const msgIsGroupBlock = await Setting.findOne({
      where: { key: "timeCreateNewTicket" }
    });

    const value = msgIsGroupBlock ? parseInt(msgIsGroupBlock.value, 10) : 7200;
  }

  if (!ticket && !groupContact) {
    ticket = await Ticket.findOne({
      where: {
        updatedAt: {
          [Op.between]: [+subHours(new Date(), 2), +new Date()]
        },
        contactId: contact.id
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages,
        companyId
      });

      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }
  }

  if (!ticket) {
    ticket = await Ticket.create({
      contactId: groupContact ? groupContact.id : contact.id,
      status: "pending",
      isGroup: !!groupContact,
      unreadMessages,
      whatsappId,
      companyId
    });

    await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId,
      userId: ticket.userId
    });

    created = true;
  } else {
    await ticket.update({ whatsappId });
  }

  ticket = await ShowTicketService(ticket.id, companyId);

  // Emissão de evento via socket
  const io = getIO();
  
  if (created) {
    // Para tickets rec��m-criados, emitir para todas as salas relevantes
    io.to(`company-${companyId}`)
      .to("notification")
      .to("pending")
      .emit(`company-${companyId}-ticket`, {
        action: "create",
        ticket
      });
  } else {
    // Para tickets atualizados, emitir normalmente
    io.to(`company-${companyId}`)
      .to("notification")
      .to(`status:${ticket.status}`)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });
  }

  return ticket;
};

export default FindOrCreateTicketService;