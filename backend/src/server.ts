import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import { startQueueProcess } from "./queues";
import ProcessPendingSchedules from "./services/ScheduleServices/ProcessPendingSchedules";
import ProcessPendingCampaigns from "./services/CampaignService/ProcessPendingCampaigns";
import CheckCompanyExpirationService from "./services/CompanyService/CheckCompanyExpirationService";
import Company from "./models/Company";

const server = app.listen(process.env.PORT, async () => {
  const companies = await Company.findAll();
  const allPromises: any[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  Promise.all(allPromises).then(async () => {
    // Inicializar sistema de filas
    startQueueProcess();
    
    // Processar agendamentos e campanhas pendentes após inicialização
    setTimeout(async () => {
      await ProcessPendingSchedules();
      await ProcessPendingCampaigns();
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
        logger.info("Running periodic company expiration check...");
        await CheckCompanyExpirationService();
      } catch (error) {
        logger.error("Error in periodic company expiration check:", error);
      }
    }, 600000); // 10 minutos (600000 ms)

    // Executar verificação inicial de expiração após 30 segundos
    setTimeout(async () => {
      try {
        logger.info("Running initial company expiration check...");
        await CheckCompanyExpirationService();
      } catch (error) {
        logger.error("Error in initial company expiration check:", error);
      }
    }, 30000); // 30 segundos
  });
  logger.info(`Application server started successfully on port ${process.env.PORT}`);
});

initIO(server);
gracefulShutdown(server);
