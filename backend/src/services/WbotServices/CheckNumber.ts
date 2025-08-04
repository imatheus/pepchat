import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

const checker = async (number: string, wbot: any) => {
  // Verificar se é um grupo (contém "-" no número) ou conversa individual
  const isGroup = number.includes("-");
  const jid = `${number}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
  
  if (isGroup) {
    // Para grupos, assumir que existe se conseguir obter metadados
    try {
      const groupMetadata = await wbot.groupMetadata(jid);
      return {
        jid: jid,
        exists: true
      };
    } catch (error) {
      return {
        jid: jid,
        exists: false
      };
    }
  } else {
    // Para números individuais, usar onWhatsApp
    const [validNumber] = await wbot.onWhatsApp(jid);
    return validNumber;
  }
};

const CheckContactNumber = async (
  number: string,
  companyId: number
): Promise<IOnWhatsapp> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);
  const isNumberExit = await checker(number, wbot);

  if (!isNumberExit.exists) {
    throw new Error("ERR_CHECK_NUMBER");
  }
  return isNumberExit;
};

export default CheckContactNumber;