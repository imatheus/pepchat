import moment from "moment";
import { Op } from "sequelize";
import Company from "../../models/Company";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";

interface Response {
  totalChecked: number;
  expired: number;
  activated: number;
  inTrial: number;
  details: Array<{
    companyId: number;
    companyName: string;
    status: 'expired' | 'activated' | 'trial' | 'no_change';
    dueDate?: string;
    trialExpiration?: string;
    message: string;
  }>;
}

const CheckCompanyExpirationService = async (): Promise<Response> => {
  try {
    const now = moment();
    const today = now.format('YYYY-MM-DD');

    // Buscar todas as empresas
    const companies = await Company.findAll();

    const result: Response = {
      totalChecked: companies.length,
      expired: 0,
      activated: 0,
      inTrial: 0,
      details: []
    };

    logger.info(`Verificando expiração de ${companies.length} empresas`);

    for (const company of companies) {
      try {
        let shouldUpdate = false;
        let newStatus = company.status;
        let statusType: 'expired' | 'activated' | 'trial' | 'no_change' = 'no_change';
        let message = 'Sem alterações';

        // Verificar se está em período de trial
        if (company.trialExpiration) {
          const trialExpiration = moment(company.trialExpiration);
          
          if (trialExpiration.isAfter(now)) {
            // Ainda em trial - deve estar ativa
            if (!company.status) {
              newStatus = true;
              shouldUpdate = true;
              statusType = 'trial';
              message = `Empresa ativada - em período de avaliação até ${trialExpiration.format('DD/MM/YYYY')}`;
              result.inTrial++;
            } else {
              statusType = 'trial';
              message = `Em período de avaliação até ${trialExpiration.format('DD/MM/YYYY')}`;
              result.inTrial++;
            }
          } else {
            // Trial expirou - verificar data de vencimento
            if (company.dueDate) {
              const dueDate = moment(company.dueDate);
              
              if (dueDate.isAfter(now)) {
                // Data de vencimento ainda não passou - ativar
                if (!company.status) {
                  newStatus = true;
                  shouldUpdate = true;
                  statusType = 'activated';
                  message = `Empresa ativada - vencimento em ${dueDate.format('DD/MM/YYYY')}`;
                  result.activated++;
                } else {
                  message = `Ativa - vencimento em ${dueDate.format('DD/MM/YYYY')}`;
                }
                
                // Remover trial expirado
                await company.update({ trialExpiration: null });
              } else {
                // Data de vencimento passou - desativar
                if (company.status) {
                  newStatus = false;
                  shouldUpdate = true;
                  statusType = 'expired';
                  message = `Empresa desativada - venceu em ${dueDate.format('DD/MM/YYYY')}`;
                  result.expired++;
                } else {
                  statusType = 'expired';
                  message = `Desativada - venceu em ${dueDate.format('DD/MM/YYYY')}`;
                  result.expired++;
                }
                
                // Remover trial expirado
                await company.update({ trialExpiration: null });
              }
            } else {
              // Trial expirou e não tem data de vencimento - desativar
              if (company.status) {
                newStatus = false;
                shouldUpdate = true;
                statusType = 'expired';
                message = `Empresa desativada - período de avaliação expirou`;
                result.expired++;
              } else {
                statusType = 'expired';
                message = `Desativada - período de avaliação expirado`;
                result.expired++;
              }
              
              // Remover trial expirado
              await company.update({ trialExpiration: null });
            }
          }
        } else if (company.dueDate) {
          // Não está em trial, verificar apenas data de vencimento
          const dueDate = moment(company.dueDate);
          
          if (dueDate.isAfter(now)) {
            // Data de vencimento não passou - deve estar ativa
            if (!company.status) {
              newStatus = true;
              shouldUpdate = true;
              statusType = 'activated';
              message = `Empresa ativada - vencimento em ${dueDate.format('DD/MM/YYYY')}`;
              result.activated++;
            } else {
              message = `Ativa - vencimento em ${dueDate.format('DD/MM/YYYY')}`;
            }
          } else {
            // Data de vencimento passou - desativar
            if (company.status) {
              newStatus = false;
              shouldUpdate = true;
              statusType = 'expired';
              message = `Empresa desativada - venceu em ${dueDate.format('DD/MM/YYYY')}`;
              result.expired++;
            } else {
              statusType = 'expired';
              message = `Desativada - venceu em ${dueDate.format('DD/MM/YYYY')}`;
              result.expired++;
            }
          }
        }

        // Atualizar status se necessário
        if (shouldUpdate) {
          await company.update({ status: newStatus });
          logger.info(`Status da empresa ${company.name} atualizado para ${newStatus ? 'ativa' : 'inativa'}`);
          
          // Emitir evento Socket.IO para notificar mudança de status
          try {
            const io = getIO();
            if (statusType === 'expired') {
              // Empresa foi bloqueada
              io.emit(`company-${company.id}-status-updated`, {
                action: "company_blocked",
                company: {
                  id: company.id,
                  status: false,
                  isExpired: true,
                  reason: "automatic_expiration_check"
                }
              });
              logger.info(`Socket.IO event emitted for company ${company.id} - blocked`);
            } else if (statusType === 'activated' || statusType === 'trial') {
              // Empresa foi reativada
              io.emit(`company-${company.id}-status-updated`, {
                action: "company_reactivated",
                company: {
                  id: company.id,
                  status: true,
                  isExpired: false,
                  isInTrial: statusType === 'trial'
                }
              });
              logger.info(`Socket.IO event emitted for company ${company.id} - reactivated`);
            }
          } catch (socketError) {
            logger.warn(`Failed to emit Socket.IO event for company ${company.id}:`, socketError);
          }
        }

        result.details.push({
          companyId: company.id,
          companyName: company.name,
          status: statusType,
          dueDate: company.dueDate,
          trialExpiration: company.trialExpiration ? moment(company.trialExpiration).format('YYYY-MM-DD') : undefined,
          message
        });

      } catch (error: any) {
        logger.error(`Erro ao verificar empresa ${company.name}:`, error);
        result.details.push({
          companyId: company.id,
          companyName: company.name,
          status: 'no_change',
          message: `Erro: ${error.message}`
        });
      }
    }

    logger.info(`Verificação concluída: ${result.expired} expiradas, ${result.activated} ativadas, ${result.inTrial} em trial`);

    return result;

  } catch (error: any) {
    logger.error('Error checking company expiration:', error);
    throw error;
  }
};

export default CheckCompanyExpirationService;