import { join } from "path";
import { promisify } from "util";
import { writeFile } from "fs";
import * as Sentry from "@sentry/node";
import { isNil, head, isNull } from "lodash";
import UploadHelper from "../../helpers/UploadHelper";

import {
  downloadContentFromMessage,
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  MediaType,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  WASocket,
} from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import User from "../../models/User";

import { getIO } from "../../libs/socket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { logger } from "../../utils/logger";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import formatBody from "../../helpers/Mustache";
import TicketTraking from "../../models/TicketTraking";
import UserRating from "../../models/UserRating";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import moment from "moment";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import Setting from "../../models/Setting";
import { cacheLayer } from "../../libs/cache";
import { debounce } from "../../helpers/Debounce";
import { provider } from "./providers";
import { shouldIgnoreMessage } from "./MessageFilterService";
import SendGreetingMessageService from "./SendGreetingMessageService";

// Função para verificar se o modo automático do chatbot está habilitado
const isChatbotAutoModeEnabled = async (companyId: number): Promise<boolean> => {
  try {
    const setting = await Setting.findOne({
      where: { key: "chatbotAutoMode", companyId }
    });
    return setting?.value === 'enabled';
  } catch (error) {
    logger.error(error, "Error getting chatbot auto mode setting");
    return true; // Default habilitado para manter compatibilidade
  }
};

// Função para selecionar a melhor fila para o usuário baseada na carga de trabalho
const selectBestQueueForUser = async (userQueues: Queue[], companyId: number): Promise<number> => {
  try {
    const queueWorkloads = await Promise.all(
      userQueues.map(async (queue) => {
        // Contar tickets ativos (open + pending) na fila
        const activeTicketsCount = await Ticket.count({
          where: {
            queueId: queue.id,
            status: ['open', 'pending'],
            companyId
          }
        });

        return {
          queueId: queue.id,
          queueName: queue.name,
          activeTickets: activeTicketsCount
        };
      })
    );

    // Ordenar por menor carga de trabalho
    queueWorkloads.sort((a, b) => a.activeTickets - b.activeTickets);

    const selectedQueue = queueWorkloads[0];
    logger.info(`Selected queue for user: ${selectedQueue.queueName} (${selectedQueue.activeTickets} active tickets)`);

    return selectedQueue.queueId;
  } catch (error) {
    logger.error(error, "Error selecting best queue for user, using first queue");
    // Fallback para a primeira fila em caso de erro
    return userQueues[0].id;
  }
};

type Session = WASocket & {
  id?: number;
};

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
}

// Corrigir o tipo do writeFileAsync para aceitar Buffer
const writeFileAsync = promisify(writeFile) as (path: string, data: Buffer | Uint8Array | string) => Promise<void>;

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  return getContentType(msg.message);
};

export const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {
  try {
    const type = getTypeMessage(msg);
    const types = {
      conversation: msg.message?.conversation,
      imageMessage: msg.message?.imageMessage?.caption,
      videoMessage: msg.message?.videoMessage?.caption,
      audioMessage: "audio",
      extendedTextMessage: msg.message?.extendedTextMessage?.text,
      buttonsResponseMessage: msg.message?.buttonsResponseMessage?.selectedButtonId,
      listResponseMessage: msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
      stickerMessage: "sticker",
      contactMessage: msg.message?.contactMessage?.vcard,
      locationMessage: `Latitude: ${msg.message?.locationMessage?.degreesLatitude} - Longitude: ${msg.message?.locationMessage?.degreesLongitude}`,
      liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message?.documentMessage?.title,
      reactionMessage: msg.message?.reactionMessage?.text || "reaction",
    } as const;

    return (types as any)[type] ?? null;
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg });
    Sentry.captureException(error);
    return null;
  }
};

