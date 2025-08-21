import moment from "moment";
import * as Sentry from "@sentry/node";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Setting from "../../models/Setting";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import AutoRatingService from "./AutoRatingService";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

// Função para selecionar a melhor fila para o usuário baseada na carga de trabalho
const selectBestQueueForUser = async (userQueues: Queue[], companyId: number): Promise<number> => {
  try {
    const queueWorkloads = await Promise.all(
      userQueues.map(async (queue) => {
        // Contar tickets ativos (open + pending) na fila
        const activeTicketsCount = await Ticket.count({
          where: {
            queueId: queue.id,
            status: ['open', 'pending'],
            companyId
          }
        });

        return {
          queueId: queue.id,
          queueName: queue.name,
          activeTickets: activeTicketsCount
        };
      })
    );

    // Ordenar por menor carga de trabalho
    queueWorkloads.sort((a, b) => a.activeTickets - b.activeTickets);
    
    const selectedQueue = queueWorkloads[0];
    logger.info(`Selected queue for user: ${selectedQueue.queueName} (${selectedQueue.activeTickets} active tickets)`);
    
    return selectedQueue.queueId;
  } catch (error) {
    logger.error(error, "Error selecting best queue for user, using first queue");
    // Fallback para a primeira fila em caso de erro
    return userQueues[0].id;
  }
};

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

    // Verificar se o modo automático do chatbot está habilitado
    const chatbotAutoModeEnabled = await Setting.findOne({
      where: { key: "chatbotAutoMode", companyId }
    });
    
    const isAutoModeEnabled = chatbotAutoModeEnabled?.value === 'enabled';

    // Permitir reabrir/aceitar mesmo sem fila: tentar auto-atribuir, e se não houver filas do usuário, seguir sem bloquear
    // (Mantido comportamento de auto-atribuição mais abaixo)

    // Quando um usuário aceita um ticket sem fila, atribuir automaticamente a fila do usuário
    if (status === "open" && !ticket.queueId && userId) {
      const user = await User.findByPk(userId, {
        include: [{ model: Queue, as: "queues" }]
      });
      
      if (user && user.queues && user.queues.length > 0) {
        if (user.queues.length === 1) {
          // Se tem apenas uma fila, usar ela
          queueId = user.queues[0].id;
        } else {
          // Se tem múltiplas filas, escolher a com menor carga de trabalho
          queueId = await selectBestQueueForUser(user.queues, companyId);
        }
        
        logger.info(`Ticket ${ticketId} auto-assigned queue ${queueId} when user ${userId} accepted it`);
      }
    }

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contact.id);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {            
      const { complationMessage } = await ShowWhatsAppService(
        ticket.whatsappId,
        companyId
      );

      // CORREÇÃO: Enviar avaliação automática sem bloquear o fechamento do ticket
      if (!justClose) {
        // Enviar avaliação em background, sem aguardar resposta
        AutoRatingService({
          ticket,
          ticketTraking,
          companyId
        }).catch(error => {
          logger.error(error, `Error sending auto rating for ticket ${ticketId}`);
        });
      }

      // NOVO FLUXO: Não finalizar imediatamente se avaliaç��o estiver habilitada
      if (setting?.value === "enabled" && !justClose && !ticketTraking.rated) {
        // Se avaliação está habilitada e não é fechamento forçado e usuário ainda não avaliou:
        // - NÃO enviar mensagem de finalização ainda
        // - NÃO definir finishedAt ainda
        // - Ticket fica "closed" mas aguardando avaliação
        logger.info(`Ticket ${ticketId} closed but waiting for rating`);
      } else {
        // Se avaliação está desabilitada OU é fechamento forçado OU usuário já avaliou:
        // - Enviar mensagem de finalização
        // - Finalizar o tracking
        if (!isNil(complationMessage) && complationMessage !== "") {
          const body = `\u200e${complationMessage}`;
          if (ticket.channel === "whatsapp") {
            await SendWhatsAppMessage({ body, ticket });
          }

                  }

        // Finalizar o tracking apenas se não estiver aguardando avaliação
        ticketTraking.finishedAt = moment().toDate();
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.userId = ticket.userId;
      }

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

          }

    await ticket.update({
      status,
      queueId,
      userId,
      whatsappId: ticket.whatsappId,
      chatbot,
      queueOptionId
    });

    await ticket.reload({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "profileImage"] },
        { model: User, as: "users", attributes: ["id", "name", "profileImage"], through: { attributes: [] } },
      ]
    });

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
      // Ao reabrir sem fila, apenas atualiza; não emitir removeFromList aqui
      io.emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });
    }

    await ticketTraking.save();

    // CORREÇÃO: Emissão de eventos melhorada e consistente com salas que o frontend entra
    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
      // Remove da lista anterior se o status mudou
      if (ticket.status !== oldStatus) {
        // Logs para depuração
        logger.info(`Emitting remove for ticket ${ticket.id} from old status ${oldStatus}`);

        io.to(oldStatus as any) // compat: salas simples "open/pending/closed"
          .to(`status:${oldStatus}`)
          .to(`company-${companyId}-${oldStatus}`)
          .to(`company-${companyId}`)
          .emit(`company-${companyId}-ticket`, {
            action: "removeFromList",
            ticketId: ticket.id
          });
        // Compatibilidade: alguns frontends removem com action "delete"
        io.to(oldStatus as any)
          .to(`status:${oldStatus}`)
          .to(`company-${companyId}-${oldStatus}`)
          .to(`company-${companyId}`)
          .emit(`company-${companyId}-ticket`, {
            action: "delete",
            ticketId: ticket.id
          });
        // Emissão genérica 'ticket' (compat c/ UIs que escutam "ticket")
        io.to(oldStatus as any)
          .to(`status:${oldStatus}`)
          .to(`company-${companyId}-${oldStatus}`)
          .emit("ticket", {
            action: "removeFromList",
            ticketId: ticket.id
          });
        // Também emitir um update no room antigo para UIs que só reagem a 'update'
        io.to(oldStatus as any)
          .to(`status:${oldStatus}`)
          .to(`company-${companyId}-${oldStatus}`)
          .to(`company-${companyId}`)
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
          });
        // CASO A UI TRATE "ABERTOS" COMO OPEN+PENDING: emitir remoção para ambos
        const openLikeStatuses = ["open", "pending"] as const;
        if (openLikeStatuses.includes(oldStatus as any)) {
          for (const s of openLikeStatuses) {
            io.to(s as any)
              .to(`status:${s}`)
              .to(`company-${companyId}-${s}`)
              .to(`company-${companyId}`)
              .emit(`company-${companyId}-ticket`, {
                action: "removeFromList",
                ticketId: ticket.id
              });
            io.to(s as any)
              .to(`status:${s}`)
              .to(`company-${companyId}-${s}`)
              .to(`company-${companyId}`)
              .emit(`company-${companyId}-ticket`, {
                action: "delete",
                ticketId: ticket.id
              });
            io.to(s as any)
              .to(`status:${s}`)
              .to(`company-${companyId}-${s}`)
              .emit("ticket", {
                action: "removeFromList",
                ticketId: ticket.id
              });
          }
        }
      }

      // Adiciona/atualiza na nova lista
      logger.info(`Emitting update for ticket ${ticket.id} to new status ${ticket.status}`);
      io.to(ticket.status as any)
        .to(`status:${ticket.status}`)
        .to(`company-${companyId}-${ticket.status}`)
        .to("notification")
        .to(`ticket:${ticketId}`)
        .to(`company-${companyId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket
        });
      io.to(ticket.status as any)
        .to(`status:${ticket.status}`)
        .to(`company-${companyId}-${ticket.status}`)
        .emit("ticket", {
          action: "update",
          ticket
        });
        
      // Para tickets fechados, emitir também especificamente para a aba "closed"
      if (ticket.status === "closed") {
        io.to(`status:closed`)
          .to(`company-${companyId}-closed`)
          .to(`company-${companyId}`)
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
          });
        io.to(`status:closed`)
          .to(`company-${companyId}-closed`)
          .emit("ticket", {
            action: "update",
            ticket
          });
      }
      
      // Para tickets pendentes, emitir também especificamente para a aba "pending"
      if (ticket.status === "pending") {
        io.to(`status:pending`)
          .to(`company-${companyId}-pending`)
          .to(`company-${companyId}`)
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
          });
        io.to(`status:pending`)
          .to(`company-${companyId}-pending`)
          .emit("ticket", {
            action: "update",
            ticket
          });
      }
    } else {
      // Se não houve mudança de status/usuário, apenas atualiza
      io.to(`status:${ticket.status}`)
        .to(`company-${companyId}-${ticket.status}`)
        .to("notification")
        .to(`ticket:${ticketId}`)
        .to(`company-${companyId}`)
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