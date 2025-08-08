import * as Yup from "yup";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { getIO } from "../libs/socket";

import ListService from "../services/QuickMessageService/ListService";
import CreateService from "../services/QuickMessageService/CreateService";
import ShowService from "../services/QuickMessageService/ShowService";
import UpdateService from "../services/QuickMessageService/UpdateService";
import DeleteService from "../services/QuickMessageService/DeleteService";
import FindService from "../services/QuickMessageService/FindService";

import QuickMessage from "../models/QuickMessage";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import { getWbot } from "../libs/wbot";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CreateMessageService from "../services/MessageServices/CreateMessageService";
import UploadHelper from "../helpers/UploadHelper";
import formatBody from "../helpers/Mustache";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  userId: string | number;
};

type StoreData = {
  shortcode: string;
  message: string;
  userId: number | number;
};

type FindParams = {
  companyId: string;
  userId: string;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber, userId } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    userId
  });

  res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateService({
    ...data,
    companyId,
    userId: req.user.id
  });

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "create",
    record
  });

  res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const record = await ShowService(id);

  res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = req.body as StoreData;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    userId: req.user.id,
    id,
  });

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "update",
    record
  });

  res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "delete",
    id
  });

  res.status(200).json({ message: "Contact deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query as FindParams;
  const { companyId } = req.user;
  const records: QuickMessage[] = await FindService({ companyId, userId });

  res.status(200).json(records);
};

// Função auxiliar para criar diretório se não existir
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Upload de arquivos de mensagens rápidas
export const uploadMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: quickMessageId } = req.params;
    const { companyId } = req.user;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: "Nenhum arquivo enviado" });
      return;
    }

    // Verificar se a mensagem rápida existe e pertence à empresa
    const quickMessage = await ShowService(quickMessageId);
    if (!quickMessage || quickMessage.companyId !== companyId) {
      res.status(404).json({ error: "Mensagem rápida não encontrada" });
      return;
    }

    // Criar diretório específico para a mensagem rápida
    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const companyDir = path.join(uploadsDir, companyId.toString());
    const quickMessagesDir = path.join(companyDir, "quick-messages");
    const messageDir = path.join(quickMessagesDir, quickMessageId);
    
    // Criar toda a estrutura de diretórios automaticamente se não existir
    ensureDirectoryExists(companyDir);
    ensureDirectoryExists(quickMessagesDir);
    ensureDirectoryExists(messageDir);

    const uploadedFiles = [];

    for (const file of files) {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(messageDir, filename);

      try {
        // Verificar se o arquivo temporário existe
        if (!fs.existsSync(file.path)) {
          continue;
        }

        // Mover arquivo do temp para o diretório final
        fs.renameSync(file.path, filePath);

        uploadedFiles.push({
          filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: `/uploads/${companyId}/quick-messages/${quickMessageId}/${filename}`
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
      }
    }

    res.status(200).json({
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Erro no upload de arquivos da mensagem rápida:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar arquivos de mensagens rápidas
export const listMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: quickMessageId } = req.params;
    const { companyId } = req.user;

    // Verificar se a mensagem rápida existe e pertence à empresa
    const quickMessage = await ShowService(quickMessageId);
    if (!quickMessage || quickMessage.companyId !== companyId) {
      res.status(404).json({ error: "Mensagem rápida não encontrada" });
      return;
    }

    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const messageDir = path.join(uploadsDir, companyId.toString(), "quick-messages", quickMessageId);

    if (!fs.existsSync(messageDir)) {
      res.status(200).json({ files: [] });
      return;
    }

    const files = fs.readdirSync(messageDir);
    const fileList = files.map(filename => {
      const filePath = path.join(messageDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        path: `/uploads/${companyId}/quick-messages/${quickMessageId}/${filename}`
      };
    });

    res.status(200).json({ files: fileList });
  } catch (error) {
    console.error("Erro ao listar arquivos da mensagem rápida:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Deletar arquivo de mensagem rápida
export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: quickMessageId, filename } = req.params;
    const { companyId } = req.user;

    // Verificar se a mensagem rápida existe e pertence à empresa
    const quickMessage = await ShowService(quickMessageId);
    if (!quickMessage || quickMessage.companyId !== companyId) {
      res.status(404).json({ error: "Mensagem rápida não encontrada" });
      return;
    }

    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsDir, companyId.toString(), "quick-messages", quickMessageId, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Arquivo não encontrado" });
      return;
    }

    fs.unlinkSync(filePath);

    res.status(200).json({ message: "Arquivo removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar arquivo da mensagem rápida:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Enviar mensagem rápida com arquivos
export const sendQuickMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { quickMessageId, ticketId } = req.body;
    const { companyId } = req.user;

    if (!quickMessageId || !ticketId) {
      res.status(400).json({ error: "quickMessageId e ticketId são obrigatórios" });
      return;
    }

    // Buscar a mensagem rápida
    const quickMessage = await ShowService(quickMessageId);
    if (!quickMessage || quickMessage.companyId !== companyId) {
      res.status(404).json({ error: "Mensagem rápida não encontrada" });
      return;
    }

    // Buscar o ticket
    const ticket = await Ticket.findByPk(ticketId, {
      include: [{ model: Contact, as: "contact" }]
    });

    if (!ticket || ticket.companyId !== companyId) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    // Obter instância do bot
    const wbot = getWbot(ticket.whatsappId);
    if (!wbot) {
      res.status(400).json({ error: "WhatsApp não conectado" });
      return;
    }

    // Enviar mensagem de texto se houver
    if (quickMessage.message && quickMessage.message.trim() !== "") {
      const formattedMessage = formatBody(quickMessage.message, ticket.contact);
      await SendWhatsAppMessage({ body: formattedMessage, ticket });
    }

    // Buscar e enviar arquivos se existirem
    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const messageDir = path.join(uploadsDir, companyId.toString(), "quick-messages", quickMessageId.toString());
    
    if (fs.existsSync(messageDir)) {
      const files = fs.readdirSync(messageDir);
      
      if (files.length > 0) {
        for (const filename of files) {
          try {
            const filePath = path.join(messageDir, filename);
            const stats = fs.statSync(filePath);
            
            // Determinar mimetype baseado na extensão
            const ext = path.extname(filename).toLowerCase();
            let mimetype = "application/octet-stream";
            
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
              mimetype = `image/${ext.substring(1)}`;
            } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
              mimetype = `video/${ext.substring(1)}`;
            } else if (['.pdf'].includes(ext)) {
              mimetype = 'application/pdf';
            } else if (['.doc', '.docx'].includes(ext)) {
              mimetype = 'application/msword';
            }

            // Construir o JID corretamente
            const isGroup = ticket.contact.isGroup || ticket.contact.number.includes("-") || ticket.contact.number.endsWith("@g.us");
            let jid: string;
            
            if (ticket.contact.number.includes("@")) {
              jid = ticket.contact.number;
            } else {
              jid = `${ticket.contact.number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
            }

            const fileBuffer = fs.readFileSync(filePath);
            let sentMessage: any;
            
            if (mimetype.startsWith('image/')) {
              sentMessage = await wbot.sendMessage(jid, {
                image: fileBuffer,
                caption: ""
              });
            } else if (mimetype.startsWith('video/')) {
              sentMessage = await wbot.sendMessage(jid, {
                video: fileBuffer,
                caption: "",
                mimetype: mimetype
              });
            } else {
              sentMessage = await wbot.sendMessage(jid, {
                document: fileBuffer,
                fileName: filename,
                mimetype: mimetype
              });
            }

            // Salvar arquivo no diretório organizado
            const fileName = UploadHelper.generateFileName(filename);
            const uploadConfig = {
              companyId: ticket.companyId,
              category: 'chat' as const,
              ticketId: ticket.id
            };

            let mediaPath: string;
            try {
              mediaPath = await UploadHelper.saveBuffer(fileBuffer, uploadConfig, fileName);
            } catch (err) {
              mediaPath = filename;
            }

            // Criar registro da mensagem no banco de dados
            const mediaType = mimetype.split("/")[0];
            const messageData = {
              id: sentMessage.key.id,
              ticketId: ticket.id,
              contactId: undefined,
              body: "",
              fromMe: true,
              read: true,
              mediaType: mediaType,
              mediaUrl: mediaPath,
              ack: 1,
              dataJson: JSON.stringify(sentMessage)
            };

            const lastMessageText = mediaType === 'image' ? '📷 Imagem' : 
                                   mediaType === 'video' ? '🎥 Vídeo' : 
                                   mediaType === 'audio' ? '🎵 Áudio' : 
                                   '📄 Documento';
            await ticket.update({ lastMessage: lastMessageText });

            await CreateMessageService({ 
              messageData, 
              companyId: ticket.companyId 
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (fileError) {
            console.error(`Error sending quick message file: ${filename}`, fileError);
          }
        }
      }
    }

    res.status(200).json({ 
      message: "Mensagem rápida enviada com sucesso",
      quickMessage: quickMessage.message,
      filesCount: fs.existsSync(messageDir) ? fs.readdirSync(messageDir).length : 0
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem rápida:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};