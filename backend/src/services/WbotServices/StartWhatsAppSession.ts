import { initWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";

export const StartWhatsAppSession = async (whatsapp: Whatsapp): Promise<void> => {
  const io = getIO();
  
  await whatsapp.update({ status: "OPENING", qrcode: "" });
  
  // Notificar frontend sobre o início da sessão
  const updatedWhatsapp = await whatsapp.reload();
  io.emit(`company-${whatsapp.companyId}-whatsapp`, {
    action: "update",
    whatsapp: updatedWhatsapp
  });
  
  try {
    await initWbot(whatsapp);
  } catch (err) {
    console.log("Erro ao inicializar wbot:", err);
    // Em caso de erro, atualizar status para DISCONNECTED
    await whatsapp.update({ status: "DISCONNECTED", qrcode: "" });
    const errorWhatsapp = await whatsapp.reload();
    io.emit(`company-${whatsapp.companyId}-whatsapp`, {
      action: "update",
      whatsapp: errorWhatsapp
    });
  }
};