export const isNumeric = (value: string): boolean => {
  return /^\d+$/.test(value);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const validaCpfCnpj = (cpfCnpj: string): boolean => {
  // Remove caracteres especiais
  const cleanCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');

  if (cleanCpfCnpj.length === 11) {
    // Validação de CPF
    return validaCpf(cleanCpfCnpj);
  } else if (cleanCpfCnpj.length === 14) {
    // Validação de CNPJ
    return validaCnpj(cleanCpfCnpj);
  }

  return false;
};

const validaCpf = (cpf: string): boolean => {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
};

const validaCnpj = (cnpj: string): boolean => {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

export const sendMessageImage = async (
  wbot: WASocket,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string
): Promise<void> => {
  try {
    // Construir o JID corretamente para grupos e contatos individuais
    const isGroup = ticket.contact.isGroup || ticket.contact.number.includes("-") || ticket.contact.number.endsWith("@g.us");
    let jid: string;

    if (ticket.contact.number.includes("@")) {
      jid = ticket.contact.number;
    } else {
      jid = `${ticket.contact.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
    }

    const sentMessage = await wbot.sendMessage(jid, {
      image: { url },
      caption: caption || ""
    });

    await verifyMessage(sentMessage, ticket, contact);
  } catch (error) {
    logger.error(error, "Error sending image message");
  }
};

export const sendMessageLink = async (
  wbot: WASocket,
  contact: Contact,
  ticket: Ticket,
  url: string,
  filename: string
): Promise<void> => {
  try {
    // Construir o JID corretamente para grupos e contatos individuais
    const isGroup = ticket.contact.isGroup || ticket.contact.number.includes("-") || ticket.contact.number.endsWith("@g.us");
    let jid: string;

    if (ticket.contact.number.includes("@")) {
      jid = ticket.contact.number;
    } else {
      jid = `${ticket.contact.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
    }

    const sentMessage = await wbot.sendMessage(jid, {
      document: { url },
      fileName: filename,
      mimetype: "application/pdf"
    });

    await verifyMessage(sentMessage, ticket, contact);
  } catch (error) {
    logger.error(error, "Error sending document message");
  }
};

export const makeid = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const verifyRating = (ticketTraking: TicketTraking): boolean => {
  if (
    ticketTraking &&
    ticketTraking.ratingAt !== null &&
    !ticketTraking.rated
  ) {
    // Verificar se ainda está dentro do período de avaliação (ex: 24 horas após ratingAt)
    const ratingTime = moment(ticketTraking.ratingAt);
    const now = moment();
    const hoursDiff = now.diff(ratingTime, 'hours');

    // Permitir avaliação até 24 horas após o ratingAt ser definido
    if (hoursDiff <= 24) {
      return true;
    }
  }
  return false;
};

const getQuotedMessageId = (msg: proto.IWebMessageInfo): string | null => {
  const body = extractMessageContent(msg.message);
  return (body as any)?.contextInfo?.stanzaId || null;
};

const getMeSocket = (wbot: Session): IMe => {
  return { id: jidNormalizedUser(wbot.user.id), name: wbot.user.name };
};

const getSenderMessage = (msg: proto.IWebMessageInfo, wbot: Session): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;
  const senderId = msg.participant || msg.key.participant || msg.key.remoteJid || undefined;
  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  const isGroup = msg.key.remoteJid.endsWith("@g.us");
  const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
  return isGroup
    ? { id: getSenderMessage(msg, wbot), name: msg.pushName }
    : { id: msg.key.remoteJid, name: msg.key.fromMe ? rawNumber : msg.pushName || msg.key.remoteJid.replace(/\D/g, "") };
};

const downloadMedia = async (msg: proto.IWebMessageInfo) => {
  const mineType =
    msg.message?.imageMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.documentMessage ||
    msg.message?.audioMessage;

  if (!mineType || !mineType.mimetype) {
    return null;
  }

  const messageType = mineType.mimetype
    .split("/")[0]
    .replace("application", "document") as MediaType;

  let stream: any;
  try {
    stream = await downloadContentFromMessage(mineType as any, messageType);
  } catch (error: any) {
    // Alguns conteúdos podem falhar a descriptografia (ERR_OSSL_BAD_DECRYPT) – ignorar com aviso suave
    const msg = (error && (error.message || error.toString())) || "";
    if (msg.includes("bad decrypt") || error?.code === 'ERR_OSSL_BAD_DECRYPT') {
      logger.warn("Skipping media decryption failure (bad decrypt) for incoming message");
    } else {
      logger.error(error, "Error downloading media");
    }
    return null;
  }

  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  if (!buffer) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }

  let filename = msg.message?.documentMessage?.fileName || "";
  if (!filename) {
    const ext = mineType.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  }

  const media = { data: buffer, mimetype: mineType.mimetype, filename };
  return media;
};

const verifyContact = async (msgContact: IMe, wbot: Session, companyId: number): Promise<Contact> => {
  let profilePicUrl: string;
  try {
    profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
  } catch (e) {
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  const isGroup = msgContact.id.endsWith("g.us");

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    // Para grupos, manter o ID completo; para contatos individuais, remover caracteres não numéricos
    number: isGroup ? msgContact.id : msgContact.id.replace(/\D/g, ""),
    profilePicUrl,
    isGroup,
    companyId,
  };

  return CreateOrUpdateContactService(contactData);
};

const verifyQuotedMessage = async (msg: proto.IWebMessageInfo): Promise<Message | null> => {
  const quotedId = getQuotedMessageId(msg);
  if (!quotedId) return null;
  return Message.findByPk(quotedId);
};

const verifyMediaMessage = async (msg: proto.IWebMessageInfo, ticket: Ticket, contact: Contact): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const media = await downloadMedia(msg);

  if (!media) {
    // Fallback: registrar apenas mensagem de texto/caption para evitar quebra de fluxo
    const body = getBodyMessage(msg) || "";
    const messageData = {
      id: msg.key.id,
      ticketId: ticket.id,
      contactId: msg.key.fromMe ? undefined : contact.id,
      body,
      fromMe: msg.key.fromMe,
      read: msg.key.fromMe,
      mediaUrl: undefined,
      mediaType: undefined,
      quotedMsgId: (await verifyQuotedMessage(msg))?.id,
      ack: msg.status,
      dataJson: JSON.stringify(msg),
    } as any;

    await ticket.update({ lastMessage: body || ticket.lastMessage || '' });
    await CreateMessageService({ messageData, companyId: ticket.companyId });
    return message as any; // encerra sem erro
  }

  // Organizar arquivo por empresa e categoria
  const fileName = UploadHelper.generateFileName(media.filename);
  const uploadConfig = {
    companyId: ticket.companyId,
    category: 'chat' as const,
    ticketId: ticket.id
  };

  let mediaPath: string;
  try {
    mediaPath = await UploadHelper.saveBuffer(media.data, uploadConfig, fileName);
  } catch (err) {
    logger.error(err, "Error organizing media file");
    // Fallback para método antigo se falhar
    try {
      await writeFileAsync(join(__dirname, "..", "..", "..", "public", media.filename), media.data);
      mediaPath = media.filename;
    } catch (fallbackErr) {
      logger.error(fallbackErr, "Error writing media file");
      throw new Error("ERR_SAVING_MEDIA");
    }
  }

  const mediaType = media.mimetype.split("/")[0];
  // Para áudio, não salvar texto "audio" no body; manter vazio para UI mostrar o tipo amigável
  const body = mediaType === 'audio' ? '' : (getBodyMessage(msg) || "");
  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: mediaPath, // Usar caminho organizado
    mediaType: mediaType,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    dataJson: JSON.stringify(msg),
  };

  // Atualizar última mensagem do ticket com descrição mais amigável
  const lastMessageText = body || (mediaType === 'image' ? '📷 Imagem' :
    mediaType === 'video' ? '🎥 Vídeo' :
      mediaType === 'audio' ? '🎵 Áudio' :
        '📄 Documento');
  await ticket.update({ lastMessage: lastMessageText });

  const newMessage = await CreateMessageService({ messageData, companyId: ticket.companyId });

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [{ model: Queue, as: "queue" }, { model: User, as: "user" }, { model: Contact, as: "contact" }],
    });

    io.to("closed").emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticketId: ticket.id,
    });

    io.to(`status:${ticket.status}`).to(`ticket:${ticket.id}`).emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
    });
  }
  return newMessage;
};

