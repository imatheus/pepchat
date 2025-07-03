import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";

export interface AuthorizedRequest extends Request {
  user: {
    id: string;
    profile: string;
    companyId: number;
  };
}

// Middleware para verificar se o usuário é admin
export const requireAdmin = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { profile } = req.user;
    
    if (profile !== "admin") {
      throw new AppError("Acesso negado. Apenas administradores podem acessar esta funcionalidade.", 403);
    }
    
    next();
  } catch (error) {
    throw error;
  }
};

// Middleware para verificar se o usuário é super usuário
export const requireSuperUser = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.user;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }
    
    if (!user.super) {
      throw new AppError("Acesso negado. Apenas super usuários podem acessar esta funcionalidade.", 403);
    }
    
    next();
  } catch (error) {
    throw error;
  }
};

// Middleware para verificar se o usuário pode acessar recursos da empresa
export const requireSameCompany = (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { companyId } = req.user;
  const requestedCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;
  
  if (requestedCompanyId && parseInt(requestedCompanyId) !== companyId) {
    throw new AppError("Acesso negado. Você só pode acessar recursos da sua empresa.", 403);
  }
  
  next();
};

// Middleware para verificar se o usuário pode modificar outros usuários
export const requireUserPermission = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: requestUserId, profile, companyId } = req.user;
    const { userId } = req.params;
    
    // Super usuários podem modificar qualquer usuário
    const user = await User.findByPk(requestUserId);
    if (user?.super) {
      return next();
    }
    
    // Admins podem modificar usuários da mesma empresa
    if (profile === "admin") {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        throw new AppError("Usuário não encontrado", 404);
      }
      
      if (targetUser.companyId !== companyId) {
        throw new AppError("Acesso negado. Você só pode modificar usuários da sua empresa.", 403);
      }
      
      return next();
    }
    
    // Usuários comuns só podem modificar a si mesmos
    if (requestUserId !== userId) {
      throw new AppError("Acesso negado. Você só pode modificar seu próprio perfil.", 403);
    }
    
    next();
  } catch (error) {
    throw error;
  }
};

// Middleware para verificar permissões baseadas em roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    const { profile } = req.user;
    
    if (!allowedRoles.includes(profile)) {
      throw new AppError(`Acesso negado. Perfis permitidos: ${allowedRoles.join(", ")}`, 403);
    }
    
    next();
  };
};