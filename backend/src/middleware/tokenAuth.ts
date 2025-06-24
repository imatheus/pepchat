import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

type HeaderParams = {
  Bearer: string;
};

const tokenAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError("Token de autorização não fornecido. Inclua o header 'Authorization: Bearer SEU_TOKEN'", 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError("Formato do token inválido. Use 'Authorization: Bearer SEU_TOKEN'", 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token.trim() === '') {
      throw new AppError("Token vazio. Forneça um token válido", 401);
    }

    const whatsapp = await Whatsapp.findOne({ where: { token } });
    
    if (!whatsapp) {
      throw new AppError("Token inválido. Verifique o token na seção 'Conexões' do sistema", 401);
    }

    req.params = {
      whatsappId: whatsapp.id.toString()
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("Erro na autenticação do token", 401);
  }

  return next();
};

export default tokenAuth;
