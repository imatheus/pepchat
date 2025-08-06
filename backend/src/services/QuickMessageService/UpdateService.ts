import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";

interface Data {
  shortcode: string;
  message: string;
  userId: number | string;
  id?: number | string;
  mediaPath?: string;
  mediaType?: string;
  mediaName?: string;
}

const UpdateService = async (data: Data): Promise<QuickMessage> => {
  const { id, shortcode, message, userId, mediaPath, mediaType, mediaName } = data;

  const record = await QuickMessage.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_TICKETNOTE_FOUND", 404);
  }

  const updateData: any = {
    shortcode,
    message,
    userId: typeof userId === 'string' ? parseInt(userId) : userId
  };

  // Só atualizar campos de mídia se foram fornecidos
  if (mediaPath !== undefined) updateData.mediaPath = mediaPath;
  if (mediaType !== undefined) updateData.mediaType = mediaType;
  if (mediaName !== undefined) updateData.mediaName = mediaName;

  await record.update(updateData);

  return record;
};

export default UpdateService;
