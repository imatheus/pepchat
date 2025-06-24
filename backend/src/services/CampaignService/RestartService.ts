import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";
import { campaignQueue } from "../../queues";
import ProcessCampaignJob from "./ProcessCampaignJob";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";

export async function RestartService(id: number) {
  const campaign = await Campaign.findByPk(id);
  await campaign.update({ status: "EM_ANDAMENTO" });

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
    logger.warn("Could not emit campaign restart event:", socketError.message);
  }

  // Tentar usar a fila se disponível, senão processar diretamente
  if (campaignQueue) {
    try {
      await campaignQueue.add("ProcessCampaign", {
        id: campaign.id
      }, {
        delay: 3000
      });
      logger.info(`Campaign ${id} added to queue successfully`);
    } catch (error) {
      logger.error(`Error adding campaign ${id} to queue, processing directly:`, error);
      // Se falhar na fila, processar diretamente
      setTimeout(async () => {
        try {
          await ProcessCampaignJob({ data: { id: campaign.id } } as any);
        } catch (processError) {
          logger.error(`Error processing campaign ${id} directly:`, processError);
        }
      }, 3000);
    }
  } else {
    // Se não há fila disponível, processar diretamente
    logger.info(`No queue available, processing campaign ${id} directly`);
    setTimeout(async () => {
      try {
        await ProcessCampaignJob({ data: { id: campaign.id } } as any);
      } catch (processError) {
        logger.error(`Error processing campaign ${id} directly:`, processError);
      }
    }, 3000);
  }
}
