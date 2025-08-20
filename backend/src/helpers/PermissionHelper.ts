import AppError from "../errors/AppError";
import User from "../models/User";

export interface UserContext {
  id: string | number;
  profile: string;
  companyId: number;
}

export class PermissionHelper {
  /**
   * Verifica se o usuário é admin
   */
  static requireAdmin(user: UserContext): void {
    if (user.profile !== "admin") {
      throw new AppError("Acesso negado. Apenas administradores podem acessar esta funcionalidade.", 403);
    }
  }

  /**
   * Verifica se o usuário é super usuário
   */
  static async requireSuperUser(userId: string): Promise<void> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }
    
    if (!user.super) {
      throw new AppError("Acesso negado. Apenas super usuários podem acessar esta funcionalidade.", 403);
    }
  }

  /**
   * Verifica se o usuário pode acessar recursos da empresa
   */
  static requireSameCompany(userCompanyId: number, resourceCompanyId: number): void {
    if (userCompanyId !== resourceCompanyId) {
      throw new AppError("Acesso negado. Você só pode acessar recursos da sua empresa.", 403);
    }
  }

  /**
   * Verifica se o usuário pode modificar outro usuário
   */
  static async requireUserPermission(
    requestUser: UserContext, 
    targetUserId: string | number
  ): Promise<void> {
    // Super usuários podem modificar qualquer usuário
    const user = await User.findByPk(String(requestUser.id));
    if (user?.super) {
      return;
    }

    // Admins podem modificar usuários da mesma empresa
    if (requestUser.profile === "admin") {
      const targetUser = await User.findByPk(String(targetUserId));
      if (!targetUser) {
        throw new AppError("Usuário não encontrado", 404);
      }
      
      this.requireSameCompany(requestUser.companyId, targetUser.companyId);
      return;
    }

    // Usuários comuns só podem modificar a si mesmos
    const reqId = String(requestUser.id);
    const tgtId = String(targetUserId);
    if (reqId !== tgtId) {
      throw new AppError("Acesso negado. Você só pode modificar seu próprio perfil.", 403);
    }
  }

  /**
   * Verifica se o usuário tem um dos perfis permitidos
   */
  static requireRole(userProfile: string, allowedRoles: string[]): void {
    if (!allowedRoles.includes(userProfile)) {
      throw new AppError(`Acesso negado. Perfis permitidos: ${allowedRoles.join(", ")}`, 403);
    }
  }

  /**
   * Verifica se o usuário pode acessar um ticket
   */
  static async requireTicketAccess(
    user: UserContext, 
    ticketCompanyId: number,
    ticketUserId?: number
  ): Promise<void> {
    // Verificar se o ticket pertence à mesma empresa
    this.requireSameCompany(user.companyId, ticketCompanyId);

    // Super usuários e admins podem acessar qualquer ticket da empresa
    const userRecord = await User.findByPk(user.id);
    if (userRecord?.super || user.profile === "admin") {
      return;
    }

    // Usuários comuns só podem acessar tickets atribuídos a eles
    if (ticketUserId && parseInt(String(user.id), 10) !== ticketUserId) {
      throw new AppError("Acesso negado. Você só pode acessar tickets atribuídos a você.", 403);
    }
  }

  /**
   * Verifica se o usuário pode gerenciar campanhas
   */
  static requireCampaignPermission(user: UserContext): void {
    // Apenas admins podem gerenciar campanhas
    this.requireAdmin(user);
  }

  /**
   * Verifica se o usuário pode acessar relatórios
   */
  static requireReportAccess(user: UserContext): void {
    // Apenas admins podem acessar relatórios
    this.requireAdmin(user);
  }

  /**
   * Verifica se o usuário pode gerenciar configurações da empresa
   */
  static requireCompanySettingsPermission(user: UserContext): void {
    // Apenas admins podem gerenciar configuraç��es da empresa
    this.requireAdmin(user);
  }

  /**
   * Verifica se o usuário pode gerenciar filas
   */
  static requireQueueManagement(user: UserContext): void {
    // Apenas admins podem gerenciar filas
    this.requireAdmin(user);
  }

  /**
   * Verifica se o usuário pode gerenciar WhatsApp
   */
  static requireWhatsAppManagement(user: UserContext): void {
    // Apenas admins podem gerenciar conexões WhatsApp
    this.requireAdmin(user);
  }

  /**
   * Verifica se o usuário pode acessar dados de outros usuários
   */
  static requireUserDataAccess(requestUser: UserContext, targetUserId?: string | number): void {
    // Super usuários podem acessar dados de qualquer usuário
    if (requestUser.profile === "admin") {
      return;
    }

    // Usuários comuns só podem acessar seus próprios dados
    if (targetUserId && String(requestUser.id) !== String(targetUserId)) {
      throw new AppError("Acesso negado. Você só pode acessar seus próprios dados.", 403);
    }
  }

  /**
   * Verifica múltiplas permissões de uma vez
   */
  static async checkMultiplePermissions(
    user: UserContext,
    checks: Array<() => Promise<void> | void>
  ): Promise<void> {
    for (const check of checks) {
      await check();
    }
  }
}