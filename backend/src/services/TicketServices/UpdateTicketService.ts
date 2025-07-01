import moment from "moment";
import * as Sentry from "@sentry/node";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Setting from "../../models/Setting";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import AutoRatingService from "./AutoRatingService";
import AppError from "../../errors/AppError";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  justClose?: boolean;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {
  try {
    const { status, justClose } = ticketData;
    let { queueId, userId } = ticketData;
    let chatbot: boolean | null = ticketData.chatbot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    const key = "userRating";
    const setting = await Setting.findOne({
      where: {
        companyId,
        key
      }
    });

    const ticket = await ShowTicketService(ticketId, companyId);
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    if (ticket.channel === "whatsapp") {
      SetTicketMessagesAsRead(ticket);
    }

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    // Validação: Impedir aceitar ticket sem setor selecionado
    if (status === "open" && !ticket.queueId) {
      throw new AppError("Não é possível aceitar um ticket sem fila", 400);
    }

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contact.id);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      console.log(`🎯 Closing ticket ${ticketId} for company ${companyId}, justClose: ${justClose}`);
      
      const { complationMessage } = await ShowWhatsAppService(
        ticket.whatsappId,
        companyId
      );

      // Tentar enviar avaliação automática se não foi enviada ainda e não é fechamento forçado
      if (!justClose) {
        console.log(`📝 Attempting to send auto rating for ticket ${ticketId}`);
        
        const ratingWasSent = await AutoRatingService({
          ticket,
          ticketTraking,
          companyId
        });

        console.log(`📊 Auto rating result for ticket ${ticketId}: ${ratingWasSent}`);

        // Se a avaliação foi enviada, retornar para aguardar resposta
        if (ratingWasSent) {
          console.log(`✅ Auto rating sent for ticket ${ticketId}, returning early`);
          
          io.to("status:open")
            .to(`ticket:${ticketId}`)
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };
        }
      } else {
        console.log(`⏭️ Skipping auto rating for ticket ${ticketId} (justClose: true)`);
      }

      // Enviar mensagem de finalização se configurada
      if (!isNil(complationMessage) && complationMessage !== "") {
        const body = `\u200e${complationMessage}`;
        if (ticket.channel === "whatsapp") {
          await SendWhatsAppMessage({ body, ticket });
        }

        if (["facebook", "instagram"].includes(ticket.channel)) {
          console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`)
          await sendFaceMessage({ body, ticket });
        }
      }

      // Finalizar o tracking
      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.whatsappId = ticket.whatsappId;
      ticketTraking.userId = ticket.userId;

      queueId = null;
      userId = null;
    }

    if (queueId !== undefined && queueId !== null) {
      ticketTraking.queuedAt = moment().toDate();
    }

    if (oldQueueId !== queueId && !isNil(oldQueueId) && !isNil(queueId)) {
      const queue = await Queue.findByPk(queueId);
      if (ticket.channel === "whatsapp") {
        const wbot = await GetTicketWbot(ticket);

        const queueChangedMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`,
          {
            text: "\u200eVocê foi transferido, em breve iremos iniciar seu atendimento."
          }
        );
        await verifyMessage(queueChangedMessage as any, ticket, ticket.contact);
      }

      if (["facebook", "instagram"].includes(ticket.channel)) {
        console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`)
        await sendFaceMessage({ body: "\u200eVocê foi transferido, em breve iremos iniciar seu atendimento.", ticket });
      }
    }

    await ticket.update({
      status,
      queueId,
      userId,
      whatsappId: ticket.whatsappId,
      chatbot,
      queueOptionId
    });

    await ticket.reload();

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      ticketTraking.update({
        whatsappId: ticket.whatsappId,
        queuedAt: moment().toDate(),
        startedAt: null,
        userId: null
      });
      io.emit(`company-${companyId}-ticket`, {
        action: "removeFromList",
        ticketId: ticket?.id
      });
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
      io.emit(`company-${companyId}-ticket`, {
        action: "removeFromList",
        ticketId: ticket?.id
      });
    }

    await ticketTraking.save();

    // Sempre emitir eventos quando o status ou usuário mudou
    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
      // Remove da lista anterior se o status mudou
      if (ticket.status !== oldStatus) {
        io.to(`status:${oldStatus}`).emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
      }

      // Adiciona/atualiza na nova lista
      io.to(`status:${ticket.status}`)
        .to("notification")
        .to(`ticket:${ticketId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket
        });
    } else {
      // Se não houve mudança de status/usuário, apenas atualiza
      io.to(`status:${ticket.status}`)
        .to("notification")
        .to(`ticket:${ticketId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket
        });
    }

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
    throw err; // Re-throw the error so it can be handled by the controller
  }
};

export default UpdateTicketService;