import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import Ticket from "../models/Ticket";
import AppError from "../errors/AppError";

import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import ShowTicketUUIDService from "../services/TicketServices/ShowTicketFromUUIDService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  status: string;
  date: string;
  updatedAt?: string;
  showAll: string;
  withUnreadMessages: string;
  queueIds: string;
  tags: string;
  users: string;
};

interface TicketData {
  contactId: number;
  status: string;
  queueId: number;
  userId: number;
  justClose: boolean;
}

export const index = async (req: Request, res: Response): Promise<void> => {
  const {
    pageNumber,
    status,
    date,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages
  } = req.query as IndexQuery;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, count, hasMore } = await ListTicketsService({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    updatedAt,
    showAll,
    userId,
    queueIds,
    withUnreadMessages,
    companyId
  });

  res.status(200).json({ tickets, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const { contactId, status, userId, queueId }: TicketData = req.body;
  const { companyId } = req.user;

  const ticket = await CreateTicketService({
    contactId,
    status,
    userId,
    companyId,
    queueId
  });

  const io = getIO();
  io.to(ticket.status).emit(`company-${companyId}-ticket`, {
    action: "update",
    ticket
  });

  res.status(200).json(ticket);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowTicketService(ticketId, companyId);

  res.status(200).json(contact);
};

export const showFromUUID = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid } = req.params;

  const ticket: Ticket = await ShowTicketUUIDService(uuid);

  res.status(200).json(ticket);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const ticketData: TicketData = req.body;
    const { companyId } = req.user;

    const result = await UpdateTicketService({
      ticketData,
      ticketId,
      companyId
    });

    // Check if result exists and has ticket property
    if (!result || !result.ticket) {
      res.status(400).json({ error: "Failed to update ticket" });
    }

    const { ticket } = result;
    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    
    // Handle AppError instances with their specific status code and message
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message
      });
    }
    
    // Handle other errors as internal server errors
    res.status(500).json({ 
      error: "Internal server error", 
      message: error.message || "Failed to update ticket"
    });
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  await ShowTicketService(ticketId, companyId);

  const ticket = await DeleteTicketService(ticketId);

  const io = getIO();
  io.to(ticket.status)
    .to(ticketId)
    .to("notification")
    .emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticketId: +ticketId
    });

  res.status(200).json({ message: "ticket deleted" });
};
