import { initWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";

export const StartWhatsAppSession = async (whatsapp: Whatsapp): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });
  try {
    await initWbot(whatsapp);
  } catch (err) {
    console.log(err);
  }
};