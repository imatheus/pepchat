import { Job } from "bull";
import moment from "moment";
import * as Sentry from "@sentry/node";

import { logger } from "../../utils/logger";
import Schedule from "../../models/Schedule";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Company from "../../models/Company";
import { getWbot } from "../../libs/wbot";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";

interface ProcessScheduleData {
  scheduleId: number;
}

const ProcessScheduleJob = async (job: Job<ProcessScheduleData>): Promise<void> => {
  try {
    const { scheduleId } = job.data;
    
    logger.info(`Processing schedule job ${job.id} for schedule ${scheduleId}`);

    // Buscar o agendamento
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        {
          model: Contact,
          as: "contact"
        },
        {
          model: User,
          as: "user"
        },
        {
          model: Company,
          as: "company"
        }
      ]
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Verificar se já foi enviado
    if (schedule.sentAt) {
      logger.warn(`Schedule ${scheduleId} already sent at ${schedule.sentAt}`);
      return;
    }

    // Verificar se ainda está pendente
    if (schedule.status !== "PENDENTE") {
      logger.warn(`Schedule ${scheduleId} status is ${schedule.status}, skipping`);
      return;
    }

    // Verificar se a data de envio já passou
    const now = moment();
    const sendAt = moment(schedule.sendAt);
    
    if (now.isBefore(sendAt)) {
      logger.warn(`Schedule ${scheduleId} send time ${sendAt.format()} is in the future, skipping`);
      return;
    }

    try {
      // Buscar ou criar ticket para o contato
      const ticket = await FindOrCreateTicketService(
        schedule.contact,
        null, // whatsappId será determinado automaticamente
        0, // unreadMessages
        schedule.companyId
      );

      // Criar a mensagem
      const messageData = {
        body: schedule.body,
        fromMe: true,
        read: true,
        quotedMsgId: null
      };

      // Enviar mensagem via WhatsApp
      const wbot = getWbot(ticket.whatsappId);
      const sentMessage = await wbot.sendMessage(
        `${schedule.contact.number}@${schedule.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { text: schedule.body }
      );

      // Salvar mensagem no banco
      await CreateMessageService({
        messageData: {
          ...messageData,
          id: sentMessage.key.id,
          ticketId: ticket.id
        },
        companyId: schedule.companyId
      });

      // Atualizar status do agendamento
      await schedule.update({
        status: "ENVIADO",
        sentAt: new Date(),
        ticketId: ticket.id
      });

      logger.info(`Schedule ${scheduleId} sent successfully to contact ${schedule.contact.number}`);

    } catch (sendError) {
      logger.error(`Error sending schedule ${scheduleId}:`, sendError);
      
      // Atualizar status para erro
      await schedule.update({
        status: "ERRO"
      });

      throw sendError;
    }

  } catch (error) {
    logger.error(`Error processing schedule job ${job.id}:`, error);
    Sentry.captureException(error);
    throw error;
  }
};

export default ProcessScheduleJob;