import { proto } from "@whiskeysockets/baileys";
import Whatsapp from "../../models/Whatsapp";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";
import HistoryConfigService from "./HistoryConfigService";

interface MessageFilterOptions {
  whatsappId: number;
  companyId: number;
}

/**
 * Verifica se uma mensagem deve ser processada ou ignorada
 * Filtra mensagens antigas que foram sincronizadas após reinicialização do servidor
 */
export const shouldProcessMessage = async (
  msg: proto.IWebMessageInfo,
  options: MessageFilterOptions
): Promise<boolean> => {
  try {
    const { whatsappId, companyId } = options;

    // Obter configurações de histórico
    const historyConfig = await HistoryConfigService.getHistoryConfig(companyId);

    // Se a prevenção de mensagens em massa está desabilitada, processar todas
    if (!historyConfig.preventMassMessages) {
      return true;
    }

    // Buscar informações da sessão do WhatsApp
    const whatsapp = await Whatsapp.findOne({
      where: { id: whatsappId, companyId }
    });

    if (!whatsapp) {
      logger.warn(`WhatsApp session not found: ${whatsappId}`);
      return false;
    }

    // Obter timestamp da mensagem
    const messageTimestamp = msg.messageTimestamp;
    if (!messageTimestamp) {
      // Se não há timestamp, assumir que é mensagem atual
      return true;
    }

    // Verificar limite de dias configurado
    if (!HistoryConfigService.isMessageWithinDaysLimit(messageTimestamp, historyConfig.historyDaysLimit)) {
      logger.info(`Filtering message older than ${historyConfig.historyDaysLimit} days: ${msg.key.id}`);
      return false;
    }

    // Se não há sessionStartedAt definido, usar apenas o limite de dias
    if (!whatsapp.sessionStartedAt) {
      return true;
    }

    // Converter timestamp da mensagem para Date
    let messageDate: Date;
    if (typeof messageTimestamp === 'number') {
      messageDate = new Date(messageTimestamp * 1000);
    } else if (messageTimestamp.toNumber) {
      messageDate = new Date(messageTimestamp.toNumber() * 1000);
    } else {
      // Fallback: assumir que é timestamp em milissegundos
      messageDate = new Date(Number(messageTimestamp));
    }

    // Adicionar margem de segurança de 30 segundos para evitar perder mensagens legítimas
    const sessionStartWithMargin = new Date(whatsapp.sessionStartedAt.getTime() - 30000);

    // Verificar se a mensagem é anterior ao início da sessão
    const isOldMessage = messageDate < sessionStartWithMargin;

    if (isOldMessage) {
      logger.info(`Filtering old message: ${msg.key.id} - Message time: ${messageDate.toISOString()}, Session started: ${whatsapp.sessionStartedAt.toISOString()}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(error, "Error checking if message should be processed");
    // Em caso de erro, processar a mensagem para não perder dados importantes
    return true;
  }
};

/**
 * Verifica se uma mensagem é do próprio bot (enviada pelo sistema)
 */
export const isBotMessage = (msg: proto.IWebMessageInfo): boolean => {
  // Verificar se é mensagem enviada pelo próprio bot
  if (msg.key.fromMe) {
    return true;
  }

  // Verificar se a mensagem contém marcadores do bot
  const body = msg.message?.conversation || 
               msg.message?.extendedTextMessage?.text || 
               msg.message?.imageMessage?.caption || 
               msg.message?.videoMessage?.caption || '';

  if (body) {
    // Verificar caracteres especiais usados pelo bot
    if (body.includes('\u200e') || body.includes('‎')) {
      return true;
    }

    // Verificar padrões de mensagens do bot
    if (body.includes('*[') && body.includes(']*')) {
      return true;
    }

    // Verificar se começa com caracteres especiais do bot
    if (body.startsWith('*[') || body.startsWith('‎')) {
      return true;
    }
  }

  return false;
};

/**
 * Verifica se uma mensagem é uma mensagem de sistema do WhatsApp
 */
export const isSystemMessage = (msg: proto.IWebMessageInfo): boolean => {
  // Mensagens de protocolo (como revogações)
  if (msg.message?.protocolMessage) {
    return true;
  }

  // Mensagens de status/broadcast
  if (msg.key.remoteJid === "status@broadcast") {
    return true;
  }

  // Mensagens de stub (mudanças de grupo, etc.)
  if (msg.messageStubType) {
    return true;
  }

  return false;
};

/**
 * Verifica se mensagens de grupos devem ser ignoradas baseado na configuração da empresa
 */
export const shouldIgnoreGroupMessage = async (
  msg: proto.IWebMessageInfo,
  companyId: number
): Promise<boolean> => {
  try {
    // Verificar se a mensagem é de um grupo
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    
    if (!isGroup) {
      return false; // Não é grupo, não ignorar
    }

    // Buscar configuração da empresa
    const setting = await Setting.findOne({
      where: { 
        key: "CheckMsgIsGroup", 
        companyId 
      }
    });

    // Se a configuração não existe ou está desabilitada, processar mensagens de grupos
    if (!setting || setting.value === "disabled") {
      return false;
    }

    // Se a configuração está habilitada ("enabled"), ignorar mensagens de grupos
    if (setting.value === "enabled") {
      logger.info(`Ignoring group message from ${msg.key.remoteJid} - Group messages disabled for company ${companyId}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(error, "Error checking group message setting");
    // Em caso de erro, não ignorar a mensagem para não perder dados
    return false;
  }
};

/**
 * Filtro principal que combina todas as verificações
 */
export const shouldIgnoreMessage = async (
  msg: proto.IWebMessageInfo,
  options: MessageFilterOptions
): Promise<boolean> => {
  const { companyId } = options;

  // Verificar se é mensagem de sistema
  if (isSystemMessage(msg)) {
    return true;
  }

  // Verificar se é mensagem do bot
  if (isBotMessage(msg)) {
    return true;
  }

  // Verificar se mensagens de grupos devem ser ignoradas
  if (await shouldIgnoreGroupMessage(msg, companyId)) {
    return true;
  }

  // Verificar se é mensagem antiga (sincronizada após reinicialização)
  const shouldProcess = await shouldProcessMessage(msg, options);
  return !shouldProcess;
};