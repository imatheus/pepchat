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
   * Sempre retorna valores padrão otimizados
   */
  static async getHistoryConfig(companyId: number): Promise<HistoryConfig> {
    // Configurações fixas e otimizadas para prevenir problemas
    return {
      enableHistorySync: true, // Sempre ativo
      historyDaysLimit: 7, // 7 dias é um bom equilíbrio
      preventMassMessages: true // Sempre prevenir envio em massa
    };
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