export const verifyMessage = async (msg: proto.IWebMessageInfo, ticket: Ticket, contact: Contact) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg) || "";

  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: getTypeMessage(msg),
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    dataJson: JSON.stringify(msg)
  };

  await ticket.update({ lastMessage: body });

  const createdMessage = await CreateMessageService({ messageData, companyId: ticket.companyId });

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [{ model: Queue, as: "queue" }, { model: User, as: "user" }, { model: Contact, as: "contact" }]
    });

    io.to("status:closed").emit(`company-${ticket.companyId}-ticket`, { action: "delete", ticketId: ticket.id });
    io.to(`status:${ticket.status}`).to(`ticket:${ticket.id}`).emit(`company-${ticket.companyId}-ticket`, { action: "update", ticket });
  }
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) return false;
    return true;
  } catch (error) {
    logger.error(error, "Error checking message validity");
    return false;
  }
};

// Emojis customizados para números e comandos
const glyphFor = (value: string): string => {
  const map: Record<string, string> = {
    '0': '0️⃣',
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣',
    '4': '4️⃣',
    '5': '5️⃣',
    '6': '6️⃣',
    '7': '7️⃣',
    '8': '8️⃣',
    '9': '9️⃣',
    '#': '#️⃣'

  };
  return map[value] || '';
};

