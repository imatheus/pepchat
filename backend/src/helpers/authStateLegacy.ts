import {
  BufferJSON,
  AuthenticationCreds,
  initAuthCreds
} from "@whiskeysockets/baileys";
import Whatsapp from "../models/Whatsapp";

// Support legacy sessions that might contain encKey/macKey fields
// even though modern Baileys uses AuthenticationCreds structure.
// We keep the fields optional and normalize if present.
export const authStateLegacy = async (whatsapp: Whatsapp) => {
  const updateWhatsappData = await Whatsapp.findOne({
    where: {
      id: whatsapp.id
    }
  });

  type LegacyLikeCreds = AuthenticationCreds & {
    encKey?: any;
    macKey?: any;
  };

  let state: LegacyLikeCreds;
  if (updateWhatsappData?.session) {
    state = JSON.parse(updateWhatsappData.session, BufferJSON.reviver);

    // Normalize potential legacy fields if they are base64 strings
    if (state && typeof (state as any).encKey === "string") {
      (state as any).encKey = Buffer.from((state as any).encKey, "base64");
    }

    if (state && typeof (state as any).macKey === "string") {
      (state as any).macKey = Buffer.from((state as any).macKey, "base64");
    }
  } else {
    state = initAuthCreds();
  }

  return {
    state,
    saveState: async () => {
      const str = JSON.stringify(state, BufferJSON.replacer, 2);
      await whatsapp.update({
        session: str
      });
    }
  };
};

export default authStateLegacy;
