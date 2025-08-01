import { Request, Response } from "express";
import { getWbot, removeWbot } from "../libs/wbot";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import { cacheLayer } from "../libs/cache";

const store = async (req: Request, res: Response): Promise<void> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
  await StartWhatsAppSession(whatsapp);

  res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<void> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const { whatsapp } = await UpdateWhatsAppService({
    whatsappId,
    companyId,
    whatsappData: { session: "" }
  });

  if(whatsapp.channel === "whatsapp") {
    await StartWhatsAppSession(whatsapp);
  }

  res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<void> => {
  console.log("remove");
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { getIO } = require("../libs/socket");
  const io = getIO();

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId );

  if(whatsapp.channel === "whatsapp"){
    try {
      const wbot = getWbot(whatsapp.id);
      wbot.logout();
      wbot.ws.close();
    } catch (err) {
      console.log("Erro ao desconectar wbot:", err);
    }
    
    try {
      // Atualizar status no banco e notificar frontend
      await whatsapp.update({ status: "DISCONNECTED", qrcode: "" });
      
      // Verificar se a instância ainda existe antes de recarregar
      const existingWhatsapp = await ShowWhatsAppService(whatsappId, companyId);
      if (existingWhatsapp) {
        const updatedWhatsapp = await whatsapp.reload();
        
        io.emit(`company-${companyId}-whatsapp`, {
          action: "update",
          whatsapp: updatedWhatsapp
        });
        
        io.emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: updatedWhatsapp
        });
      }
    } catch (error: any) {
      console.log("Erro ao recarregar whatsapp após desconexão:", error.message);
    }
    
    removeWbot(whatsapp.id);
  }

  
  res.status(200).json({ message: "Session disconnected." });
};

export default { store, remove, update };
