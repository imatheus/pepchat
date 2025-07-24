import { Op, fn, where, col, Filterable, Includeable } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import { intersection } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import Setting from "../../models/Setting";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  date?: string;
  updatedAt?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  queueIds: (number | string)[];
  tags: number[];
  users: number[];
  companyId: number;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  tags,
  users,
  status,
  date,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  companyId
}: Request): Promise<Response> => {
  // Separar queueIds numéricos de "no-queue"
  const numericQueueIds = queueIds.filter(id => typeof id === 'number' || (typeof id === 'string' && id !== 'no-queue')).map(id => Number(id));
  const includeNoQueue = queueIds.includes('no-queue');
  
  // Construir condição de queue baseada na presença de "no-queue"
  let queueCondition;
  if (includeNoQueue && numericQueueIds.length > 0) {
    queueCondition = { 
      [Op.or]: [
        { [Op.in]: numericQueueIds }, 
        { [Op.is]: null }
      ] 
    };
  } else if (includeNoQueue) {
    queueCondition = { [Op.is]: null };
  } else if (numericQueueIds.length > 0) {
    queueCondition = { [Op.in]: numericQueueIds };
  } else {
    queueCondition = null;
  }

  // Buscar informações do usuário para verificar suas filas
  const user = await ShowUserService(userId);
  const userQueueIds = user.queues?.map(queue => queue.id) || [];
  
  // Verificar se o chatbot está desabilitado
  const chatbotAutoModeSetting = await Setting.findOne({
    where: { key: "chatbotAutoMode", companyId }
  });
  const isChatbotDisabled = chatbotAutoModeSetting?.value === 'disabled';
  
    
  // LÓGICA SIMPLIFICADA E FUNCIONAL
  let whereCondition: Filterable["where"];
  
  if (status === "closed") {
    // Para tickets fechados, mostrar tickets fechados
    whereCondition = {
      companyId,
      status: "closed"
    };
    
    // Aplicar filtro de fila se especificado
    if (queueCondition !== null) {
      whereCondition.queueId = queueCondition;
    }
  } else {
    // Para outros status, usar lógica padrão
    const orConditions = [];
    
    // 1. SEMPRE incluir tickets do usuário
    orConditions.push({ userId });
    
    if (isChatbotDisabled) {
      // 2. SEMPRE incluir tickets pendentes sem fila quando chatbot desabilitado
      orConditions.push({
        status: "pending",
        queueId: null
      });
      
      // 3. Incluir tickets pendentes das filas do usuário
      if (userQueueIds.length > 0) {
        orConditions.push({
          status: "pending",
          queueId: { [Op.in]: userQueueIds }
        });
      }
      
      // 4. Se há filtro de fila, incluir também esses tickets
      if (queueCondition !== null) {
        orConditions.push({
          status: "pending",
          queueId: queueCondition
        });
      }
    } else {
      // Comportamento original quando chatbot habilitado
      if (userQueueIds.length > 0) {
        orConditions.push({
          status: "pending",
          queueId: { [Op.in]: userQueueIds }
        });
      } else {
        orConditions.push({ status: "pending" });
      }
    }
    
    whereCondition = {
      companyId,
      [Op.or]: orConditions
    };
    
    // Aplicar filtros de fila para chatbot habilitado
    if (!isChatbotDisabled && queueCondition !== null) {
      whereCondition = {
        [Op.and]: [
          whereCondition,
          { queueId: queueCondition }
        ]
      };
    }
    
    // Aplicar filtro de status se especificado
    if (status && status !== "closed") {
      if (isChatbotDisabled && status === "pending") {
        // Para status pending com chatbot desabilitado, reconstruir condições
        const pendingConditions = [
          { userId, status: "pending" },
          { status: "pending", queueId: null } // SEMPRE incluir tickets sem fila
        ];
        
        if (userQueueIds.length > 0) {
          pendingConditions.push({
            status: "pending",
            queueId: { [Op.in]: userQueueIds }
          });
        }
        
        if (queueCondition !== null) {
          pendingConditions.push({
            status: "pending",
            queueId: queueCondition
          });
        }
        
        whereCondition = {
          companyId,
          [Op.or]: pendingConditions
        };
      } else if (!isChatbotDisabled) {
        // Aplicar status normalmente quando chatbot habilitado
        whereCondition = {
          [Op.and]: [
            whereCondition,
            { status }
          ]
        };
      }
    }
  }
  
  
  // Tratar showAll
  if (showAll === "true") {
    let showAllCondition: any = { companyId };
    
    if (status) {
      showAllCondition.status = status;
    }
    
    if (queueCondition !== null) {
      if (isChatbotDisabled && (status === "pending" || !status)) {
        showAllCondition = {
          companyId,
          [Op.or]: [
            { queueId: queueCondition },
            { queueId: null, status: "pending" }
          ]
        };
        if (status && status !== "pending") {
          showAllCondition = {
            companyId,
            status,
            queueId: queueCondition
          };
        }
      } else {
        showAllCondition.queueId = queueCondition;
      }
    } else if (isChatbotDisabled && (status === "pending" || !status)) {
      showAllCondition = {
        companyId,
        [Op.or]: [
          { queueId: { [Op.not]: null } },
          { queueId: null, status: "pending" }
        ]
      };
      if (status && status !== "pending") {
        showAllCondition = { companyId, status };
      }
    }
    
    whereCondition = showAllCondition;
  }
  
  
  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "profilePicUrl"]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"]
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["name"]
    },
  ];

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    includeCondition = [
      ...includeCondition,
      {
        model: Message,
        as: "messages",
        attributes: ["id", "body"],
        where: {
          body: where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        required: false,
        duplicating: false
      }
    ];

    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          "$contact.name$": where(
            fn("LOWER", col("contact.name")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
        {
          "$message.body$": where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        }
      ]
    };
  }

  if (date) {
    whereCondition = {
      ...whereCondition,
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
      }
    };
  }

  if (updatedAt) {
    whereCondition = {
      ...whereCondition,
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  if (withUnreadMessages === "true") {
    whereCondition = {
      [Op.and]: [
        whereCondition,
        { unreadMessages: { [Op.gt]: 0 } }
      ]
    };
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const ticketsTagFilter: any[] | null = [];
    for (let tag of tags) {
      const ticketTags = await TicketTag.findAll({
        where: { tagId: tag }
      });
      if (ticketTags) {
        ticketsTagFilter.push(ticketTags.map(t => t.ticketId));
      }
    }

    const ticketsIntersection: number[] = intersection(...ticketsTagFilter);

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketsIntersection
      }
    };
  }

  if (Array.isArray(users) && users.length > 0) {
    const ticketsUserFilter: any[] | null = [];
    for (let user of users) {
      const ticketUsers = await Ticket.findAll({
        where: { userId: user }
      });
      if (ticketUsers) {
        ticketsUserFilter.push(ticketUsers.map(t => t.id));
      }
    }

    const ticketsIntersection: number[] = intersection(...ticketsUserFilter);

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketsIntersection
      }
    };
  }

  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    distinct: true,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    subQuery: false
  });

  const hasMore = count > offset + tickets.length;

  return {
    tickets,
    count,
    hasMore
  };
};

export default ListTicketsService;