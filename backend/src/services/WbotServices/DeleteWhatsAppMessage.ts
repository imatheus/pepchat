import { WASocket } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import Message from "../../models/Message";

const DeleteWhatsAppMessage = async (
  messageId: string,
  whatsappId: number
): Promise<Message> => {
  const wbot = getWbot(whatsappId);
  
  // Get message from database
  const message = await Message.findByPk(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  try {
    // Parse the dataJson to get the original message data
    const messageData = JSON.parse(message.dataJson);
    
    // Try to delete the message from WhatsApp
    await wbot.sendMessage(messageData.key.remoteJid, {
      delete: messageData.key
    });
    
    // Mark message as deleted in database
    await message.update({ isDeleted: true });
    
  } catch (error) {
    console.log("Error deleting WhatsApp message:", error);
    // Still mark as deleted in database even if WhatsApp deletion fails
    await message.update({ isDeleted: true });
  }

  return message;
};

export default DeleteWhatsAppMessage;