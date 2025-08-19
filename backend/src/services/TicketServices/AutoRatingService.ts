import moment from "moment";
import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import Setting from "../../models/Setting";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { logger } from "../../utils/logger";

interface AutoRatingRequest {
  ticket: Ticket;
  ticketTraking: TicketTraking;
  companyId: number;
}

/**
 * Serviço responsável por enviar automaticamente a solicitação de avaliação
 * quando um ticket é fechado
 */
const AutoRatingService = async ({
  ticket,
  ticketTraking,
  companyId
}: AutoRatingRequest): Promise<boolean> => {
  try {
    
    // CORREÇÃO: Verificar se a avaliação está habilitada usando a configuração userRating
    const userRatingSetting = await Setting.findOne({
      where: {
        companyId,
        key: "userRating"
      }
    });


    // Se a configuração não existe ou está desabilitada, não enviar avaliação
    if (!userRatingSetting || userRatingSetting.value === "disabled") {
      return false;
    }

    // Verificar se já foi enviada uma solicitação de avaliação
    if (ticketTraking.ratingAt !== null) {
      return false;
    }


    // Obter mensagens personalizadas do WhatsApp
    const { ratingMessage } = await ShowWhatsAppService(
      ticket.whatsappId,
      companyId
    );

    // Usar mensagem personalizada do usuário ou mensagem padrão
    const defaultRatingMessage = `Muito obrigado por escolher nossa empresa! 😊

Avalie nossa equipe:`;

    const customRatingMessage = ratingMessage && ratingMessage.trim() !== "" 
      ? ratingMessage 
      : defaultRatingMessage;
    
    // Montar mensagem final: mensagem personalizada + opções fixas
    let bodyRatingMessage = `\u200e${customRatingMessage}\n\n`;
    bodyRatingMessage += "*1* - 😡 Insatisfeito\n";
    bodyRatingMessage += "*2* - 🙄 Satisfeito\n";
    bodyRatingMessage += "*3* - 😁 Muito Satisfeito\n\n";
    bodyRatingMessage += "_Digite apenas o número correspondente à sua avaliação._";

    // Enviar mensagem baseada no canal
    let messageSent = false;

    if (ticket.channel === "whatsapp") {
      try {
        await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });
        messageSent = true;
      } catch (whatsappError) {
        logger.error(`Failed to send WhatsApp auto rating for ticket ${ticket.id}: ${whatsappError.message}`);
        // Se falhar no WhatsApp, ainda assim marcar como enviado para não tentar novamente
        // O usuário pode ver que houve tentativa de envio nos logs
        messageSent = true;
      }
    }

    
    // Se houve tentativa de envio (mesmo que tenha falhado), atualizar o tracking
    if (messageSent) {
      await ticketTraking.update({
        ratingAt: moment().toDate(),
        rated: false
      });

      return true;
    }

    logger.warn(`No suitable channel found for auto rating on ticket ${ticket.id}`);
    return false;
  } catch (error) {
    logger.error(error, `Error sending auto rating for ticket ${ticket.id}`);
    return false;
  }
};

/**
 * Função para criar a configuração de avaliação automática para uma empresa
 */
export const createAutoRatingSetting = async (companyId: number): Promise<void> => {
  try {
    await Setting.findOrCreate({
      where: {
        companyId,
        key: "userRating"
      },
      defaults: {
        companyId,
        key: "userRating",
        value: "disabled" // Por padrão, desabilitar avaliação automática
      }
    });

  } catch (error) {
    logger.error(error, `Error creating user rating setting for company ${companyId}`);
  }
};

/**
 * Função para verificar se a avaliação automática está habilitada
 */
export const isAutoRatingEnabled = async (companyId: number): Promise<boolean> => {
  try {
    const setting = await Setting.findOne({
      where: {
        companyId,
        key: "userRating"
      }
    });

    return setting?.value === "enabled";
  } catch (error) {
    logger.error(error, `Error checking user rating setting for company ${companyId}`);
    return false;
  }
};

export default AutoRatingService;