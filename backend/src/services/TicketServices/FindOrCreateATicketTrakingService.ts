import { Op } from "sequelize";
import TicketTraking from "../../models/TicketTraking";

interface Params {
  ticketId: string | number;
  companyId: string | number;
  whatsappId?: string | number;
  userId?: string | number;
  channel?: string;
}

const FindOrCreateATicketTrakingService = async ({
  ticketId,
  companyId,
  whatsappId,
  userId,
  channel
}: Params): Promise<TicketTraking> => {
  const ticketTraking = await TicketTraking.findOne({
    where: {
      ticketId,
      finishedAt: {
        [Op.is]: null
      }
    }
  });

  if (ticketTraking) {
    return ticketTraking;
  }

  const newRecord = await TicketTraking.create({
    ticketId: typeof ticketId === 'string' ? parseInt(ticketId) : ticketId,
    companyId: typeof companyId === 'string' ? parseInt(companyId) : companyId,
    whatsappId: typeof whatsappId === 'string' ? parseInt(whatsappId) : whatsappId,
    userId: typeof userId === 'string' ? parseInt(userId) : userId
  });

  return newRecord;
};

export default FindOrCreateATicketTrakingService;
