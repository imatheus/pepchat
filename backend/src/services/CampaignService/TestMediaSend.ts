import fs from "fs";
import path from "path";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

interface TestRequest {
  whatsappId: number;
  number: string;
  mediaPath: string;
  mediaName: string;
  message?: string;
}

const TestMediaSend = async ({
  whatsappId,
  number,
  mediaPath,
  mediaName,
  message = "Teste de envio de mídia"
}: TestRequest): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info(`Testing media send - WhatsApp: ${whatsappId}, Number: ${number}, Media: ${mediaPath}`);

    // Obter bot do WhatsApp
    const wbot = getWbot(whatsappId);
    if (!wbot) {
      throw new Error("WhatsApp bot not found");
    }

    // Verificar caminho do arquivo (uploads/companyId/campaigns/filename)
    const fullMediaPath = path.resolve("uploads", mediaPath);
    logger.info(`Full media path: ${fullMediaPath}`);

    if (!fs.existsSync(fullMediaPath)) {
      throw new Error(`Media file not found: ${fullMediaPath}`);
    }

    const stats = fs.statSync(fullMediaPath);
    logger.info(`Media file stats - Size: ${stats.size} bytes`);

    // Formatar número
    const formattedNumber = number.includes("@") 
      ? number 
      : `${number}@s.whatsapp.net`;

    // Determinar tipo de mídia
    const extension = path.extname(mediaName).toLowerCase();
    let mimetype = "application/pdf";
    
    if (extension === '.pdf') {
      mimetype = "application/pdf";
    } else if (['.jpg', '.jpeg'].includes(extension)) {
      mimetype = "image/jpeg";
    } else if (extension === '.png') {
      mimetype = "image/png";
    }

    // Ler arquivo
    const mediaBuffer = fs.readFileSync(fullMediaPath);
    logger.info(`Media buffer size: ${mediaBuffer.length} bytes`);

    // Preparar mensagem
    const messageContent = {
      document: mediaBuffer,
      fileName: mediaName,
      mimetype: mimetype,
      caption: message
    };

    logger.info(`Sending test message to ${formattedNumber}`);

    // Enviar mensagem
    const result = await wbot.sendMessage(formattedNumber, messageContent);
    
    logger.info(`Test message sent successfully:`, result.key);

    return { success: true };

  } catch (error) {
    logger.error(`Error in test media send:`, error);
    return { success: false, error: error.message };
  }
};

export default TestMediaSend;