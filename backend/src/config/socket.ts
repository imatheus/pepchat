import { ServerOptions } from "socket.io";
import { ServerOptions as EngineOptions } from "engine.io";

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const forcePolling = process.env.SOCKET_FORCE_POLLING === 'true';

export const socketConfig: Partial<ServerOptions & EngineOptions> = {
  transports: forcePolling ? ["polling"] : ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  allowEIO3: true,
  // Desabilitar upgrade quando forçar polling para evitar erros de probe no navegador
  allowUpgrades: !forcePolling,
  upgradeTimeout: 8000,
  // Aumentar limite de payload do Socket.IO para evitar queda em tickets com mensagens grandes
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
  perMessageDeflate: { threshold: 16 * 1024 }, // comprimir somente mensagens >16KB
  cors: {
    origin: process.env.FRONTEND_URL ? 
      (Array.isArray(process.env.FRONTEND_URL) ? 
        process.env.FRONTEND_URL : 
        [process.env.FRONTEND_URL]) : 
      (isDevelopment ? ["http://localhost:3000"] : ["https://app.pepchat.com.br"]),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  },
};

export const socketEvents = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_CHAT_BOX: 'joinChatBox',
  JOIN_NOTIFICATION: 'joinNotification',
  JOIN_TICKETS: 'joinTickets',
  TYPING: 'typing',
  USER_STATUS: 'userStatus',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
} as const;

export const socketRooms = {
  user: (userId: string) => `user:${userId}`,
  company: (companyId: string) => `company:${companyId}`,
  ticket: (ticketId: string) => `ticket:${ticketId}`,
  status: (status: string) => `status:${status}`,
  notification: () => 'notification',
} as const;

export const socketEmissions = {
  ticket: (companyId: string) => `company-${companyId}-ticket`,
  message: (companyId: string) => `company-${companyId}-appMessage`,
  contact: (companyId: string) => `company-${companyId}-contact`,
  userStatus: (companyId: string) => `company-${companyId}-userStatus`,
  userStatusBatch: (companyId: string) => `company-${companyId}-userStatus-batch`,
  typing: (companyId: string) => `company-${companyId}-typing`,
  whatsapp: (companyId: string) => `company-${companyId}-whatsapp`,
  whatsappSession: (companyId: string) => `company-${companyId}-whatsappSession`,
  queue: (companyId: string) => `company-${companyId}-queue`,
  settings: (companyId: string) => `company-${companyId}-settings`,
  auth: (companyId: string) => `company-${companyId}-auth`,
  statusUpdated: (companyId: string) => `company-${companyId}-status-updated`,
  campaign: (companyId: string) => `company-${companyId}-campaign`,
  quickMessage: (companyId: string) => `company-${companyId}-quickmessage`,
  help: (companyId: string) => `company-${companyId}-help`,
  user: (companyId: string) => `company-${companyId}-user`,
  chat: (companyId: string) => `company-${companyId}-chat`,
  contactList: (companyId: string) => `company-${companyId}-ContactList`,
  contactListItem: (companyId: string) => `company-${companyId}-ContactListItem`,
  invoicePaid: (companyId: string) => `company-${companyId}-invoice-paid`,
  invoiceUpdated: (companyId: string) => `company-${companyId}-invoice-updated`,
  dueDateUpdated: (companyId: string) => `company-${companyId}-due-date-updated`,
  importProgress: (companyId: string, contactListId: string) => `company-${companyId}-import-progress-${contactListId}`,
} as const;