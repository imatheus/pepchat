import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import AppError from "../errors/AppError";

import CreateService from "../services/ScheduleServices/CreateService";
import ListService from "../services/ScheduleServices/ListService";
import UpdateService from "../services/ScheduleServices/UpdateService";
import ShowService from "../services/ScheduleServices/ShowService";
import DeleteService from "../services/ScheduleServices/DeleteService";

type IndexQuery = {
  searchParam?: string;
  contactId?: number | string;
  userId?: number | string;
  pageNumber?: string | number;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { contactId, userId, pageNumber, searchParam } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { schedules, count, hasMore } = await ListService({
    searchParam,
    contactId,
    userId,
    pageNumber,
    companyId
  });

  res.json({ schedules, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📝 Creating schedule - Request received:", req.body);
    
    const {
      body,
      sendAt,
      contactId,
      userId
    } = req.body;
    const { companyId } = req.user;

    console.log("📝 Creating schedule - Calling CreateService with:", {
      body: body?.substring(0, 50) + "...",
      sendAt,
      contactId,
      companyId,
      userId
    });

    const schedule = await CreateService({
      body,
      sendAt,
      contactId,
      companyId,
      userId
    });

    console.log("📝 Creating schedule - Schedule created successfully:", schedule.id);

    const io = getIO();
    io.emit("schedule", {
      action: "create",
      schedule
    });

    console.log("📝 Creating schedule - WebSocket event emitted");

    res.status(200).json(schedule);
  } catch (error) {
    console.error("❌ Error creating schedule:", error);
    res.status(400).json({ 
      error: error.message || "Erro ao criar agendamento" 
    });
  }
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { scheduleId } = req.params;
  const { companyId } = req.user;

  const schedule = await ShowService(scheduleId, companyId);

  res.status(200).json(schedule);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("✏️ Updating schedule - Request received:", { scheduleId: req.params.scheduleId, body: req.body });
    
    const { scheduleId } = req.params;
    const scheduleData = req.body;
    const { companyId } = req.user;

    console.log("✏️ Updating schedule - Calling UpdateService");

    const schedule = await UpdateService({ scheduleData, id: scheduleId, companyId });

    console.log("✏️ Updating schedule - Schedule updated successfully:", schedule?.id);

    const io = getIO();
    io.emit("schedule", {
      action: "update",
      schedule
    });

    console.log("✏️ Updating schedule - WebSocket event emitted");

    res.status(200).json(schedule);
  } catch (error) {
    console.error("❌ Error updating schedule:", error);
    res.status(400).json({ 
      error: error.message || "Erro ao atualizar agendamento" 
    });
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("🗑️ Deleting schedule - Request received:", { scheduleId: req.params.scheduleId });
    
    const { scheduleId } = req.params;
    const { companyId } = req.user;

    console.log("🗑️ Deleting schedule - Calling DeleteService");

    await DeleteService(scheduleId, companyId);

    console.log("🗑️ Deleting schedule - Schedule deleted successfully");

    const io = getIO();
    io.emit("schedule", {
      action: "delete",
      scheduleId
    });

    console.log("🗑️ Deleting schedule - WebSocket event emitted");

    res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    console.error("❌ Error deleting schedule:", error);
    res.status(400).json({ 
      error: error.message || "Erro ao excluir agendamento" 
    });
  }
};