// Helper antigo mantido (não usado mais para menus)
const toKeycapEmoji = (value: string): string => {
  if (!/^\d+$/.test(value)) return "";
  return value.replace(/[0-9]/g, d => `${d}\uFE0F\u20E3`);
};

// Função simplificada para enviar mensagem de chatbot (sempre texto)
const sendChatbotMessage = async (
  ticket: Ticket,
  body: string,
  options: Array<{ option: string, title: string }>
) => {
  try {
    // Adicionar opções de navegação
    const allOptions = [
      ...options,
      { option: '0', title: 'Voltar ao menu anterior' },
      { option: '#', title: '#️⃣ Voltar ao Menu Principal' }
    ];

    // Sempre usar formato texto (Baileys sempre usa texto)
    const navOptions = [
      { option: '0', title: '0️⃣ Voltar ao menu anterior' },
      { option: '#', title: '#️⃣ Voltar ao Menu Principal' }
    ];

    const optionsPart = options.map((opt, idx) => {
      const num = (idx + 1).toString();
      const emoji = glyphFor(num);
      const prefix = emoji ? `${emoji} ` : '';
      return `${prefix}${opt.title}`;
    }).join('\n');

    const navPart = navOptions.map(n => n.title).join('\n');
    const textOptions = optionsPart ? `${optionsPart}\n\n${navPart}\n` : "";

    const textMessage = formatBody(`${body}\n\n${textOptions}`, ticket.contact);
    await SendWhatsAppMessage({ body: textMessage, ticket });

  } catch (error) {
    logger.error(error, "Error sending chatbot message");
    // Fallback para texto em caso de erro
    const navOptions = [
      { option: '0', title: '⿠ Voltar ao menu anterior' },
      { option: '#', title: '⿪ Voltar ao Menu Principal' }
    ];

    const optionsPart = options.map((opt, idx) => {
      const num = (idx + 1).toString();
      const emoji = glyphFor(num);
      const prefix = emoji ? `${emoji} ` : '';
      return `${prefix}${opt.title}`;
    }).join('\n');

    const navPart = navOptions.map(n => n.title).join('\n');
    const textOptions = optionsPart ? `${optionsPart}\n\n${navPart}\n` : "";

    const textMessage = formatBody(`${body}\n\n${textOptions}`, ticket.contact);
    await SendWhatsAppMessage({ body: textMessage, ticket });
  }
};

