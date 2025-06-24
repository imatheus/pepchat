declare namespace Express {
  export interface Request {
    user: { id: string; profile: string; companyId: number };
    company?: {
      id: number;
      name: string;
      status: boolean;
      isInTrial: boolean;
      isExpired: boolean;
      dueDate?: string;
      trialExpiration?: Date;
      plan?: any;
    };
  }
}