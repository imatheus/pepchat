import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import sequelize from "../database";
import User from "../models/User";
import Company from "../models/Company";

interface AuthorizedRequest extends Request {
  user: {
    id: string;
    profile: string;
    companyId: number;
  };
}

export const getSystemStats = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    // Verificar se é super usuário
    const user = await User.findByPk(req.user.id);
    if (!user?.super) {
      res.status(403).json({ error: "Acesso negado. Apenas super usuários podem acessar." });
      return;
    }

    // Buscar usuários online
    const onlineUsers = await User.count({
      where: { online: true }
    });

    // Buscar total de usuários
    const totalUsers = await User.count();

    // Buscar empresas em trial
    const companiesInTrial = await sequelize.query(`
      SELECT 
        c.id,
        c.name,
        c."trialExpiration",
        c."createdAt",
        EXTRACT(DAY FROM (c."trialExpiration" - NOW())) as "daysRemaining"
      FROM "Companies" c
      WHERE c."trialExpiration" IS NOT NULL 
        AND c."trialExpiration" > NOW()
      ORDER BY c."trialExpiration" ASC
    `, {
      type: QueryTypes.SELECT
    });

    // Buscar empresas expiradas
    const expiredCompanies = await sequelize.query(`
      SELECT 
        c.id,
        c.name,
        c."dueDate",
        c."trialExpiration",
        c.status
      FROM "Companies" c
      WHERE (
        (c."trialExpiration" IS NOT NULL AND c."trialExpiration" < NOW()) OR
        (c."dueDate" IS NOT NULL AND c."dueDate" < NOW())
      ) AND c.status = false
      ORDER BY COALESCE(c."trialExpiration", c."dueDate") DESC
    `, {
      type: QueryTypes.SELECT
    });

    // Buscar empresas ativas (pagas)
    const activeCompanies = await Company.count({
      where: { 
        status: true 
      }
    });

    // Buscar total de empresas
    const totalCompanies = await Company.count();

    // Estatísticas de conexões WhatsApp
    const whatsappStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'CONNECTED' THEN 1 END) as connected,
        COUNT(CASE WHEN status = 'DISCONNECTED' THEN 1 END) as disconnected,
        COUNT(CASE WHEN status = 'OPENING' THEN 1 END) as opening
      FROM "Whatsapps"
    `, {
      type: QueryTypes.SELECT,
      plain: true
    }) as any;

    // Estatísticas de tickets hoje
    const ticketStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_today,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_today,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_today,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_today
      FROM "Tickets"
      WHERE DATE("createdAt") = CURRENT_DATE
    `, {
      type: QueryTypes.SELECT,
      plain: true
    }) as any;

    const stats = {
      users: {
        online: onlineUsers,
        total: totalUsers,
        offline: totalUsers - onlineUsers
      },
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        inTrial: (companiesInTrial as any[]).length,
        expired: (expiredCompanies as any[]).length,
        trialList: companiesInTrial,
        expiredList: expiredCompanies
      },
      whatsapp: {
        total: whatsappStats.total || 0,
        connected: whatsappStats.connected || 0,
        disconnected: whatsappStats.disconnected || 0,
        opening: whatsappStats.opening || 0
      },
      tickets: {
        today: ticketStats.total_today || 0,
        open: ticketStats.open_today || 0,
        closed: ticketStats.closed_today || 0,
        pending: ticketStats.pending_today || 0
      },
      timestamp: new Date()
    };

    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas do sistema:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const getUserGrowthStats = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    // Verificar se é super usuário
    const user = await User.findByPk(req.user.id);
    if (!user?.super) {
      res.status(403).json({ error: "Acesso negado. Apenas super usuários podem acessar." });
      return;
    }

    // Buscar dados de crescimento de usuários dos últimos 12 meses
    const userGrowthData = await sequelize.query(`
      WITH months AS (
        SELECT 
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months' + INTERVAL '1 month' * generate_series(0, 11)) as month_date
      ),
      user_counts AS (
        SELECT 
          DATE_TRUNC('month', u."createdAt") as month_date,
          COUNT(*) as new_users
        FROM "Users" u
        WHERE u."createdAt" >= CURRENT_DATE - INTERVAL '11 months'
        GROUP BY DATE_TRUNC('month', u."createdAt")
      ),
      cumulative_counts AS (
        SELECT 
          m.month_date,
          COALESCE(uc.new_users, 0) as new_users,
          SUM(COALESCE(uc.new_users, 0)) OVER (ORDER BY m.month_date) as cumulative_users
        FROM months m
        LEFT JOIN user_counts uc ON m.month_date = uc.month_date
        ORDER BY m.month_date
      )
      SELECT 
        TO_CHAR(month_date, 'Mon/YY') as month,
        TO_CHAR(month_date, 'Month YYYY') as full_date,
        new_users,
        cumulative_users
      FROM cumulative_counts
      ORDER BY month_date
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      userGrowth: userGrowthData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Erro ao buscar dados de crescimento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const getDetailedCompanyStats = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    // Verificar se é super usuário
    const user = await User.findByPk(req.user.id);
    if (!user?.super) {
      res.status(403).json({ error: "Acesso negado. Apenas super usuários podem acessar." });
      return;
    }

    const companies = await sequelize.query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.status,
        c."dueDate",
        c."trialExpiration",
        c."createdAt",
        COUNT(DISTINCT u.id) as "userCount",
        COUNT(DISTINCT w.id) as "whatsappCount",
        COUNT(DISTINCT t.id) as "ticketCount",
        p.name as "planName",
        CASE 
          WHEN c."trialExpiration" IS NOT NULL AND c."trialExpiration" > NOW() THEN 'trial'
          WHEN c."dueDate" IS NOT NULL AND c."dueDate" < NOW() THEN 'expired'
          WHEN c.status = true THEN 'active'
          ELSE 'inactive'
        END as "companyStatus"
      FROM "Companies" c
      LEFT JOIN "Users" u ON u."companyId" = c.id
      LEFT JOIN "Whatsapps" w ON w."companyId" = c.id
      LEFT JOIN "Tickets" t ON t."companyId" = c.id AND DATE(t."createdAt") = CURRENT_DATE
      LEFT JOIN "Plans" p ON p.id = c."planId"
      GROUP BY c.id, c.name, c.email, c.status, c."dueDate", c."trialExpiration", c."createdAt", p.name
      ORDER BY c."createdAt" DESC
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      companies,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas detalhadas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};