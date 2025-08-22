import { Op, fn, where, col, Filterable, Includeable, literal, CountOptions } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Tag from "../../models/Tag";
import Whatsapp from "../../models/Whatsapp";
import Setting from "../../models/Setting";
import TicketUser from "../../models/TicketUser";

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
  const numericQueueIds = queueIds
    .filter(
      id => typeof id === "number" || (typeof id === "string" && id !== "no-queue")
    )
    .map(id => Number(id));
  const includeNoQueue = queueIds.includes("no-queue");

  // Construir condição de queue baseada na presença de "no-queue"
  let queueCondition: any;
  if (includeNoQueue && numericQueueIds.length > 0) {
    queueCondition = {
      [Op.or]: [{ [Op.in]: numericQueueIds }, { [Op.is]: null }]
    };
  } else if (includeNoQueue) {
    queueCondition = { [Op.is]: null };
  } else if (numericQueueIds.length > 0) {
    queueCondition = { [Op.in]: numericQueueIds };
  } else {
    queueCondition = null;
  }

  // Buscar apenas as filas do usuário (consulta leve)
  const userWithQueues = await User.findByPk(userId as any, {
    attributes: ["id"],
    include: [{ model: Queue, as: "queues", attributes: ["id"] }]
  });
  const userQueueIds = userWithQueues?.queues?.map(queue => queue.id) || [];

  // Buscar tickets vinculados ao usuário (TicketUsers)
  const linkedTicketUserRows = await TicketUser.findAll({
    attributes: ["ticketId"],
    where: { userId: Number(userId) }
  });
  const linkedTicketIds = linkedTicketUserRows.map(row => row.ticketId);

  // Verificar se o chatbot está desabilitado
  const chatbotAutoModeSetting = await Setting.findOne({
    where: { key: "chatbotAutoMode", companyId }
  });
  const isChatbotDisabled = chatbotAutoModeSetting?.value === "disabled";

  // LÓGICA SIMPLIFICADA E FUNCIONAL
  let whereCondition: Filterable["where"];

  if (status === "closed") {
    // Para tickets fechados, mostrar tickets fechados
    whereCondition = {
      companyId,
      status: "closed"
    } as any;

    // Aplicar filtro de fila se especificado
    if (queueCondition !== null) {
      (whereCondition as any).queueId = queueCondition;
    }
  } else {
    // Para outros status, usar lógica padrão
    const orConditions: any[] = [];

    // 1. SEMPRE incluir tickets do usuário
    orConditions.push({ userId });

    // 1.1 Incluir tickets vinculados ao usuário (via TicketUsers)
    if (linkedTicketIds.length > 0) {
      orConditions.push({ id: { [Op.in]: linkedTicketIds } });
    }

    if (isChatbotDisabled) {
      // 2. SEMPRE incluir tickets pendentes sem fila quando chatbot desabilitado
      orConditions.push({ status: "pending", queueId: null });

      // 3. Incluir tickets pendentes das filas do usuário
      if (userQueueIds.length > 0) {
        orConditions.push({ status: "pending", queueId: { [Op.in]: userQueueIds } });
      }

      // 4. Se há filtro de fila, incluir também esses tickets
      if (queueCondition !== null) {
        orConditions.push({ status: "pending", queueId: queueCondition });
      }
    } else {
      // Comportamento original quando chatbot habilitado
      if (userQueueIds.length > 0) {
        orConditions.push({ status: "pending", queueId: { [Op.in]: userQueueIds } });
      } else {
        orConditions.push({ status: "pending" });
      }
    }

    whereCondition = {
      companyId,
      [Op.or]: orConditions
    } as any;

    // Aplicar filtros de fila para chatbot habilitado
    if (!isChatbotDisabled && queueCondition !== null) {
      whereCondition = {
        [Op.and]: [whereCondition, { queueId: queueCondition }]
      } as any;
    }

    // Aplicar filtro de status se especificado
    if (status && status !== "closed") {
      if (isChatbotDisabled && status === "pending") {
        // Para status pending com chatbot desabilitado, reconstruir condições
        const pendingConditions: any[] = [
          { userId, status: "pending" },
          { status: "pending", queueId: null } // SEMPRE incluir tickets sem fila
        ];

        if (userQueueIds.length > 0) {
          pendingConditions.push({ status: "pending", queueId: { [Op.in]: userQueueIds } });
        }

        if (queueCondition !== null) {
          pendingConditions.push({ status: "pending", queueId: queueCondition });
        }

        whereCondition = {
          companyId,
          [Op.or]: pendingConditions
        } as any;
      } else if (!isChatbotDisabled) {
        // Aplicar status normalmente quando chatbot habilitado
        whereCondition = {
          [Op.and]: [whereCondition, { status }]
        } as any;
      } else if (isChatbotDisabled && status !== "pending") {
        // Aplicar filtro de status também quando chatbot está desabilitado (ex.: "open")
        whereCondition = {
          [Op.and]: [whereCondition, { status }]
        } as any;
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
          [Op.or]: [{ queueId: queueCondition }, { queueId: null, status: "pending" }]
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
        [Op.or]: [{ queueId: { [Op.not]: null } }, { queueId: null, status: "pending" }]
      };
      if (status && status !== "pending") {
        showAllCondition = { companyId, status };
      }
    }

    whereCondition = showAllCondition;
  }

  // Filtros adicionais simples e performáticos
  if (Array.isArray(users) && users.length > 0) {
    const userIds = users.map(Number).filter(n => !Number.isNaN(n));
    if (userIds.length) {
      whereCondition = {
        [Op.and]: [whereCondition, { userId: { [Op.in]: userIds } }]
      } as any;
    }
  }

  if (withUnreadMessages === "true") {
    whereCondition = {
      [Op.and]: [whereCondition, { unreadMessages: { [Op.gt]: 0 } }]
    } as any;
  }

  if (date) {
    whereCondition = {
      [Op.and]: [
        whereCondition,
        {
          createdAt: {
            [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
          }
        }
      ]
    } as any;
  }

  if (updatedAt) {
    whereCondition = {
      [Op.and]: [
        whereCondition,
        {
          updatedAt: {
            [Op.between]: [
              +startOfDay(parseISO(updatedAt)),
              +endOfDay(parseISO(updatedAt))
            ]
          }
        }
      ]
    } as any;
  }

  // Filtro por tags: garantir que possua TODAS as tags informadas (1 única consulta via subquery)
  if (Array.isArray(tags) && tags.length > 0) {
    const tagIds = Array.from(new Set(tags.map(Number))).filter(n => !Number.isNaN(n));
    if (tagIds.length) {
      const tagIdsCsv = tagIds.join(",");
      whereCondition = {
        [Op.and]: [
          whereCondition,
          {
            id: {
              [Op.in]: literal(`(
                SELECT "ticketId" FROM "TicketTags"
                WHERE "TicketTags"."tagId" IN (${tagIdsCsv})
                GROUP BY "ticketId"
                HAVING COUNT(DISTINCT "TicketTags"."tagId") = ${tagIds.length}
              )`)
            }
          }
        ]
      } as any;
    }
  }

  // Includes leves para busca (apenas quando necessário)
  const searchIncludes: Includeable[] = [];
  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    // Incluir apenas para suporte ao filtro de busca
    searchIncludes.push(
      {
        model: Contact,
        as: "contact",
        attributes: [],
        required: false
      },
      {
        model: Message,
        as: "messages",
        attributes: [],
        required: false,
        where: {
          body: where(fn("LOWER", col("messages.body")), "LIKE", `%${sanitizedSearchParam}%`)
        },
        duplicating: false
      }
    );

    // Acrescentar OR de busca (nome, número, mensagem)
    whereCondition = {
      [Op.and]: [
        whereCondition,
        {
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
              "$messages.body$": where(
                fn("LOWER", col("messages.body")),
                "LIKE",
                `%${sanitizedSearchParam}%`
              )
            }
          ]
        }
      ]
    } as any;
  }

  // Includes completos apenas para a listagem (evitar custo no count/ids)
  const fullIncludes: Includeable[] = [
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
      attributes: ["id", "name", "profileImage"]
    },
    {
      model: User,
      as: "users",
      attributes: ["id", "name", "profileImage"],
      through: { attributes: [] }
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"],
      through: { attributes: [] }
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["name"]
    }
  ];

  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  // 1) Obter COUNT com WHERE + includes mínimos de busca
  const countOptions: Omit<CountOptions, 'group'> = {
    where: whereCondition,
    include: searchIncludes,
    distinct: true,
    col: "id"
  };

  const count: number = await Ticket.count(countOptions);

  // 2) Obter apenas os IDs paginados com includes mínimos
  const idRows = await Ticket.findAll({
    attributes: ["id"],
    where: whereCondition,
    include: searchIncludes,
    order: [["id", "DESC"]],
    limit,
    offset,
    subQuery: true
  });

  const ids = idRows.map(r => r.id);

  // 3) Carregar os tickets completos pelos IDs obtidos
  const tickets = await Ticket.findAll({
    where: { id: { [Op.in]: ids } },
    include: fullIncludes,
    order: [["id", "DESC"]]
  });

  const hasMore = count > offset + tickets.length;

  return {
    tickets,
    count,
    hasMore
  };
};

export default ListTicketsService;
