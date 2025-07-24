import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import { logger } from "../../utils/logger";

interface QueryOptions {
  replacements?: any[];
  type?: QueryTypes;
  plain?: boolean;
}

class SecureQueryService {
  /**
   * Executa uma query de forma segura usando prepared statements
   */
  static async executeQuery(
    query: string,
    options: QueryOptions = {}
  ): Promise<any> {
    try {
      // Validar se a query não contém comandos perigosos
      this.validateQuery(query);
      
      const result = await sequelize.query(query, {
        replacements: options.replacements || [],
        type: options.type || QueryTypes.SELECT,
        plain: options.plain || false,
        logging: false
      });
      
      return result;
    } catch (error) {
      logger.error("Error executing secure query:", error);
      throw error;
    }
  }
  
  /**
   * Valida se a query é segura
   */
  private static validateQuery(query: string): void {
    const dangerousPatterns = [
      /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE)\s+/i,
      /UNION\s+SELECT/i,
      /--/,
      /\/\*/,
      /\*\//,
      /xp_/i,
      /sp_/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new Error(`Query contém padrão perigoso: ${pattern.source}`);
      }
    }
  }
  
  /**
   * Sanitiza parâmetros de entrada
   */
  static sanitizeParams(params: any[]): any[] {
    return params.map(param => {
      if (typeof param === 'string') {
        // Remove caracteres perigosos
        return param.replace(/['";\\-]/g, '');
      }
      return param;
    });
  }
  
  /**
   * Executa query de dashboard de forma segura
   */
  static async executeDashboardQuery(
    companyId: number,
    dateFilter: string = '',
    replacements: any[] = []
  ): Promise<any> {
    // Validar companyId
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new Error("Company ID inválido");
    }
    
    // Sanitizar replacements
    const sanitizedReplacements = this.sanitizeParams(replacements);
    
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
    
    const finalReplacements = [companyId, ...sanitizedReplacements, companyId, companyId];
    
    return this.executeQuery(countersQuery, {
      replacements: finalReplacements,
      type: QueryTypes.SELECT,
      plain: true
    });
  }
  
  /**
   * Executa query de atendentes de forma segura
   */
  static async executeAttendantsQuery(
    companyId: number,
    dateFilter: string = '',
    replacements: any[] = []
  ): Promise<any> {
    // Validar companyId
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new Error("Company ID inválido");
    }
    
    // Sanitizar replacements
    const sanitizedReplacements = this.sanitizeParams(replacements);
    
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
        WHERE tt."companyId" = ?${dateFilter}
        GROUP BY tt."userId"
      ) stats ON stats."userId" = u.id
      WHERE u."companyId" = ?
      ORDER BY u.name
    `;
    
    const finalReplacements = [companyId, ...sanitizedReplacements, companyId];
    
    return this.executeQuery(attendantsQuery, {
      replacements: finalReplacements,
      type: QueryTypes.SELECT
    });
  }
}

export default SecureQueryService;