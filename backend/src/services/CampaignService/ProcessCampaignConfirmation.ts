import CampaignShipping from "../../models/CampaignShipping";
import Campaign from "../../models/Campaign";
import ContactListItem from "../../models/ContactListItem";
import SendCampaignMessage from "./SendCampaignMessage";
import MessageVariables from "../../helpers/MessageVariables";
import { logger } from "../../utils/logger";

interface ConfirmationRequest {
  campaignId: number;
  contactNumber: string;
  responseMessage: string;
  companyId: number;
}

const ProcessCampaignConfirmation = async ({
  campaignId,
  contactNumber,
  responseMessage,
  companyId
}: ConfirmationRequest): Promise<boolean> => {
  try {
    logger.info(`Processing campaign confirmation - Campaign: ${campaignId}, Number: ${contactNumber}, Response: ${responseMessage}`);

    // Buscar o shipping da campanha para este contato
    const shipping = await CampaignShipping.findOne({
      where: {
        campaignId: campaignId,
        number: contactNumber
      },
      include: [
        { model: Campaign },
        { model: ContactListItem }
      ]
    });

    if (!shipping) {
      logger.warn(`No shipping found for campaign ${campaignId} and number ${contactNumber}`);
      return false;
    }

    if (!shipping.confirmation) {
      logger.info(`Campaign ${campaignId} does not require confirmation`);
      return false;
    }

    if (shipping.confirmedAt) {
      logger.info(`Campaign ${campaignId} already confirmed for ${contactNumber}`);
      return false;
    }

    // Verificar se a resposta é uma confirmação válida
    const confirmationKeywords = ['sim', 'yes', 'confirmo', 'ok', '1', 'aceito'];
    const isConfirmation = confirmationKeywords.some(keyword => 
      responseMessage.toLowerCase().includes(keyword)
    );

    if (!isConfirmation) {
      logger.info(`Response "${responseMessage}" is not a valid confirmation`);
      return false;
    }

    // Marcar como confirmado
    await shipping.update({
      confirmedAt: new Date(),
      confirmationRequestedAt: new Date()
    });

    // Enviar mensagem de confirmação se configurada
    if (shipping.confirmationMessage && shipping.confirmationMessage.trim()) {
      const campaign = shipping.campaign;
      const contact = shipping.contact;

      // Extrair dados do contato para variáveis
      const contactData = await MessageVariables.extractContactData(contact);
      
      // Processar variáveis na mensagem de confirmação
      const processedConfirmationMessage = MessageVariables.processVariables(
        shipping.confirmationMessage, 
        contactData
      );

      // Enviar mensagem de confirmação
      await SendCampaignMessage({
        body: processedConfirmationMessage,
        number: contactNumber,
        whatsappId: campaign.whatsappId,
        companyId: companyId
      });

      logger.info(`Confirmation message sent to ${contactNumber} for campaign ${campaignId}`);
    }

    logger.info(`Campaign ${campaignId} confirmed successfully for ${contactNumber}`);
    return true;

  } catch (error) {
    logger.error(`Error processing campaign confirmation:`, error);
    return false;
  }
};

export default ProcessCampaignConfirmation;