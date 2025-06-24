declare module "express" {
  interface Request {
    user?: any;
    userId?: string;
    companyId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      companyId?: string;
    }
  }
}

export {};