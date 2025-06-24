import { Op } from "sequelize";
import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";
import CampaignShipping from "../../models/CampaignShipping";
import { campaignQueue } from "../../queues";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";

export async function CancelService(id: number) {
  const campaign = await Campaign.findByPk(id);
  await campaign.update({ status: "CANCELADA" });

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
    logger.warn("Could not emit campaign cancel event:", socketError.message);
  }

  // Cancelar jobs pendentes se Redis estiver disponível
  if (campaignQueue) {
    try {
      const recordsToCancel = await CampaignShipping.findAll({
        where: {
          campaignId: campaign.id,
          jobId: { [Op.not]: null },
          deliveredAt: null
        }
      });

      const promises = [];

      for (let record of recordsToCancel) {
        try {
          const job = await campaignQueue.getJob(+record.jobId);
          if (job) {
            promises.push(job.remove());
          }
        } catch (jobError) {
          logger.warn(`Could not cancel job ${record.jobId}:`, jobError.message);
        }
      }

      await Promise.all(promises);
    } catch (error) {
      logger.warn("Error canceling campaign jobs:", error.message);
    }
  }
}
