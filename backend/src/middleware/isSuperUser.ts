import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";

const isSuperUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.user;

  try {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    if (!user.super) {
      throw new AppError("Acesso negado. Apenas super usuários podem acessar esta funcionalidade.", 403);
    }

    return next();
  } catch (err) {
    throw err;
  }
};

export default isSuperUser;