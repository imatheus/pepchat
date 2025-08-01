import { Op } from "sequelize";
import moment from "moment";

import Campaign from "../../models/Campaign";
import { RestartService } from "./RestartService";
import ProcessCampaignJob from "./ProcessCampaignJob";
import { logger } from "../../utils/logger";
import { redisAvailable } from "../../queues";

const ProcessPendingCampaigns = async (): Promise<void> => {
  try {
    // Reduced logging - only log when campaigns are found
    const pendingCampaigns = await Campaign.findAll({
      where: {
        status: "PROGRAMADA",
        scheduledAt: {
          [Op.lte]: moment().toDate() // Campanhas que já deveriam ter sido executadas
        }
      }
    });

    if (pendingCampaigns.length > 0) {
      logger.info(`Found ${pendingCampaigns.length} pending campaigns`);

      // Iniciar cada campanha
      for (const campaign of pendingCampaigns) {
        try {
          logger.info(`Starting campaign ${campaign.id}: ${campaign.name}`);
          
          if (redisAvailable) {
            // Usar o serviço normal que tentará usar a fila
            await RestartService(campaign.id);
          } else {
            // Processar diretamente sem fila
            await campaign.update({ status: "EM_ANDAMENTO" });
            
            // Processar com delay para não sobrecarregar
            setTimeout(async () => {
              try {
                await ProcessCampaignJob({ data: { id: campaign.id } } as any);
              } catch (processError) {
                logger.error(`Error processing campaign ${campaign.id} directly:`, processError);
                await campaign.update({ status: 'CANCELADA' });
              }
            }, 1000);
          }
          
          logger.info(`Campaign ${campaign.id} started successfully`);
        } catch (error) {
          logger.error(`Error starting campaign ${campaign.id}:`, error);
          // Marcar como cancelada se não conseguir iniciar
          await campaign.update({ status: 'CANCELADA' });
        }
      }

      logger.info("Campaign processing completed");
    }
    // Removed "No pending campaigns found" log to reduce noise

  } catch (error) {
    logger.error("Error processing campaigns:", error);
  }
};

export default ProcessPendingCampaigns;