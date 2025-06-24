import QueueOption from "../../models/QueueOption";
import ShowService from "./ShowService";

interface QueueData {
  queueId?: string;
  title?: string;
  option?: string;
  message?: string;
  parentId?: string;
}

const UpdateService = async (
  queueOptionId: number | string,
  queueOptionData: QueueData
): Promise<QueueOption> => {

  const queueOption = await ShowService(queueOptionId);

  await queueOption.update({
    ...queueOptionData,
    queueId: typeof queueOptionData.queueId === 'string' ? parseInt(queueOptionData.queueId) : queueOptionData.queueId,
    parentId: queueOptionData.parentId ? parseInt(queueOptionData.parentId) : null
  });

  return queueOption;
};

export default UpdateService;
