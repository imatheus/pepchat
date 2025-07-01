import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

interface CheckResult {
  isValid: boolean;
  exists: boolean;
  jid?: string;
  error?: string;
}

const checker = async (number: string, wbot: any): Promise<any> => {
  try {
    const result = await wbot.onWhatsApp(`${number}@s.whatsapp.net`);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error(`Erro ao verificar número ${number} no WhatsApp:`, error);
    throw error;
  }
};

const CheckContactNumberSafe = async (
  number: string,
  companyId: number
): Promise<CheckResult> => {
  try {
    // Validação básica do número
    if (!number || number.length < 10) {
      return {
        isValid: false,
        exists: false,
        error: "Número muito curto ou inválido"
      };
    }

    // Verificar se o WhatsApp está conectado
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    if (!defaultWhatsapp) {
      return {
        isValid: false,
        exists: false,
        error: "Nenhum WhatsApp padrão encontrado"
      };
    }

    const wbot = getWbot(defaultWhatsapp.id);
    if (!wbot) {
      return {
        isValid: false,
        exists: false,
        error: "WhatsApp não está conectado"
      };
    }

    // Verificar se o número existe no WhatsApp
    const validNumber = await checker(number, wbot);
    
    if (!validNumber) {
      return {
        isValid: true,
        exists: false,
        error: "Número não encontrado no WhatsApp"
      };
    }

    return {
      isValid: true,
      exists: validNumber.exists || false,
      jid: validNumber.jid || `${number}@s.whatsapp.net`
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao verificar número ${number}:`, errorMessage);
    
    return {
      isValid: false,
      exists: false,
      error: errorMessage
    };
  }
};

export default CheckContactNumberSafe;