const verifyQueue = async (wbot: Session, msg: proto.IWebMessageInfo, ticket: Ticket, contact: Contact) => {
  const { queues, greetingMessage } = await ShowWhatsAppService(wbot.id!, ticket.companyId);

  // Se não há setores cadastrados, não faz nada
  if (queues.length === 0) {
    return;
  }

  const selectedOption = getBodyMessage(msg);

  // Verificar se o usuário selecionou uma opção válida
  const optionNumber = parseInt(selectedOption);
  if (selectedOption && !isNaN(optionNumber) && optionNumber >= 1 && optionNumber <= queues.length) {
    // Usuário selecionou um setor válido
    const choosenQueue = queues[optionNumber - 1];
    // Verificar se o setor tem opções de chatbot
    const queueOptionsCount = await QueueOption.count({
      where: { queueId: choosenQueue.id, parentId: null }
    });

    const chatbot = queueOptionsCount > 0;
    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id, chatbot },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
    // Se tem chatbot, verificar horário de funcionamento antes de mostrar opções
    if (chatbot) {
      const queue = await Queue.findByPk(choosenQueue.id);

      // Verificar horário de funcionamento ANTES de mostrar as opções
      const { schedules }: any = queue;
      const now = moment();
      const weekday = now.format("dddd").toLowerCase();
      let schedule;

      if (Array.isArray(schedules) && schedules?.length > 0) {
        schedule = schedules.find((s) => s.weekdayEn === weekday && s.startTime !== "" && s.startTime !== null && s.endTime !== "" && s.endTime !== null);
      }

      // Se está fora do horário e tem mensagem configurada
      if (queue.outOfHoursMessage !== null && queue.outOfHoursMessage !== "" && !isNil(schedule)) {
        const startTime = moment(schedule.startTime, "HH:mm");
        const endTime = moment(schedule.endTime, "HH:mm");

        if (now.isBefore(startTime) || now.isAfter(endTime)) {
          const body = formatBody(`${queue.outOfHoursMessage}\n\n⿪ Voltar ao Menu Principal`, contact);
          await SendWhatsAppMessage({ body, ticket });
          return;
        }
      }

      // Se está no horário, mostrar as opções do chatbot
      const queueOptions = await QueueOption.findAll({
        where: { queueId: choosenQueue.id, parentId: null },
        order: [["option", "ASC"], ["createdAt", "ASC"]]
      });
      const opts = queueOptions.map(o => ({ option: o.option, title: o.title }));
      await sendChatbotMessage(ticket, queue.greetingMessage, opts);
    }

    return;
  }

  // Se chegou aqui, é primeira mensagem ou opção inválida - mostrar opções de setores
  const queueOptions = queues.map((queue, index) => ({
    option: (index + 1).toString(),
    title: queue.name
  }));

  await sendChatbotMessage(ticket, greetingMessage, queueOptions);
};

