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
      // Clear cookie with proper options
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
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    // Verificar status da empresa para informar no refresh
    const company = user.company;
    
    // Usar plano personalizado se disponível, senão usar plano base
    let activePlan = company.plan;
    if (company.companyPlans && company.companyPlans.length > 0) {
      const companyPlan = company.companyPlans[0];
      activePlan = {
        id: companyPlan.id,
        name: companyPlan.name,
        users: companyPlan.users,
        connections: companyPlan.connections,
        queues: companyPlan.queues,
        value: companyPlan.pricePerUser,
        useWhatsapp: companyPlan.useWhatsapp,
                useCampaigns: companyPlan.useCampaigns
      } as any;
    }
    
    let companyStatus = {
      id: company.id,
      name: company.name,
      status: company.status,
      isInTrial: false,
      isExpired: false,
      dueDate: company.dueDate,
      trialExpiration: company.trialExpiration,
      plan: activePlan
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
    // Clear cookie with proper options
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
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
};
