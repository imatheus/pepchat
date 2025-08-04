import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import { startQueueProcess } from "./queues";
import ProcessPendingSchedules from "./services/ScheduleServices/ProcessPendingSchedules";
import ProcessPendingCampaigns from "./services/CampaignService/ProcessPendingCampaigns";
import CheckCompanyExpirationService from "./services/CompanyService/CheckCompanyExpirationService";
import autoRetryService from "./services/AsaasService/AutoRetryFailedSubscriptionUpdatesService";
import Company from "./models/Company";
import sequelize from "./database";

const server = app.listen(process.env.PORT, async () => {
  logger.info(`Application server started successfully on port ${process.env.PORT}`);
  
  try {
    // Aguardar um pouco para garantir que o banco esteja pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se a tabela Companies existe antes de tentar buscar
    const companies = await Company.findAll().catch(error => {
      logger.warn("Companies table not ready yet, skipping WhatsApp sessions initialization:", error.message);
      return [];
    });
    
    if (companies.length > 0) {
      const allPromises: any[] = [];
      companies.forEach(c => {
        const promise = StartAllWhatsAppsSessions(c.id).catch(error => {
          logger.error(`Error starting WhatsApp session for company ${c.id}:`, error);
        });
        allPromises.push(promise);
      });

      await Promise.allSettled(allPromises);
      logger.info("WhatsApp sessions initialization completed");
    }

    // Inicializar sistema de filas
    try {
      startQueueProcess();
      logger.info("Queue system started");
    } catch (error) {
      logger.error("Error starting queue system:", error);
    }
    
    // Processar agendamentos e campanhas pendentes após inicialização
    setTimeout(async () => {
      try {
        await ProcessPendingSchedules();
        logger.info("Pending schedules processed");
      } catch (error) {
        logger.error("Error processing pending schedules:", error);
      }
      
      try {
        await ProcessPendingCampaigns();
        logger.info("Pending campaigns processed");
      } catch (error) {
        logger.error("Error processing pending campaigns:", error);
      }
    }, 5000); // Aguardar 5 segundos para garantir que tudo esteja inicializado

    // Configurar processamento periódico de campanhas programadas (a cada minuto)
    setInterval(async () => {
      try {
        await ProcessPendingCampaigns();
      } catch (error) {
        logger.error("Error in periodic campaign processing:", error);
      }
    }, 60000); // 60 segundos

    // Configurar verificação periódica de expiração de empresas (a cada 10 minutos)
    setInterval(async () => {
      try {
        await CheckCompanyExpirationService();
      } catch (error) {
        logger.error("Error in periodic company expiration check:", error);
      }
    }, 600000); // 10 minutos (600000 ms)

    // Executar verificação inicial de expiração após 30 segundos
    setTimeout(async () => {
      try {
        await CheckCompanyExpirationService();
      } catch (error) {
        logger.error("Error in initial company expiration check:", error);
      }
    }, 30000); // 30 segundos
    
  } catch (error) {
    logger.error("Error during server initialization:", error);
  }
});

// Inicializar serviço de retry automático para atualizações de assinatura do Asaas
setTimeout(() => {
  try {
    autoRetryService.start();
    logger.info("Asaas auto retry service started");
  } catch (error) {
    logger.error("Error starting Asaas auto retry service:", error);
  }
}, 60000); // Aguardar 1 minuto para garantir que tudo esteja estável

initIO(server);
gracefulShutdown(server);