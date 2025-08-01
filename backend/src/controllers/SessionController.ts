import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

import AuthUserService from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import FindUserFromToken from "../services/AuthServices/FindUserFromToken";
import User from "../models/User";

export const store = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password
  });

  SendRefreshToken(res, refreshToken);

  const io = getIO();
  io.emit(`company-${serializedUser.companyId}-auth`, {
    action: "update",
    user: {
      id: serializedUser.id,
      email: serializedUser.email,
      companyId: serializedUser.companyId
    }
  });

  res.status(200).json({
    token,
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    // Log para debug em produção
    console.warn("Refresh token cookie not found. Cookies available:", Object.keys(req.cookies));
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);

  res.json({ token: newToken, user });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const token: string = req.cookies.jrt;
  const user = await FindUserFromToken(token);
  const { id, profile, super: superAdmin } = user;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  res.json({ id, profile, super: superAdmin });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.user;
  const user = await User.findByPk(id);
  await user.update({ online: false });

  // Clear cookie with same options as when it was set
  const isProduction = process.env.NODE_ENV === "production";
  
  // Configure domain for cookie clearing - use dot notation for subdomain compatibility
  let cookieDomain = undefined;
  if (isProduction && process.env.COOKIE_DOMAIN) {
    cookieDomain = process.env.COOKIE_DOMAIN.startsWith('.') 
      ? process.env.COOKIE_DOMAIN 
      : `.${process.env.COOKIE_DOMAIN}`;
  }
  
  res.clearCookie("jrt", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "lax" : "lax",
    path: "/",
    ...(cookieDomain && { domain: cookieDomain })
  });

  res.send();
};
