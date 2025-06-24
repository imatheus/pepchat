/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
import { QueryTypes } from "sequelize";
import * as _ from "lodash";
import sequelize from "../../database";

export interface DashboardData {
  counters: any;
  attendants: any[];
}

export interface Params {
  days?: number;
  date_from?: string;
  date_to?: string;
}

export default async function DashboardDataService(
  companyId: string | number,
  params: Params
): Promise<DashboardData> {
  try {
    // Build date filter conditions
    let dateFilter = '';
    let dateFilterAttendants = '';
    const replacements: any[] = [];
    const replacementsAttendants: any[] = [];

    if (_.has(params, "days") && params.days > 0) {
      dateFilter = ` AND tt."queuedAt" >= (NOW() - INTERVAL '${parseInt(`${params.days}`.replace(/\D/g, ""), 10)} days')`;
      dateFilterAttendants = ` AND tt."queuedAt" >= (NOW() - INTERVAL '${parseInt(`${params.days}`.replace(/\D/g, ""), 10)} days')`;
    }

    if (_.has(params, "date_from") && params.date_from) {
      dateFilter += ` AND tt."queuedAt" >= ?`;
      dateFilterAttendants += ` AND tt."queuedAt" >= ?`;
      replacements.push(`${params.date_from} 00:00:00`);
      replacementsAttendants.push(`${params.date_from} 00:00:00`);
    }

    if (_.has(params, "date_to") && params.date_to) {
      dateFilter += ` AND tt."finishedAt" <= ?`;
      dateFilterAttendants += ` AND tt."finishedAt" <= ?`;
      replacements.push(`${params.date_to} 23:59:59`);
      replacementsAttendants.push(`${params.date_to} 23:59:59`);
    }

    const countersQuery = `
      WITH tracking_data AS (
        SELECT 
          tt.*,
          CASE 
            WHEN tt."finishedAt" IS NOT NULL THEN 1 
            ELSE 0 
          END as finished,
          CASE 
            WHEN tt."userId" IS NULL AND tt."finishedAt" IS NULL THEN 1 
            ELSE 0 
          END as pending,
          COALESCE(
            EXTRACT(EPOCH FROM (COALESCE(tt."finishedAt", tt."ratingAt") - tt."startedAt")) / 60, 0
          ) as "supportTime",
          COALESCE(
            EXTRACT(EPOCH FROM (tt."startedAt" - tt."queuedAt")) / 60, 0
          ) as "waitTime"
        FROM "TicketTraking" tt
        WHERE tt."companyId" = ?${dateFilter}
      ),
      leads_data AS (
        SELECT 
          COUNT(DISTINCT ct.id) as leads_count
        FROM tracking_data tt
        LEFT JOIN "Tickets" t ON t.id = tt."ticketId"
        LEFT JOIN "Contacts" ct ON ct.id = t."contactId"
        GROUP BY ct.id
        HAVING COUNT(tt.id) = 1
      )
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM "Tickets" WHERE status = 'open' AND "companyId" = ?), 0
        ) as "supportHappening",
        COALESCE(
          (SELECT COUNT(*) FROM "Tickets" WHERE status = 'pending' AND "companyId" = ?), 0
        ) as "supportPending",
        COALESCE(
          (SELECT COUNT(*) FROM tracking_data WHERE finished = 1), 0
        ) as "supportFinished",
        COALESCE(
          (SELECT AVG("supportTime") FROM tracking_data WHERE "supportTime" > 0), 0
        ) as "avgSupportTime",
        COALESCE(
          (SELECT AVG("waitTime") FROM tracking_data WHERE "waitTime" > 0), 0
        ) as "avgWaitTime",
        COALESCE(
          (SELECT COUNT(*) FROM leads_data), 0
        ) as "leads"
    `;

    const attendantsQuery = `
      SELECT 
        u.id,
        u.name,
        u.online,
        u."profileImage",
        COALESCE(stats.tickets, 0) as tickets,
        COALESCE(stats.rating, 0) as rating,
        COALESCE(stats."avgSupportTime", 0) as "avgSupportTime"
      FROM "Users" u
      LEFT JOIN (
        SELECT 
          tt."userId",
          COUNT(tt.id) as tickets,
          COALESCE(AVG(ur.rate), 0) as rating,
          COALESCE(AVG(
            CASE 
              WHEN tt."startedAt" IS NOT NULL AND tt."finishedAt" IS NOT NULL
              THEN EXTRACT(EPOCH FROM (tt."finishedAt" - tt."startedAt")) / 60
              ELSE 0 
            END
          ), 0) as "avgSupportTime"
        FROM "TicketTraking" tt
        LEFT JOIN "UserRatings" ur ON ur."userId" = tt."userId" 
          AND DATE(ur."createdAt") = DATE(tt."finishedAt")
        WHERE tt."companyId" = ?${dateFilterAttendants}
        GROUP BY tt."userId"
      ) stats ON stats."userId" = u.id
      WHERE u."companyId" = ?
      ORDER BY u.name
    `;

    // Prepare final replacements arrays
    const finalReplacementsCounters = [companyId, ...replacements, companyId, companyId];
    const finalReplacementsAttendants = [companyId, ...replacementsAttendants, companyId];

    // Execute queries
    const [countersResult, attendantsResult] = await Promise.all([
      sequelize.query(countersQuery, {
        replacements: finalReplacementsCounters,
        type: QueryTypes.SELECT,
        plain: true
      }),
      sequelize.query(attendantsQuery, {
        replacements: finalReplacementsAttendants,
        type: QueryTypes.SELECT
      })
    ]);

    // Validate and sanitize counters data
    const sanitizedCounters = {
      supportHappening: Number((countersResult as any)?.supportHappening) || 0,
      supportPending: Number((countersResult as any)?.supportPending) || 0,
      supportFinished: Number((countersResult as any)?.supportFinished) || 0,
      avgSupportTime: Number((countersResult as any)?.avgSupportTime) || 0,
      avgWaitTime: Number((countersResult as any)?.avgWaitTime) || 0,
      leads: Number((countersResult as any)?.leads) || 0
    };

    // Validate and sanitize attendants data
    const sanitizedAttendants = Array.isArray(attendantsResult) 
      ? (attendantsResult as any[]).map((attendant: any) => ({
          id: attendant.id,
          name: attendant.name || 'Nome não disponível',
          online: Boolean(attendant.online),
          profileImage: attendant.profileImage || null,
          tickets: Number(attendant.tickets) || 0,
          rating: attendant.rating !== null && attendant.rating !== undefined 
            ? Number(attendant.rating) 
            : null,
          avgSupportTime: Number(attendant.avgSupportTime) || 0
        }))
      : [];

    const responseData: DashboardData = {
      counters: sanitizedCounters,
      attendants: sanitizedAttendants
    };

    return responseData;

  } catch (error) {
    console.error('Dashboard query error:', error);
    
    // Return default data in case of error
    return {
      counters: {
        supportHappening: 0,
        supportPending: 0,
        supportFinished: 0,
        avgSupportTime: 0,
        avgWaitTime: 0,
        leads: 0
      },
      attendants: []
    };
  }
}