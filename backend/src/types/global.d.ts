declare module "express" {
  interface Request {
    user?: any;
    userId?: string;
    companyId?: string;
    company?: {
      id: number;
      name: string;
      status: boolean;
      isInTrial: boolean;
      isExpired: boolean;
      dueDate?: string;
      trialExpiration?: Date;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      companyId?: string;
      company?: {
        id: number;
        name: string;
        status: boolean;
        isInTrial: boolean;
        isExpired: boolean;
        dueDate?: string;
        trialExpiration?: Date;
      };
    }
  }
}

export {};