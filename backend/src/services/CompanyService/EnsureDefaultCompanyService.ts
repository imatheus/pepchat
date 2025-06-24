import Company from "../../models/Company";
import Plan from "../../models/Plan";
import User from "../../models/User";
import { logger } from "../../utils/logger";

interface Response {
  company: Company;
  created: boolean;
}

const EnsureDefaultCompanyService = async (): Promise<Response> => {
  try {
    // Verificar se já existe uma empresa ativa
    let company = await Company.findOne({ 
      where: { status: true },
      include: [{ model: Plan, as: 'plan' }]
    });

    if (company) {
      return { company, created: false };
    }

    // Se não existe, criar uma empresa padrão
    logger.info('Creating default company for webhook fallback');

    // Buscar ou criar plano padrão
    let defaultPlan = await Plan.findOne({ where: { name: 'Plano Padrão' } });
    
    if (!defaultPlan) {
      defaultPlan = await Plan.create({
        name: 'Plano Padrão',
        users: 1,
        connections: 1,
        queues: 1,
        value: 50.00,
        useWhatsapp: true,
        useFacebook: false,
        useInstagram: false,
        useCampaigns: false
      });
    }

    // Criar empresa padrão
    company = await Company.create({
      name: 'Empresa Padrão (Webhook)',
      email: 'webhook@sistema.com',
      fullName: 'Empresa Padrão para Webhooks',
      document: '00000000000',
      phone: '11999999999',
      status: true,
      planId: defaultPlan.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 dias
    });

    // Criar usuário padrão para a empresa
    await User.create({
      name: 'Admin Webhook',
      email: 'webhook@sistema.com',
      password: 'webhook123',
      profile: 'admin',
      companyId: company.id
    });

    // Recarregar com o plano
    await company.reload({ include: [{ model: Plan, as: 'plan' }] });

    logger.info(`Default company created: ${company.id} - ${company.name}`);

    return { company, created: true };

  } catch (error: any) {
    logger.error('Error ensuring default company:', error);
    throw error;
  }
};

export default EnsureDefaultCompanyService;