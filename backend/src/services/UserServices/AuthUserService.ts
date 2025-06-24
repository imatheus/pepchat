import User from "../../models/User";
import AppError from "../../errors/AppError";
import moment from "moment";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import Plan from "../../models/Plan";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
  companyId: number;
  company?: {
    id: number;
    name: string;
    status: boolean;
    isInTrial: boolean;
    isExpired: boolean;
    dueDate?: string;
    trialExpiration?: Date;
    plan?: any; // Informações do plano
  };
}

interface Request {
  email: string;
  password: string;
}

interface Response {
  serializedUser: SerializedUser;
  token: string;
  refreshToken: string;
}

const AuthUserService = async ({
  email,
  password
}: Request): Promise<Response> => {
  const user = await User.findOne({
    where: { email },
    include: [
      "queues", 
      { 
        model: Company, 
        include: [
          { model: Setting },
          { model: Plan, as: "plan" }
        ] 
      }
    ]
  });

  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (!(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  // Verificar status da empresa para informar no login
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

  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const serializedUser = await SerializeUser(user);
  
  // Sobrescrever informações da empresa com status atualizado
  (serializedUser as any).company = companyStatus;

  return {
    serializedUser: serializedUser as any,
    token,
    refreshToken
  };
};

export default AuthUserService;
