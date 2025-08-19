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
    const {
      body,
      sendAt,
      contactId,
      userId
    } = req.body;
    const { companyId } = req.user;

    const schedule = await CreateService({
      body,
      sendAt,
      contactId,
      companyId,
      userId
    });

    // Garantir que as associações estejam presentes na emissão e resposta
    const fullSchedule = await ShowService(schedule.id, companyId);

    const io = getIO();
    io.emit("schedule", {
      action: "create",
      schedule: fullSchedule
    });

    res.status(200).json(fullSchedule);
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
  // Garantir que venha com profilePicUrl
  const fullSchedule = await ShowService(schedule.id, companyId);
  res.status(200).json(fullSchedule);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    const scheduleData = req.body;
    const { companyId } = req.user;

    const schedule = await UpdateService({ scheduleData, id: scheduleId, companyId });

    // Recarregar com associações para emissão e resposta consistentes
    const fullSchedule = await ShowService(schedule.id, companyId);

    const io = getIO();
    io.emit("schedule", {
      action: "update",
      schedule: fullSchedule
    });

    res.status(200).json(fullSchedule);
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
    const { scheduleId } = req.params;
    const { companyId } = req.user;

    await DeleteService(scheduleId, companyId);

    const io = getIO();
    io.emit("schedule", {
      action: "delete",
      scheduleId
    });

    res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    console.error("❌ Error deleting schedule:", error);
    res.status(400).json({ 
      error: error.message || "Erro ao excluir agendamento" 
    });
  }
};
