import { Job } from "bull";
import * as Sentry from "@sentry/node";
import { Op } from "sequelize";

import { logger } from "../../utils/logger";
import Campaign from "../../models/Campaign";
import CampaignShipping from "../../models/CampaignShipping";
import ContactListItem from "../../models/ContactListItem";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";
import SendCampaignMessage from "./SendCampaignMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getIO } from "../../libs/socket";
import MessageVariables from "../../helpers/MessageVariables";

interface ProcessCampaignData {
  id: number;
}

const ProcessCampaignJob = async (job: Job<ProcessCampaignData>): Promise<void> => {
  try {
    const { id } = job.data;
    
    logger.info(`Processing campaign job ${job.id} for campaign ${id}`);
    
    // Buscar a campanha
    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      logger.error(`Campaign ${id} not found`);
      return;
    }

    // Verificar se a campanha está em andamento
    if (campaign.status !== "EM_ANDAMENTO") {
      logger.info(`Campaign ${id} is not in progress (status: ${campaign.status})`);
      return;
    }

    // Buscar contatos da lista de contatos da campanha
    const contacts = await ContactListItem.findAll({
      where: {
        contactListId: campaign.contactListId
      }
    });

    if (contacts.length === 0) {
      logger.info(`No contacts found for campaign ${id}`);
      await campaign.update({ status: "FINALIZADA", completedAt: new Date() });
      return;
    }

    logger.info(`Found ${contacts.length} contacts for campaign ${id}`);

    // Buscar WhatsApp da campanha ou padrão da empresa
    let whatsapp;
    if (campaign.whatsappId) {
      whatsapp = await Whatsapp.findByPk(campaign.whatsappId);
    }
    
    if (!whatsapp) {
      whatsapp = await GetDefaultWhatsApp(campaign.companyId);
    }

    let successCount = 0;
    let errorCount = 0;

    // Processar cada contato
    for (const contact of contacts) {
      try {
        // Verificar se já foi enviado para este contato
        const existingShipping = await CampaignShipping.findOne({
          where: {
            campaignId: campaign.id,
            contactId: contact.id
          }
        });

        if (existingShipping && existingShipping.deliveredAt) {
          logger.info(`Message already sent to contact ${contact.id} for campaign ${id}`);
          continue;
        }

        // Extrair dados do contato para variáveis
        const contactData = await MessageVariables.extractContactData(contact);
        
        // Processar variáveis na mensagem
        const rawMessage = campaign.message1 || "Mensagem de campanha";
        const message = MessageVariables.processVariables(rawMessage, contactData);
        
        logger.info(`Processed message for ${contact.name}: ${message.substring(0, 100)}...`);

        // Criar ou atualizar registro de envio
        const [shipping] = await CampaignShipping.findOrCreate({
          where: {
            campaignId: campaign.id,
            contactId: contact.id
          },
          defaults: {
            number: contact.number,
            message: message
          }
        });

        // Enviar mensagem via WhatsApp
        await SendCampaignMessage({
          body: message,
          number: contact.number,
          whatsappId: whatsapp.id,
          companyId: campaign.companyId,
          mediaPath: campaign.mediaPath,
          mediaName: campaign.mediaName
        });

        // Marcar como entregue
        await shipping.update({
          deliveredAt: new Date(),
          message: message
        });

        successCount++;
        logger.info(`Message sent successfully to ${contact.number} for campaign ${id}`);

        // Delay entre mensagens para evitar spam (2 segundos)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (contactError) {
        errorCount++;
        logger.error(`Error sending message to contact ${contact.id} for campaign ${id}:`, contactError);
        
        // Registrar erro no shipping
        const [shipping] = await CampaignShipping.findOrCreate({
          where: {
            campaignId: campaign.id,
            contactId: contact.id
          },
          defaults: {
            number: contact.number,
            message: campaign.message1 || "Mensagem de campanha"
          }
        });
      }
    }

    // Finalizar campanha
    await campaign.update({ 
      status: "FINALIZADA", 
      completedAt: new Date() 
    });

    // Recarregar campanha com associações para emitir evento
    const updatedCampaign = await Campaign.findByPk(id, {
      include: [
        { model: ContactList },
        { model: Whatsapp, attributes: ["id", "name"] }
      ]
    });

    // Emitir evento de atualização via WebSocket
    try {
      const io = getIO();
      io.emit(`company-${campaign.companyId}-campaign`, {
        action: "update",
        record: updatedCampaign
      });
    } catch (socketError) {
      logger.warn("Could not emit campaign update event:", socketError.message);
    }

    logger.info(`Campaign ${id} processing completed. Success: ${successCount}, Errors: ${errorCount}`);

  } catch (error) {
    logger.error(`Error processing campaign job ${job.id}:`, error);
    
    // Marcar campanha como cancelada em caso de erro crítico
    try {
      const campaign = await Campaign.findByPk(job.data.id);
      if (campaign) {
        await campaign.update({ status: "CANCELADA" });
        
        // Recarregar campanha com associações para emitir evento
        const updatedCampaign = await Campaign.findByPk(job.data.id, {
          include: [
            { model: ContactList },
            { model: Whatsapp, attributes: ["id", "name"] }
          ]
        });

        // Emitir evento de atualização via WebSocket
        try {
          const io = getIO();
          io.emit(`company-${campaign.companyId}-campaign`, {
            action: "update",
            record: updatedCampaign
          });
        } catch (socketError) {
          logger.warn("Could not emit campaign error update event:", socketError.message);
        }
      }
    } catch (updateError) {
      logger.error(`Error updating campaign status:`, updateError);
    }
    
    Sentry.captureException(error);
    throw error;
  }
};

export default ProcessCampaignJob;