import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CheckSettingsHelper from "../helpers/CheckSettings";
import AppError from "../errors/AppError";
import { PermissionHelper } from "../helpers/PermissionHelper";
import { ValidationHelper } from "../helpers/ValidationHelper";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type ListQueryParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const {
    email,
    password,
    name,
    profile,
    companyId: bodyCompanyId,
    queueIds,
    profileImage
  } = req.body;
  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (
    req.url === "/signup" &&
    (await CheckSettingsHelper("userCreation")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    companyId: bodyCompanyId || userCompanyId,
    queueIds,
    profileImage
  });

  const io = getIO();
  io.emit(`company-${userCompanyId}-user`, {
    action: "create",
    user
  });

  res.status(200).json(user);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await ShowUserService(userId);

  res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: requestUserId, companyId, profile } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  // Verificar permissões usando o helper
  await PermissionHelper.requireUserPermission(
    { id: requestUserId, profile, companyId },
    userId
  );

  // Sanitizar dados de entrada
  const sanitizedData = ValidationHelper.sanitizeUserData(userData);

  const user = await UpdateUserService({
    userData: sanitizedData,
    userId,
    companyId,
    requestUserId: +requestUserId
  });

  const io = getIO();
  io.emit(`company-${companyId}-user`, {
    action: "update",
    user
  });

  res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const { companyId, profile, id: requestUserId } = req.user;

  // Verificar permissões usando o helper
  await PermissionHelper.requireUserPermission(
    { id: requestUserId, profile, companyId },
    userId
  );

  await DeleteUserService(userId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-user`, {
    action: "delete",
    userId
  });

  res.status(200).json({ message: "User deleted" });
};

export const list = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  res.status(200).json(users);
};