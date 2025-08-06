import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { cacheLayer } from "../libs/cache";
import { getIO } from "../libs/socket";
import { getWbot, removeWbot } from "../libs/wbot";
import Whatsapp from "../models/Whatsapp";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";

interface WhatsappData {
  name: string;
  queueIds: number[];
  companyId: number;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
}

interface QueryParams {
  session?: number | string;
}

interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
}

interface Root {
  name: string;
  // eslint-disable-next-line camelcase
  access_token: string;
  // eslint-disable-next-line camelcase
  instagram_business_account: InstagramBusinessAccount;
  id: string;
}

export const index = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const { session } = req.query as QueryParams;
  const whatsapps = await ListWhatsAppsService({ companyId, session });

  res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    token
  }: WhatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    companyId,
    token
  });

  StartWhatsAppSession(whatsapp);

  const io = getIO();
  io.emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  res.status(200).json(whatsapp);
};


export const storeWebChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    name,
    welcomeMessage,
    primaryColor,
    position,
    companyName
  }: {
    name: string;
    welcomeMessage: string;
    primaryColor: string;
    position: string;
    companyName: string;
  } = req.body;
  const { companyId } = req.user;

  try {
    const { whatsapp } = await CreateWhatsAppService({
      name,
      status: "CONNECTED",
      isDefault: false,
      greetingMessage: welcomeMessage,
      complationMessage: "",
      outOfHoursMessage: "",
      queueIds: [],
      companyId,
      channel: "webchat",
      tokenMeta: JSON.stringify({
        primaryColor,
        position,
        companyName,
        welcomeMessage
      })
    });

    const io = getIO();
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp
    });

    res.status(200).json({
      message: "WebChat connection created successfully",
      whatsapp
    });
  } catch (error) {
    console.error("Error creating WebChat:", error);
    res.status(500).json({
      error: "Failed to create WebChat connection"
    });
  }
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { session } = req.query;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId, session);

  res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const io = getIO();

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  console.log(`Removendo conexão: ${whatsapp.name} (ID: ${whatsappId})`);

  if (whatsapp.channel === "whatsapp") {
    try {
      // Tentar desconectar o wbot se existir
      try {
        const wbot = getWbot(+whatsappId);
        if (wbot) {
          wbot.logout();
          wbot.ws.close();
        }
      } catch (err) {
        console.log("Wbot não encontrado ou já desconectado:", err.message);
      }

      // Remover da lista de sessões
      removeWbot(+whatsappId);
      
      // Limpar dados do Baileys
      await DeleteBaileysService(whatsappId);
      
      // Limpar cache
      await cacheLayer.delFromPattern(`sessions:${whatsappId}:*`);
      
      // Deletar do banco
      await DeleteWhatsAppService(whatsappId);

      console.log(`Conexão ${whatsapp.name} removida com sucesso`);

      io.emit(`company-${companyId}-whatsapp`, {
        action: "delete",
        whatsappId: +whatsappId
      });
    } catch (err) {
      console.error(`Erro ao remover conexão ${whatsapp.name}:`, err);
      throw err;
    }
  }

  if (whatsapp.channel === "webchat") {
    await DeleteWhatsAppService(whatsappId);

    console.log(`Conexão ${whatsapp.name} (${whatsapp.channel}) removida com sucesso`);

    io.emit(`company-${companyId}-whatsapp`, {
      action: "delete",
      whatsappId: +whatsappId
    });
  }

  res.status(200).json({ message: "Connection deleted successfully." });
};

// Função auxiliar para criar diretório se não existir
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Upload de arquivos de saudação
export const uploadGreetingMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { whatsappId } = req.params;
    const { companyId } = req.user;
    const files = req.files as Express.Multer.File[];

    console.log(`Upload request for whatsappId: ${whatsappId}, companyId: ${companyId}`);
    console.log(`Files received: ${files ? files.length : 0}`);

    if (!files || files.length === 0) {
      console.log("No files received in upload request");
      res.status(400).json({ error: "Nenhum arquivo enviado" });
      return;
    }

    // Verificar se a conexão existe e pertence à empresa
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    if (!whatsapp) {
      console.log(`WhatsApp connection not found: ${whatsappId}`);
      res.status(404).json({ error: "Conexão não encontrada" });
      return;
    }

    // Criar diretório específico para a conexão
    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const companyDir = path.join(uploadsDir, companyId.toString());
    const connectionsDir = path.join(companyDir, "connections");
    const connectionDir = path.join(connectionsDir, whatsappId);
    
    console.log(`Auto-creating directory structure for first upload: ${connectionDir}`);
    
    // Criar toda a estrutura de diretórios automaticamente se não existir
    ensureDirectoryExists(companyDir);
    ensureDirectoryExists(connectionsDir);
    ensureDirectoryExists(connectionDir);

    const uploadedFiles = [];

    for (const file of files) {
      console.log(`Processing file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
      
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(connectionDir, filename);

      try {
        // Verificar se o arquivo temporário existe
        if (!fs.existsSync(file.path)) {
          console.error(`Temporary file not found: ${file.path}`);
          continue;
        }

        // Mover arquivo do temp para o diretório final
        fs.renameSync(file.path, filePath);
        console.log(`File moved successfully: ${filename}`);

        uploadedFiles.push({
          filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: `/uploads/${companyId}/connections/${whatsappId}/${filename}`
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
      }
    }

    console.log(`Successfully uploaded ${uploadedFiles.length} files`);

    res.status(200).json({
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Erro no upload de arquivos de saudação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar arquivos de saudação
export const listGreetingMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { whatsappId } = req.params;
    const { companyId } = req.user;

    // Verificar se a conexão existe e pertence à empresa
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    if (!whatsapp) {
      res.status(404).json({ error: "Conexão não encontrada" });
      return;
    }

    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const connectionDir = path.join(uploadsDir, companyId.toString(), "connections", whatsappId);

    if (!fs.existsSync(connectionDir)) {
      res.status(200).json({ files: [] });
      return;
    }

    const files = fs.readdirSync(connectionDir);
    const fileList = files.map(filename => {
      const filePath = path.join(connectionDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        path: `/uploads/${companyId}/connections/${whatsappId}/${filename}`
      };
    });

    res.status(200).json({ files: fileList });
  } catch (error) {
    console.error("Erro ao listar arquivos de saudação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Deletar arquivo de saudação
export const deleteGreetingMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { whatsappId, filename } = req.params;
    const { companyId } = req.user;

    // Verificar se a conexão existe e pertence à empresa
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    if (!whatsapp) {
      res.status(404).json({ error: "Conexão não encontrada" });
      return;
    }

    const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadsDir, companyId.toString(), "connections", whatsappId, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Arquivo não encontrado" });
      return;
    }

    fs.unlinkSync(filePath);

    res.status(200).json({ message: "Arquivo removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar arquivo de saudação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};