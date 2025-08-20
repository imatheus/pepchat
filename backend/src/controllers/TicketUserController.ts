import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";
import User from "../models/User";
import TicketUser from "../models/TicketUser";

export const linkUser = async (req: Request, res: Response): Promise<void> => {
  const { ticketId } = req.params as { ticketId: string };
  const { userId } = req.body as { userId: number };
  const { companyId } = req.user;

  if (!userId) throw new AppError("userId é obrigatório", 400);

  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new AppError("ERR_NO_TICKET_FOUND", 404);
  if (ticket.companyId !== companyId) throw new AppError("Acesso negado", 403);

  const user = await User.findByPk(userId);
  if (!user) throw new AppError("Usuário não encontrado", 404);
  if (user.companyId !== companyId) throw new AppError("Usuário de outra empresa", 403);

  // Garantir unicidade
  await TicketUser.findOrCreate({
    where: { ticketId: Number(ticketId), userId },
    defaults: { ticketId: Number(ticketId), userId }
  });

  // Recarregar ticket com usuários vinculados
  await ticket.reload({
    include: [
      { model: User, as: "user", attributes: ["id", "name"] },
      { model: User, as: "users", attributes: ["id", "name"] }
    ]
  });

  const io = getIO();
  io.to(`status:${ticket.status}`)
    .to("notification")
    .to(`ticket:${ticketId}`)
    .to(`company-${companyId}`)
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

  res.status(200).json(ticket);
};

export const unlinkUser = async (req: Request, res: Response): Promise<void> => {
  const { ticketId, userId } = req.params as { ticketId: string; userId: string };
  const { companyId } = req.user;

  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new AppError("ERR_NO_TICKET_FOUND", 404);
  if (ticket.companyId !== companyId) throw new AppError("Acesso negado", 403);

  await TicketUser.destroy({ where: { ticketId: Number(ticketId), userId: Number(userId) } });

  await ticket.reload({ include: [{ model: User, as: "users", attributes: ["id", "name"] }] });

  const io = getIO();
  io.to(`ticket:${ticketId}`).to(`company-${companyId}`).emit(`company-${companyId}-ticket`, {
    action: "update",
    ticket
  });

  res.status(200).json(ticket);
};
