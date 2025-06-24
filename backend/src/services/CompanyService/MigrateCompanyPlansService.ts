import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CompanyPlan from "../../models/CompanyPlan";
import CreateCompanyPlanService from "../CompanyPlanService/CreateCompanyPlanService";
import { logger } from "../../utils/logger";

interface MigrationResult {
  success: boolean;
  migrated: number;
  errors: number;
  details: Array<{
    companyId: number;
    companyName: string;
    status: 'migrated' | 'already_exists' | 'error';
    message: string;
  }>;
}

const MigrateCompanyPlansService = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    errors: 0,
    details: []
  };

  try {
    // Buscar todas as empresas que têm planId mas não têm CompanyPlan ativo
    const companies = await Company.findAll({
      where: {
        planId: {
          $ne: null
        }
      },
      include: [
        { model: Plan, as: 'plan' },
        { 
          model: CompanyPlan, 
          as: 'companyPlans',
          where: { isActive: true },
          required: false
        }
      ]
    });

    logger.info(`Encontradas ${companies.length} empresas para verificar migração`);

    for (const company of companies) {
      try {
        // Verificar se já tem um plano ativo
        const hasActivePlan = company.companyPlans && company.companyPlans.length > 0;

        if (hasActivePlan) {
          result.details.push({
            companyId: company.id,
            companyName: company.name,
            status: 'already_exists',
            message: 'Empresa já possui plano personalizado ativo'
          });
          continue;
        }

        if (!company.plan) {
          result.details.push({
            companyId: company.id,
            companyName: company.name,
            status: 'error',
            message: 'Empresa não possui plano base configurado'
          });
          result.errors++;
          continue;
        }

        // Criar plano personalizado baseado no plano base (1 usuário por padrão)
        await CreateCompanyPlanService({
          companyId: company.id,
          basePlanId: company.planId!,
          users: 1 // Valor padrão para empresas existentes
        });

        result.details.push({
          companyId: company.id,
          companyName: company.name,
          status: 'migrated',
          message: `Plano personalizado criado baseado em ${company.plan.name}`
        });

        result.migrated++;
        logger.info(`Plano personalizado criado para empresa ${company.name} (ID: ${company.id})`);

      } catch (error: any) {
        result.details.push({
          companyId: company.id,
          companyName: company.name,
          status: 'error',
          message: `Erro ao criar plano: ${error.message}`
        });
        result.errors++;
        logger.error(`Erro ao migrar empresa ${company.name} (ID: ${company.id}):`, error);
      }
    }

    if (result.errors > 0) {
      result.success = false;
    }

    logger.info(`Migração concluída: ${result.migrated} migradas, ${result.errors} erros`);

  } catch (error: any) {
    logger.error('Erro durante migração de planos:', error);
    result.success = false;
    result.details.push({
      companyId: 0,
      companyName: 'Sistema',
      status: 'error',
      message: `Erro geral: ${error.message}`
    });
  }

  return result;
};

export default MigrateCompanyPlansService;