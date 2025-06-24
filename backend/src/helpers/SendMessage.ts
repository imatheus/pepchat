import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import fs from "fs";
import path from "path";

export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
};

const getMessageOptions = async (body: string, mediaPath: string) => {
  const mimeType = require('mime-types').lookup(mediaPath);
  const mediaType = mimeType ? mimeType.split("/")[0] : "document";
  
  switch (mediaType) {
    case "image":
      return {
        image: { url: mediaPath },
        caption: body
      };
    case "video":
      return {
        video: { url: mediaPath },
        caption: body
      };
    case "audio":
      return {
        audio: { url: mediaPath },
        mimetype: mimeType
      };
    default:
      return {
        document: { url: mediaPath },
        mimetype: mimeType,
        fileName: path.basename(mediaPath)
      };
  }
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<any> => {
  try {
    const wbot = await GetWhatsappWbot(whatsapp);
    const chatId = `${messageData.number}@s.whatsapp.net`;

    let message;

    if (messageData.mediaPath) {
      const options = await getMessageOptions(
        messageData.body,
        messageData.mediaPath
      );
      if (options) {
        message = await wbot.sendMessage(chatId, {
          ...options
        });
      }
    } else {
      const body = `\u200e${messageData.body}`;
      message = await wbot.sendMessage(chatId, { text: body });
    }

    return message;
  } catch (err: any) {
    throw new Error(err);
  }
};
