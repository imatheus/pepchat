import { join } from "path";
import { promisify } from "util";
import { writeFile } from "fs";
import * as Sentry from "@sentry/node";
import { isNil, head, isNull } from "lodash";
import UploadHelper from "../../helpers/UploadHelper";

import {
  AnyWASocket,
  downloadContentFromMessage,
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  MediaType,
  MessageUpsertType,
  proto,
  WALegacySocket,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  WASocket,
} from "@adiwajshing/baileys";
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

type Session = AnyWASocket & {
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

const writeFileAsync = promisify(writeFile);

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
    };

    return types[type];
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
    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        image: { url },
        caption: caption || ""
      }
    );
    
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
    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        document: { url },
        fileName: filename,
        mimetype: "application/pdf"
      }
    );
    
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
    ticketTraking.finishedAt === null &&
    ticketTraking.ratingAt !== null &&
    !ticketTraking.rated
  ) {
    return true;
  }
  return false;
};

const getQuotedMessageId = (msg: proto.IWebMessageInfo): string | null => {
  const body = extractMessageContent(msg.message);
  return (body as any)?.contextInfo?.stanzaId || null;
};

const getMeSocket = (wbot: Session): IMe => {
  return wbot.type === "legacy"
    ? { id: jidNormalizedUser((wbot as WALegacySocket).state.legacy.user.id), name: (wbot as WALegacySocket).state.legacy.user.name }
    : { id: jidNormalizedUser((wbot as WASocket).user.id), name: (wbot as WASocket).user.name };
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
  const mineType = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage || msg.message?.documentMessage;
  const messageType = mineType.mimetype.split("/")[0].replace("application", "document") as MediaType;

  let stream: any;
  try {
    stream = await downloadContentFromMessage(mineType, messageType);
  } catch (error) {
    logger.error(error, "Error downloading media");
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

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number: msgContact.id.replace(/\D/g, ""),
    profilePicUrl,
    isGroup: msgContact.id.endsWith("g.us"),
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
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
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

  const body = getBodyMessage(msg) || media.filename;
  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: mediaPath, // Usar caminho organizado
    mediaType: media.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    dataJson: JSON.stringify(msg),
  };

  await ticket.update({ lastMessage: body });

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
  const body = getBodyMessage(msg);

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

  await CreateMessageService({ messageData, companyId: ticket.companyId });

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

        if (now.isBefore(startTime) || now.isAfter(endTime)) {          const body = formatBody(`${queue.outOfHoursMessage}\n\n*[ # ]* - Voltar ao Menu Principal`, contact);
          await SendWhatsAppMessage({ body, ticket });
          return;
        }
      }

      // Se está no horário, mostrar as opções do chatbot
      const queueOptions = await QueueOption.findAll({
        where: { queueId: choosenQueue.id, parentId: null },
        order: [["option", "ASC"], ["createdAt", "ASC"]]
      });
      
      let options = "";
      queueOptions.forEach((option) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Voltar ao Menu Principal`;

      const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, contact);      await SendWhatsAppMessage({ body: textMessage, ticket });
    }
    
    return;
  }
  
  // Se chegou aqui, é primeira mensagem ou opção inválida - mostrar opções de setores
  let options = "";
  queues.forEach((queue, index) => {
    options += `*[ ${index + 1} ]* - ${queue.name}\n`;
  });
  
  const body = formatBody(`\u200e${greetingMessage}\n\n${options}`, contact);
  await SendWhatsAppMessage({ body, ticket });
};

const handleChatbot = async (
  ticket: Ticket, 
  msg: proto.IWebMessageInfo, 
  wbot: Session, 
  dontReadTheFirstQuestion: boolean = false
): Promise<void> => {  
  // Buscar a fila sem filtro de parentId para evitar problemas
  const queue = await Queue.findByPk(ticket.queueId);
  
  if (!queue) {    return;
  }
  // A verificação de horário de funcionamento foi movida para verifyQueue
  // para ser executada imediatamente após a seleção do setor

  const messageBody = getBodyMessage(msg);
  // Voltar para o menu inicial
  if (messageBody == "#") {    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    
    // Recarregar o ticket para garantir que as mudanças foram aplicadas
    await ticket.reload();    
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // Se o ticket não tem queueOptionId, é a primeira interação com o chatbot
  if (isNil(ticket.queueOptionId)) {    
    // Buscar opções principais (parentId = null)
    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });    queueOptions.forEach(option => {    });

    // Se o usuário enviou uma mensagem, verificar se corresponde a uma opção
    if (messageBody && !dontReadTheFirstQuestion) {
      const selectedOption = queueOptions.find((o) => o.option == messageBody);
      if (selectedOption) {        await ticket.update({ queueOptionId: selectedOption.id });
        
        // Enviar mensagem de confirmação da opç��o selecionada
        const confirmationBody = formatBody(`\u200e${selectedOption.message}\n\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
        await SendWhatsAppMessage({ body: confirmationBody, ticket });
        return;
      } else {      }
    }

    // Mostrar opções principais
    if (queueOptions.length > 0) {
      let options = "";
      queueOptions.forEach((option, i) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Voltar ao Menu Principal`;

      const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact);      await SendWhatsAppMessage({ body: textMessage, ticket });
    } else {      // Se não há opções, desabilitar chatbot
      await ticket.update({ chatbot: false });
    }

  } else {    
    // Verificar se há sub-opções
    const subOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    if (subOptions.length > 0) {
      // Se o usuário enviou uma mensagem, verificar se corresponde a uma sub-opção
      if (messageBody) {
        const selectedSubOption = subOptions.find((o) => o.option == messageBody);
        if (selectedSubOption) {          await ticket.update({ queueOptionId: selectedSubOption.id });
          
          // Enviar mensagem de confirmação da sub-opção
          const confirmationBody = formatBody(`\u200e${selectedSubOption.message}\n\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
          await SendWhatsAppMessage({ body: confirmationBody, ticket });
          return;
        } else if (messageBody == "#") {
          // Voltar para o menu anterior
          const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
          await ticket.update({ queueOptionId: currentOption?.parentId });
          return;
        }
      }

      // Mostrar sub-opções
      const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
      let options = "";
      subOptions.forEach((option, i) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Voltar ao Menu Principal`;

      const body = formatBody(`\u200e${currentOption?.message || 'Escolha uma opção:'}\n\n${options}`, ticket.contact);      await SendWhatsAppMessage({ body, ticket });
    } else {      // Se não há sub-opções, o chatbot terminou sua função
      // Manter o ticket na fila para atendimento humano
    }
  }
};

const handleRating = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const io = getIO();
  const bodyMessage = getBodyMessage(msg);
  let rate: number | null = null;

  if (bodyMessage) {
    rate = +bodyMessage || null;
  }

  if (!Number.isNaN(rate) && Number.isInteger(rate) && !isNull(rate)) {
    const { complationMessage } = await ShowWhatsAppService(
      ticket.whatsappId,
      ticket.companyId
    );

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

    const body = formatBody(`\u200e${complationMessage}`, ticket.contact);
    await SendWhatsAppMessage({ body, ticket });

    await ticketTraking.update({
      finishedAt: moment().toDate(),
      rated: true,
    });

    setTimeout(async () => {
      await ticket.update({
        queueId: null,
        chatbot: null,
        queueOptionId: null,
        userId: null,
        status: "closed",
      });

      io.to("open").emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

      io.to(ticket.status)
        .to(ticket.id.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id,
        });
    }, 4000);
  }
};

const handleMessage = async (msg: proto.IWebMessageInfo, wbot: Session, companyId: number): Promise<void> => {
  if (!isValidMsg(msg)) return;

  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const bodyMessage = getBodyMessage(msg);

    // Ignorar mensagens do próprio bot ou mensagens com caracteres especiais
    if (msg.key.fromMe) {
      return;
    }

    // Ignorar mensagens que começam com caracteres especiais (mensagens do bot)
    if (bodyMessage && (/\u200e/.test(bodyMessage) || bodyMessage.includes('*[') || bodyMessage.startsWith('‎'))) {
      return;
    }

    msgContact = await getContactMessage(msg, wbot);

    if (isGroup) {
      const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid, false);
      const msgGroupContact = { id: grupoMeta.id, name: grupoMeta.subject };
      groupContact = await verifyContact(msgGroupContact, wbot, companyId);
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    const contact = await verifyContact(msgContact, wbot, companyId);
    const ticket = await FindOrCreateTicketService(contact, wbot.id!, 0, companyId, groupContact);

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

    const hasMedia = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage || msg.message.stickerMessage;

    if (hasMedia) {
      await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }

    // Verificar se precisa mostrar opções de setores (apenas se não tem setor atribuído)
    if (!ticket.queueId && !isGroup && !msg.key.fromMe && !ticket.userId && whatsapp.queues.length >= 1) {
      await verifyQueue(wbot, msg, ticket, contact);
      return; // Importante: retornar aqui para não continuar o processamento
    }

    // Reload ticket to get updated queue information
    await ticket.reload({
      include: [{ model: Queue, as: "queue" }, { model: User, as: "user" }, { model: Contact, as: "contact" }]
    });

    // Handle chatbot logic for queues with options (apenas se tem setor e chatbot ativo)
    if (ticket.queue && ticket.chatbot && !msg.key.fromMe) {
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
  if (stubTypes.includes(msg.messageStubType as WAMessageStubType)) return false;
  return true;
};

const wbotMessageListener = async (wbot: Session, companyId: number): Promise<void> => {
  try {
    wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
      const messages = messageUpsert.messages.filter(filterMessages);
      if (!messages) return;

      for (const message of messages) {
        const messageExists = await Message.count({ where: { id: message.key.id!, companyId } });
        if (!messageExists) {
          await handleMessage(message, wbot, companyId);
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