import moment from "moment";
import * as Sentry from "@sentry/node";
import { logger } from "../../utils/logger";
import Schedule from "../../models/Schedule";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Company from "../../models/Company";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { getWbot } from "../../libs/wbot";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getIO } from "../../libs/socket";

export const ProcessScheduleDirect = async (scheduleId: number): Promise<void> => {
  try {
    logger.info(`[Direct] Processing schedule ${scheduleId}`);

    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { model: Contact, as: "contact" },
        { model: User, as: "user" },
        { model: Company, as: "company" },
      ],
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Already sent?
    if (schedule.sentAt) {
      logger.warn(`[Direct] Schedule ${scheduleId} already sent at ${schedule.sentAt}`);
      return;
    }

    // Must be pending
    if (schedule.status !== "PENDENTE") {
      logger.warn(`[Direct] Schedule ${scheduleId} status is ${schedule.status}, skipping`);
      return;
    }

    // Ensure time is due
    const now = moment();
    const sendAt = moment(schedule.sendAt);
    if (now.isBefore(sendAt)) {
      logger.warn(`[Direct] Schedule ${scheduleId} send time ${sendAt.format()} is in the future, skipping`);
      return;
    }

    try {
      // Find or create ticket
      // Garantir whatsappId válido (default da empresa)
      const defaultWpp = await GetDefaultWhatsApp(schedule.companyId);
      const whatsappId = defaultWpp.id;

      const ticket = await FindOrCreateTicketService(
        schedule.contact,
        whatsappId,
        0,
        schedule.companyId,
        schedule.contact.isGroup ? (schedule.contact as any) : undefined
      );

      const messageData = {
        body: schedule.body,
        fromMe: true,
        read: true,
        quotedMsgId: null,
      };

      const wbot = getWbot(ticket.whatsappId);

      // Resolver JID do grupo caso necessário
      let targetJid: string;
      if (schedule.contact.isGroup) {
        let groupId = schedule.contact.number;
        // Heurística: se não parecer um id de grupo (ex.: começa com 120... ou contém '-') tente resolver pelo nome
        const looksLikeGroupId = /^\d{5,}-\d+$/g.test(groupId) || groupId.startsWith("120");
        if (!looksLikeGroupId && typeof (wbot as any).groupFetchAllParticipating === 'function') {
          try {
            const groups = await (wbot as any).groupFetchAllParticipating();
            const match = Object.values(groups || {}).find((g: any) => (g as any)?.subject === schedule.contact.name) as { id?: string } | undefined;
            if (match && (match as any).id) {
              const id = String((match as any).id).replace(/@g\.us$/, "");
              groupId = id;
              // atualizar contact.number para o id do grupo para próximos envios
              try { await schedule.contact.update({ number: id }); } catch {}
            }
          } catch (e) {
            logger.warn(`[Direct] Could not resolve group id by name for schedule ${scheduleId}:`, e);
          }
        }
        targetJid = `${groupId}@g.us`;
      } else {
        targetJid = `${schedule.contact.number}@s.whatsapp.net`;
      }

      // Enfileirar por whatsappId para evitar colisões de envio simultâneo
      const { enqueueDirectSend } = await import("./DirectSendQueue");
      let sentMessage: any;
      await enqueueDirectSend(ticket.whatsappId, async () => {
        sentMessage = await wbot.sendMessage(
          targetJid,
          { text: schedule.body }
        );
      });

      await CreateMessageService({
        messageData: {
          ...messageData,
          id: sentMessage.key.id,
          ticketId: ticket.id,
        },
        companyId: schedule.companyId,
      });

      await schedule.update({
        status: "ENVIADO",
        sentAt: new Date(),
        ticketId: ticket.id,
      });

      // Emitir atualização via websocket
      try {
        const full = await Schedule.findByPk(scheduleId, {
          include: [
            { model: Contact, as: "contact", attributes: ["id", "name", "profilePicUrl"] },
            { model: User, as: "user", attributes: ["id", "name"] }
          ]
        });
        if (full) {
          const io = getIO();
          io.emit("schedule", { action: "update", schedule: full });
        }
      } catch {}

      logger.info(`[Direct] Schedule ${scheduleId} sent successfully to contact ${schedule.contact.number}`);
    } catch (sendError: any) {
      logger.error(`[Direct] Error sending schedule ${scheduleId}:`, sendError);
      await schedule.update({ status: "ERRO" });

      // Emitir atualização de erro via websocket
      try {
        const full = await Schedule.findByPk(scheduleId, {
          include: [
            { model: Contact, as: "contact", attributes: ["id", "name", "profilePicUrl"] },
            { model: User, as: "user", attributes: ["id", "name"] }
          ]
        });
        if (full) {
          const io = getIO();
          io.emit("schedule", { action: "update", schedule: full });
        }
      } catch {}

      throw sendError;
    }
  } catch (error: any) {
    logger.error(`[Direct] Error processing schedule ${scheduleId}:`, error);
    Sentry.captureException(error);
    throw error;
  }
};

export default ProcessScheduleDirect;
