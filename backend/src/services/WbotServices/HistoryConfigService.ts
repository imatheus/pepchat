import { logger } from "../../utils/logger";
import Setting from "../../models/Setting";

interface HistoryConfig {
  enableHistorySync: boolean;
  historyDaysLimit: number;
  preventMassMessages: boolean;
}

/**
 * Serviço para gerenciar configurações de sincronização de histórico
 */
export class HistoryConfigService {
  
  /**
   * Obter configurações de histórico para uma empresa
   */
  static async getHistoryConfig(companyId: number): Promise<HistoryConfig> {
    try {
      const settings = await Setting.findAll({
        where: {
          companyId,
          key: ['enableHistorySync', 'historyDaysLimit', 'preventMassMessages']
        }
      });

      const config: HistoryConfig = {
        enableHistorySync: true, // padrão
        historyDaysLimit: 7, // padrão: 7 dias
        preventMassMessages: true // padrão: prevenir envio em massa
      };

      settings.forEach(setting => {
        switch (setting.key) {
          case 'enableHistorySync':
            config.enableHistorySync = setting.value === 'true';
            break;
          case 'historyDaysLimit':
            config.historyDaysLimit = parseInt(setting.value) || 7;
            break;
          case 'preventMassMessages':
            config.preventMassMessages = setting.value !== 'false';
            break;
        }
      });

      return config;
    } catch (error) {
      logger.error(error, "Error getting history config");
      // Retornar configuração padrão em caso de erro
      return {
        enableHistorySync: true,
        historyDaysLimit: 7,
        preventMassMessages: true
      };
    }
  }

  /**
   * Atualizar configuração de histórico
   */
  static async updateHistoryConfig(companyId: number, config: Partial<HistoryConfig>): Promise<void> {
    try {
      const updates = [];

      if (config.enableHistorySync !== undefined) {
        updates.push({
          key: 'enableHistorySync',
          value: config.enableHistorySync.toString(),
          companyId
        });
      }

      if (config.historyDaysLimit !== undefined) {
        updates.push({
          key: 'historyDaysLimit',
          value: config.historyDaysLimit.toString(),
          companyId
        });
      }

      if (config.preventMassMessages !== undefined) {
        updates.push({
          key: 'preventMassMessages',
          value: config.preventMassMessages.toString(),
          companyId
        });
      }

      for (const update of updates) {
        await Setting.upsert(update);
      }

      logger.info(`History config updated for company ${companyId}:`, config);
    } catch (error) {
      logger.error(error, "Error updating history config");
      throw error;
    }
  }

  /**
   * Verificar se uma mensagem está dentro do limite de dias configurado
   */
  static isMessageWithinDaysLimit(messageTimestamp: number | any, daysLimit: number): boolean {
    try {
      let messageDate: Date;
      
      if (typeof messageTimestamp === 'number') {
        messageDate = new Date(messageTimestamp * 1000);
      } else if (messageTimestamp.toNumber) {
        messageDate = new Date(messageTimestamp.toNumber() * 1000);
      } else {
        messageDate = new Date(Number(messageTimestamp));
      }

      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysLimit);

      return messageDate >= limitDate;
    } catch (error) {
      logger.error(error, "Error checking message days limit");
      return true; // Em caso de erro, permitir a mensagem
    }
  }
}

export default HistoryConfigService;