const handleChatbot = async (
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  wbot: Session,
  dontReadTheFirstQuestion: boolean = false
): Promise<void> => {
  const queue = await Queue.findByPk(ticket.queueId);

  if (!queue) {
    return;
  }

  const messageBody = getBodyMessage(msg);

  // Voltar para o menu inicial
  if (messageBody == "#") {
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await ticket.reload();
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // Se o ticket não tem queueOptionId, é a primeira interação com o chatbot
  if (isNil(ticket.queueOptionId)) {
    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [["option", "ASC"], ["createdAt", "ASC"]],
    });

    // Se o usuário enviou uma mensagem, verificar se corresponde a uma opção
    if (messageBody && !dontReadTheFirstQuestion) {
      let selectedOption = queueOptions.find((o) => o.option == messageBody);
      // Fallback: permitir seleção por índice (1..n)
      if (!selectedOption && /^\d+$/.test(messageBody)) {
        const idx = parseInt(messageBody, 10) - 1;
        if (idx >= 0 && idx < queueOptions.length) {
          selectedOption = queueOptions[idx];
        }
      }
      if (selectedOption) {
        await ticket.update({ queueOptionId: selectedOption.id });

        // Verificar se esta opção tem sub-opções
        const hasSubOptions = await QueueOption.count({
          where: { parentId: selectedOption.id }
        });

        if (hasSubOptions > 0) {
          // Se tem sub-opções, mostrar elas
          const subOptions = await QueueOption.findAll({
            where: { parentId: selectedOption.id },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          const subOptionsFormatted = subOptions.map(option => ({
            option: option.option,
            title: option.title
          }));

          await sendChatbotMessage(ticket, selectedOption.message, subOptionsFormatted);
        } else {
          // Se não tem sub-opções, enviar apenas a mensagem
          const body = formatBody(`\u200e${selectedOption.message}`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        }
        return;
      }
    }

    // Mostrar opções principais se não selecionou nenhuma válida
    if (queueOptions.length > 0) {
      const optionsFormatted = queueOptions.map(option => ({
        option: option.option,
        title: option.title
      }));

      // Para opções principais, não incluir "voltar ao menu anterior"
      const finalOptions = [...optionsFormatted];
      await sendChatbotMessage(ticket, queue.greetingMessage, finalOptions);
    } else {
      await ticket.update({ chatbot: false });
    }

  } else {
    // Usuário já está em uma opção, verificar sub-opções
    const subOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [["option", "ASC"], ["createdAt", "ASC"]],
    });

    if (messageBody) {
      if (messageBody == "0") {
        // Voltar para o menu anterior
        const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
        if (currentOption && currentOption.parentId) {
          await ticket.update({ queueOptionId: currentOption.parentId });

          // Mostrar opções do nível anterior
          const parentOptions = await QueueOption.findAll({
            where: { parentId: currentOption.parentId },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          if (parentOptions.length > 0) {
            const parentOptionsFormatted = parentOptions.map(option => ({
              option: option.option,
              title: option.title
            }));

            const parentOption = await QueueOption.findByPk(currentOption.parentId);
            await sendChatbotMessage(ticket, parentOption?.message || queue.greetingMessage, parentOptionsFormatted);
          }
        } else {
          // Voltar para as opções principais
          await ticket.update({ queueOptionId: null });
          const mainOptions = await QueueOption.findAll({
            where: { queueId: ticket.queueId, parentId: null },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          const mainOptionsFormatted = mainOptions.map(option => ({
            option: option.option,
            title: option.title
          }));

          // Para opções principais, não incluir "voltar ao menu anterior"
          const finalOptions = [...mainOptionsFormatted];
          await sendChatbotMessage(ticket, queue.greetingMessage, finalOptions);
        }
        return;
      }

      // Verificar se selecionou uma sub-opção válida
      let selectedSubOption = subOptions.find((o) => o.option == messageBody);
      if (!selectedSubOption && /^\d+$/.test(messageBody)) {
        const idx = parseInt(messageBody, 10) - 1;
        if (idx >= 0 && idx < subOptions.length) {
          selectedSubOption = subOptions[idx];
        }
      }
      if (selectedSubOption) {
        await ticket.update({ queueOptionId: selectedSubOption.id });

        // Verificar se esta sub-opção tem filhos
        const hasChildren = await QueueOption.count({
          where: { parentId: selectedSubOption.id }
        });

        if (hasChildren > 0) {
          // Mostrar as opções filhas
          const childOptions = await QueueOption.findAll({
            where: { parentId: selectedSubOption.id },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          const childOptionsFormatted = childOptions.map(option => ({
            option: option.option,
            title: option.title
          }));

          await sendChatbotMessage(ticket, selectedSubOption.message, childOptionsFormatted);
        } else {
          // Opção final, sem filhos
          const body = formatBody(`\u200e${selectedSubOption.message}`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        }
        return;
      }
    }

    // Se chegou aqui e tem sub-opções, mostrar elas
    if (subOptions.length > 0) {
      const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
      const subOptionsFormatted = subOptions.map(option => ({
        option: option.option,
        title: option.title
      }));

      await sendChatbotMessage(ticket, currentOption?.message || 'Escolha uma opção:', subOptionsFormatted);
    } else {
      // Opção final sem sub-opções
      const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
      if (currentOption) {
        const body = formatBody(`\u200e${currentOption.message}`, ticket.contact);
        await SendWhatsAppMessage({ body, ticket });
      }
    }
  }
};

const handleRating = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const bodyMessage = getBodyMessage(msg);
  let rate: number | null = null;

  if (bodyMessage) {
    rate = +bodyMessage || null;
  }

  if (!Number.isNaN(rate) && Number.isInteger(rate) && !isNull(rate)) {
    let finalRate = rate;

    if (rate < 1) {
      finalRate = 1;
    }
    if (rate > 3) {
      finalRate = 3;
    }

    await UserRating.create({
      ticketId: ticketTraking.ticketId,
      companyId: ticketTraking.companyId,
      userId: ticketTraking.userId || null,
      rate: finalRate,
    });

    await ticketTraking.update({
      rated: true,
      finishedAt: moment().toDate() // Finalizar o tracking agora que foi avaliado
    });

    // Agora que o usuário avaliou, finalizar definitivamente o ticket
    // Isso enviará a mensagem de finalização e fechará completamente o ticket
    setTimeout(async () => {
      try {
        await UpdateTicketService({
          ticketData: { status: "closed", justClose: true }, // justClose=true para forçar finalização
          ticketId: ticket.id,
          companyId: ticket.companyId
        });
      } catch (error) {
        logger.error(error, "Error closing ticket after rating");
      }
    }, 500);
  }
};

const handleMessage = async (msg: proto.IWebMessageInfo, wbot: Session, companyId: number): Promise<void> => {
  if (!isValidMsg(msg)) return;

  try {
    // Verificar se a mensagem deve ser ignorada (filtros aprimorados)
    const shouldIgnore = await shouldIgnoreMessage(msg, {
      whatsappId: wbot.id!,
      companyId
    });

    if (shouldIgnore) {
      return;
    }

    // Verificar se o modo automático do chatbot está habilitado
    const chatbotAutoModeEnabled = await isChatbotAutoModeEnabled(companyId);

    let msgContact: IMe;
    let groupContact: Contact | undefined;
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const bodyMessage = getBodyMessage(msg);

    msgContact = await getContactMessage(msg, wbot);

    if (isGroup) {
      const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid);
      const msgGroupContact = { id: grupoMeta.id, name: grupoMeta.subject };
      groupContact = await verifyContact(msgGroupContact, wbot, companyId);
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    const contact = await verifyContact(msgContact, wbot, companyId);
    const ticket = await FindOrCreateTicketService(contact, wbot.id!, 0, companyId, groupContact);

    // Verificar se é um ticket novo e enviar mensagem de saudação se necessário
    if ((ticket as any).isNewTicket && !msg.key.fromMe && !isGroup) {
      logger.info(`New ticket created: ${ticket.id}, sending greeting message`);
      try {
        await SendGreetingMessageService(ticket, contact, wbot.id!, companyId);
      } catch (greetingError) {
        logger.error(greetingError, `Error sending greeting message for ticket ${ticket.id}`);
      }
    }

    // Verificar se é uma avaliação antes de processar outras lógicas
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: wbot.id!
    });

    if (!msg.key.fromMe) {
      if (ticketTraking !== null && verifyRating(ticketTraking)) {
        await handleRating(msg, ticket, ticketTraking);
        return;
      }
    }

    const hasMedia =
      msg.message?.imageMessage ||
      msg.message?.videoMessage ||
      msg.message?.documentMessage ||
      msg.message?.stickerMessage ||
      msg.message?.audioMessage;

    if (hasMedia) {
      await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }

    // Verificar se precisa mostrar opções de setores (apenas se modo automático estiver habilitado e não tem setor atribuído)
    if (chatbotAutoModeEnabled && !ticket.queueId && !isGroup && !msg.key.fromMe && !ticket.userId && whatsapp.queues.length >= 1) {
      await verifyQueue(wbot, msg, ticket, contact);
      return; // Importante: retornar aqui para não continuar o processamento
    }

    // Se o modo automático estiver desabilitado e o ticket não tem fila, 
    // mas tem usuário atribuído, atribuir a fila do usuário
    if (!chatbotAutoModeEnabled && !ticket.queueId && ticket.userId) {
      const user = await User.findByPk(ticket.userId, {
        include: [{ model: Queue, as: "queues" }]
      });

      if (user && user.queues && user.queues.length > 0) {
        let selectedQueueId: number;

        if (user.queues.length === 1) {
          // Se tem apenas uma fila, usar ela
          selectedQueueId = user.queues[0].id;
        } else {
          // Se tem múltiplas filas, escolher a com menor carga de trabalho
          selectedQueueId = await selectBestQueueForUser(user.queues, ticket.companyId);
        }

        await UpdateTicketService({
          ticketData: { queueId: selectedQueueId },
          ticketId: ticket.id,
          companyId: ticket.companyId
        });

        // Recarregar o ticket com as informações atualizadas
        await ticket.reload({
          include: [{ model: Queue, as: "queue" }, { model: User, as: "user" }, { model: Contact, as: "contact" }]
        });
      }
    }

    // Reload ticket to get updated queue information
    await ticket.reload({
      include: [{ model: Queue, as: "queue" }, { model: User, as: "user" }, { model: Contact, as: "contact" }]
    });

    // Handle chatbot logic for queues with options (apenas se modo automático estiver habilitado, tem setor e chatbot ativo)
    if (chatbotAutoModeEnabled && ticket.queue && ticket.chatbot && !msg.key.fromMe) {
      await handleChatbot(ticket, msg, wbot, false);
      return; // Importante: retornar aqui para não continuar o processamento
    }

    // Handle provider logic for automated responses (like boleto, etc.)
    if (ticket.queue && !msg.key.fromMe) {
      await provider(ticket, msg, companyId, contact, wbot as WASocket);
    }
  } catch (err) {
    logger.error(err, "Error handling message");
  }
};

const filterMessages = (msg: WAMessage): boolean => {
  if (msg.message?.protocolMessage) return false;
  const stubTypes = [
    WAMessageStubType.REVOKE,
    WAMessageStubType.E2E_DEVICE_CHANGED,
    WAMessageStubType.E2E_IDENTITY_CHANGED,
    WAMessageStubType.CIPHERTEXT
  ];
  if (stubTypes.includes(msg.messageStubType as typeof WAMessageStubType[keyof typeof WAMessageStubType])) return false;
  return true;
};

const wbotMessageListener = async (wbot: Session, companyId: number): Promise<void> => {
  try {
    wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
      const messages = messageUpsert.messages.filter(filterMessages);
      if (!messages) return;

      for (const message of messages) {
        try {
          const messageExists = await Message.count({ where: { id: message.key.id!, companyId } });
          if (!messageExists) {
            await handleMessage(message, wbot, companyId);
          }
        } catch (error) {
          logger.error(error, `Error processing message ${message.key.id}`);
        }
      }
    });

    wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
      if (messageUpdate.length === 0) return;
      for (const message of messageUpdate) {
        // Handle message updates (ack, etc.) here if needed
      }
    });
  } catch (error) {
    logger.error(error, "Error handling wbot message listener");
  }
};

export { wbotMessageListener };