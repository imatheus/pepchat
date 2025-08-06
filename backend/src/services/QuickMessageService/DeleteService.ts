import QuickMessage from "../../models/QuickMessage";
import AppError from "../../errors/AppError";
import UploadHelper from "../../helpers/UploadHelper";

const DeleteService = async (id: string): Promise<void> => {
  const record = await QuickMessage.findOne({
    where: { id }
  });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  // Deletar arquivo de mídia se existir
  if (record.mediaPath) {
    UploadHelper.deleteFile(record.mediaPath);
  }

  await record.destroy();
};

export default DeleteService;
