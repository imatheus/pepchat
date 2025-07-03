import { Request, Response } from "express";
import { SecurityLogger } from "../middleware/securityLogger";

interface AuthorizedRequest extends Request {
  user: {
    id: string;
    profile: string;
    companyId: number;
  };
}

export const getSecurityEvents = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, limit = 100 } = req.query;
    
    let events;
    
    if (type) {
      events = SecurityLogger.getEventsByType(type as any, parseInt(limit as string));
    } else {
      events = SecurityLogger.getRecentEvents(parseInt(limit as string));
    }
    
    res.json({
      events,
      total: events.length,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar eventos de segurança" });
  }
};

export const getSecurityEventsByIP = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const { ip } = req.params;
    const { limit = 50 } = req.query;
    
    const events = SecurityLogger.getEventsByIP(ip, parseInt(limit as string));
    
    res.json({
      ip,
      events,
      total: events.length,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar eventos de segurança por IP" });
  }
};

export const getSecuritySummary = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const recentEvents = SecurityLogger.getRecentEvents(1000);
    
    const summary = {
      total: recentEvents.length,
      byType: {
        AUTH_FAILURE: recentEvents.filter(e => e.type === 'AUTH_FAILURE').length,
        RATE_LIMIT: recentEvents.filter(e => e.type === 'RATE_LIMIT').length,
        WEBHOOK_FAILURE: recentEvents.filter(e => e.type === 'WEBHOOK_FAILURE').length,
        SUSPICIOUS_ACTIVITY: recentEvents.filter(e => e.type === 'SUSPICIOUS_ACTIVITY').length,
        ACCESS_DENIED: recentEvents.filter(e => e.type === 'ACCESS_DENIED').length
      },
      topIPs: getTopIPs(recentEvents),
      recentCritical: recentEvents
        .filter(e => e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'WEBHOOK_FAILURE')
        .slice(-10),
      timestamp: new Date()
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar resumo de segurança" });
  }
};

function getTopIPs(events: any[]): Array<{ ip: string; count: number }> {
  const ipCounts: { [key: string]: number } = {};
  
  events.forEach(event => {
    ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
  });
  
  return Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}