import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";

interface UserWorkload {
  userId: number;
  userName: string;
  activeTickets: number;
  queues: Queue[];
}

/**
 * Serviço para distribuir automaticamente tickets "sem fila" para usuários que pertencem a filas
 * quando o modo automático do chatbot está desabilitado
 */
const AutoAssignTicketService = async (companyId: number): Promise<void> => {
  try {
    // Verificar se o modo automático do chatbot está desabilitado
    const chatbotAutoModeSetting = await Setting.findOne({
      where: { key: "chatbotAutoMode", companyId }
    });

    const isAutoModeEnabled = chatbotAutoModeSetting?.value === 'enabled';
    
    // Se o modo automático estiver habilitado, não fazer distribuição automática
    if (isAutoModeEnabled) {
      logger.debug(`Auto assign skipped for company ${companyId}: chatbot auto mode is enabled`);
      return;
    }

    // Buscar tickets sem fila e sem usuário atribuído na aba "aguardando" (status pending)
    const ticketsWithoutQueue = await Ticket.findAll({
      where: {
        companyId,
        queueId: null,
        userId: null,
        status: 'pending'
      },
      order: [['createdAt', 'ASC']] // Priorizar tickets mais antigos
    });

    if (ticketsWithoutQueue.length === 0) {
      logger.debug(`No tickets without queue found for company ${companyId}`);
      return;
    }

    // Buscar todos os usuários que pertencem a pelo menos uma fila
    const usersWithQueues = await User.findAll({
      where: { companyId },
      include: [
        {
          model: Queue,
          as: "queues",
          required: true, // Apenas usuários que têm filas
          attributes: ["id", "name"]
        }
      ]
    });

    if (usersWithQueues.length === 0) {
      logger.debug(`No users with queues found for company ${companyId}`);
      return;
    }

    // Calcular carga de trabalho de cada usuário
    const userWorkloads: UserWorkload[] = await Promise.all(
      usersWithQueues.map(async (user) => {
        const activeTicketsCount = await Ticket.count({
          where: {
            userId: user.id,
            status: ['open', 'pending'],
            companyId
          }
        });

        return {
          userId: user.id,
          userName: user.name,
          activeTickets: activeTicketsCount,
          queues: user.queues
        };
      })
    );

    // Ordenar usuários por menor carga de trabalho
    userWorkloads.sort((a, b) => a.activeTickets - b.activeTickets);

    logger.info(`Auto assigning ${ticketsWithoutQueue.length} tickets for company ${companyId}`);
    logger.info(`Available users with queues: ${userWorkloads.length}`);

    const io = getIO();
    let assignedCount = 0;

    // Distribuir tickets para usuários com menor carga
    for (const ticket of ticketsWithoutQueue) {
      // Usar round-robin baseado na carga de trabalho
      const selectedUser = userWorkloads[assignedCount % userWorkloads.length];
      
      // Selecionar a melhor fila do usuário (com menor carga)
      let selectedQueueId: number;
      
      if (selectedUser.queues.length === 1) {
        selectedQueueId = selectedUser.queues[0].id;
      } else {
        // Se o usuário tem múltiplas filas, escolher a com menor carga
        const queueWorkloads = await Promise.all(
          selectedUser.queues.map(async (queue) => {
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

        queueWorkloads.sort((a, b) => a.activeTickets - b.activeTickets);
        selectedQueueId = queueWorkloads[0].queueId;
      }

      // Atribuir o ticket ao usuário e fila selecionados
      await ticket.update({
        userId: selectedUser.userId,
        queueId: selectedQueueId
      });

      // Recarregar o ticket com as informações atualizadas
      await ticket.reload({
        include: [
          { model: Queue, as: "queue" },
          { model: User, as: "user" }
        ]
      });

      // Emitir evento via socket para atualizar a interface
      io.to(`status:${ticket.status}`)
        .to("notification")
        .to(`ticket:${ticket.id}`)
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket
        });

      // Atualizar a carga de trabalho do usuário selecionado
      selectedUser.activeTickets++;
      
      assignedCount++;

      logger.info(
        `Ticket ${ticket.id} auto-assigned to user ${selectedUser.userName} (${selectedUser.userId}) ` +
        `in queue ${selectedQueueId} for company ${companyId}`
      );
    }

    logger.info(`Auto assignment completed: ${assignedCount} tickets assigned for company ${companyId}`);

  } catch (error) {
    logger.error(error, `Error in AutoAssignTicketService for company ${companyId}`);
  }
};

export default AutoAssignTicketService;