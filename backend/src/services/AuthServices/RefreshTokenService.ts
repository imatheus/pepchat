import { verify } from "jsonwebtoken";
import { Response as Res } from "express";
import moment from "moment";

import User from "../../models/User";
import AppError from "../../errors/AppError";
import ShowUserService from "../UserServices/ShowUserService";
import authConfig from "../../config/auth";
import { SerializeUser } from "../../helpers/SerializeUser";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";

interface RefreshTokenPayload {
  id: string;
  tokenVersion: number;
  companyId: number;
}

interface Response {
  user: any; // SerializedUser com informações da empresa
  newToken: string;
  refreshToken: string;
}

export const RefreshTokenService = async (
  res: Res,
  token: string
): Promise<Response> => {
  try {
    const decoded = verify(token, authConfig.refreshSecret);
    const { id, tokenVersion, companyId } = decoded as RefreshTokenPayload;

    const user = await ShowUserService(id);

    if (user.tokenVersion !== tokenVersion) {
      res.clearCookie("jrt");
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    // Verificar status da empresa para informar no refresh
    const company = user.company;
    let companyStatus = {
      id: company.id,
      name: company.name,
      status: company.status,
      isInTrial: false,
      isExpired: false,
      dueDate: company.dueDate,
      trialExpiration: company.trialExpiration,
      plan: company.plan // Manter informações do plano
    };

    if (company) {
      const now = moment();
      
      // Verificar período de avaliação
      if (company.trialExpiration) {
        const trialExpiration = moment(company.trialExpiration);
        companyStatus.isInTrial = trialExpiration.isAfter(now);
      }

      // Verificar data de vencimento
      if (company.dueDate && !companyStatus.isInTrial) {
        const dueDate = moment(company.dueDate);
        companyStatus.isExpired = dueDate.isBefore(now);
      }
    }

    const serializedUser = await SerializeUser(user);
    serializedUser.company = companyStatus;

    const newToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return { user: serializedUser, newToken, refreshToken };
  } catch (err) {
    res.clearCookie("jrt");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
};
