import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CreateAsaasCustomerForCompanyService from "./CreateAsaasCustomerForCompanyService";
import { logger } from "../../utils/logger";

interface Response {
  totalCompanies: number;
  synchronized: number;
  skipped: number;
  errors: string[];
  details: Array<{
    companyId: number;
    companyName: string;
    status: 'success' | 'skipped' | 'error';
    message: string;
  }>;
}

const SyncAllCompaniesWithAsaasService = async (): Promise<Response> => {
  try {
    // Buscar todas as empresas ativas com planos
    const companies = await Company.findAll({
      where: { status: true },
      include: [{ model: Plan, as: 'plan' }]
    });

    const result: Response = {
      totalCompanies: companies.length,
      synchronized: 0,
      skipped: 0,
      errors: [],
      details: []
    };

    logger.info(`Iniciando sincronização de ${companies.length} empresas com Asaas`);

    // Processar cada empresa
    for (const company of companies) {
      try {
        if (!company.plan) {
          result.skipped++;
          result.details.push({
            companyId: company.id,
            companyName: company.name,
            status: 'skipped',
            message: 'Empresa sem plano configurado'
          });
          continue;
        }

        if (!company.email || !company.document) {
          result.skipped++;
          result.details.push({
            companyId: company.id,
            companyName: company.name,
            status: 'skipped',
            message: 'Empresa sem email ou documento'
          });
          continue;
        }

        // Tentar criar no Asaas
        const asaasResult = await CreateAsaasCustomerForCompanyService({
          companyId: company.id
        });

        if (asaasResult.success) {
          result.synchronized++;
          result.details.push({
            companyId: company.id,
            companyName: company.name,
            status: 'success',
            message: asaasResult.message
          });
        } else {
          result.errors.push(`${company.name}: ${asaasResult.message}`);
          result.details.push({
            companyId: company.id,
            companyName: company.name,
            status: 'error',
            message: asaasResult.message
          });
        }

        // Pequena pausa para não sobrecarregar a API do Asaas
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        const errorMsg = `Erro ao processar empresa ${company.name}: ${error.message}`;
        result.errors.push(errorMsg);
        result.details.push({
          companyId: company.id,
          companyName: company.name,
          status: 'error',
          message: error.message
        });
        logger.error(errorMsg);
      }
    }

    logger.info(`Sincronização concluída: ${result.synchronized} criadas, ${result.skipped} puladas, ${result.errors.length} erros`);

    return result;

  } catch (error: any) {
    logger.error('Error syncing companies with Asaas:', error);
    throw error;
  }
};

export default SyncAllCompaniesWithAsaasService;