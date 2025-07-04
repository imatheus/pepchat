import { initWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";

export const StartWhatsAppSession = async (whatsapp: Whatsapp): Promise<void> => {
  const io = getIO();
  
  try {
    await whatsapp.update({ status: "OPENING", qrcode: "" });
    
    // Verificar se a instância ainda existe antes de recarregar
    const existingWhatsapp = await Whatsapp.findByPk(whatsapp.id);
    if (!existingWhatsapp) {
      console.log(`Whatsapp ${whatsapp.id} não existe mais no banco de dados`);
      return;
    }
    
    // Notificar frontend sobre o início da sessão
    const updatedWhatsapp = await whatsapp.reload();
    io.emit(`company-${whatsapp.companyId}-whatsapp`, {
      action: "update",
      whatsapp: updatedWhatsapp
    });
    
    await initWbot(whatsapp);
  } catch (err: any) {
    console.log("Erro ao inicializar wbot:", err);
    
    try {
      // Verificar se a instância ainda existe antes de atualizar
      const existingWhatsapp = await Whatsapp.findByPk(whatsapp.id);
      if (existingWhatsapp) {
        // Em caso de erro, atualizar status para DISCONNECTED
        await whatsapp.update({ status: "DISCONNECTED", qrcode: "" });
        const errorWhatsapp = await whatsapp.reload();
        io.emit(`company-${whatsapp.companyId}-whatsapp`, {
          action: "update",
          whatsapp: errorWhatsapp
        });
      }
    } catch (reloadError: any) {
      console.log("Erro ao recarregar whatsapp após falha:", reloadError.message);
    }
  }
};