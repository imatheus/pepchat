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
    const companies = await Company.findAll().catch(() => {
      return [];
    });
    
    if (companies.length > 0) {
      const allPromises: any[] = [];
      companies.forEach(c => {
        const promise = StartAllWhatsAppsSessions(c.id).catch(() => {});
        allPromises.push(promise);
      });

      await Promise.allSettled(allPromises);
      // silencioso
    }

    // Inicializar sistema de filas
    try {
      startQueueProcess();
    } catch (error) {
      // silencioso
    }
    
    // Processar agendamentos e campanhas pendentes após inicialização
    setTimeout(async () => {
      try {
        await ProcessPendingSchedules();
      } catch (error) {
        // silencioso
      }
      
      try {
        await ProcessPendingCampaigns();
      } catch (error) {
        // silencioso
      }
    }, 5000);

    // Configurar processamento periódico de campanhas programadas (a cada minuto)
    setInterval(async () => {
      try {
        await ProcessPendingCampaigns();
      } catch (error) {
        // silencioso
      }
    }, 60000);

    // Configurar verificação periódica de expiração de empresas (a cada 10 minutos)
    setInterval(async () => {
      try {
        await CheckCompanyExpirationService();
      } catch (error) {
        // silencioso
      }
    }, 600000);

    // Executar verificação inicial de expiração após 30 segundos
    setTimeout(async () => {
      try {
        await CheckCompanyExpirationService();
      } catch (error) {
        // silencioso
      }
    }, 30000);
    
  } catch (error) {
    // silencioso
  }
});

// Inicializar serviço de retry automático para atualizações de assinatura do Asaas
setTimeout(() => {
  try {
    autoRetryService.start();
  } catch (error) {
    // silencioso
  }
}, 60000);

initIO(server);
gracefulShutdown(server);