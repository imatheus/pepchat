import moment from "moment";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "../AsaasService/AsaasService";
import CreateAsaasSubscriptionForCompanyService from "../AsaasService/CreateAsaasSubscriptionForCompanyService";
import { logger } from "../../utils/logger";

interface Request {
  companyId: number;
  dueDate: string; // Data no formato YYYY-MM-DD
  updateAsaas?: boolean; // Se deve atualizar no Asaas também
  updateTrialExpiration?: boolean; // Se deve atualizar o período de avaliação
}

interface Response {
  success: boolean;
  message: string;
  company: Company;
  asaasUpdated?: boolean;
  trialUpdated?: boolean;
}

const SyncCompanyDueDateService = async ({
  companyId,
  dueDate,
  updateAsaas = true,
  updateTrialExpiration = true
}: Request): Promise<Response> => {
  try {
    // Validar formato da data
    if (!moment(dueDate, 'YYYY-MM-DD', true).isValid()) {
      throw new AppError("Data de vencimento inválida. Use o formato YYYY-MM-DD", 400);
    }

    // Buscar a empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new AppError("Empresa não encontrada", 404);
    }

    const result: Response = {
      success: false,
      message: "",
      company,
      asaasUpdated: false,
      trialUpdated: false
    };

    // Calcular nova data de expiração do trial (7 dias antes da data de vencimento)
    const newTrialExpiration = moment(dueDate).subtract(7, 'days').toDate();
    const now = moment();

    // Atualizar dados da empresa
    const updateData: any = {
      dueDate: dueDate
    };

    // Se deve atualizar o período de avaliação
    if (updateTrialExpiration) {
      // Se a nova data de trial for no futuro, definir como trial
      if (moment(newTrialExpiration).isAfter(now)) {
        updateData.trialExpiration = newTrialExpiration;
        updateData.status = true; // Manter ativa durante o trial
        result.trialUpdated = true;
      } else {
        // Se a data de trial já passou, verificar se a data de vencimento já passou também
        if (moment(dueDate).isAfter(now)) {
          updateData.trialExpiration = null; // Remover trial
          updateData.status = true; // Ativar empresa
        } else {
          updateData.trialExpiration = null;
          updateData.status = false; // Desativar se venceu
        }
        result.trialUpdated = true;
      }
    } else {
      // Se não deve atualizar trial (caso do webhook de pagamento confirmado)
      // Sempre ativar a empresa e remover trial quando há pagamento
      updateData.status = true; // Ativar empresa
      updateData.trialExpiration = null; // Remover trial se existir
      logger.info(`Company ${companyId} activated due to payment confirmation with due date: ${dueDate}`);
    }

    // Atualizar empresa no banco
    await company.update(updateData);
    await company.reload();

    logger.info(`Data de vencimento da empresa ${company.name} atualizada para ${dueDate}`);

    // Atualizar no Asaas se solicitado
    if (updateAsaas) {
      try {
        // Buscar configuração do Asaas
        const asaasConfig = await AsaasConfig.findOne();
        
        if (asaasConfig && asaasConfig.enabled && asaasConfig.apiKey) {
          // Se a empresa não tem assinatura no Asaas, criar uma
          if (!company.asaasSubscriptionId) {
            try {
              const subscriptionResult = await CreateAsaasSubscriptionForCompanyService({
                companyId: company.id
              });
              
              if (subscriptionResult.success) {
                await company.reload(); // Recarregar para pegar o asaasSubscriptionId
                result.asaasUpdated = true;
                logger.info(`Assinatura criada no Asaas para empresa ${company.name}: ${subscriptionResult.subscriptionId}`);
              }
            } catch (subscriptionError: any) {
              logger.error(`Erro ao criar assinatura no Asaas: ${subscriptionError.message}`);
            }
          } else {
            // Atualizar assinatura existente
            const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);
            
            await asaasService.updateSubscription(company.asaasSubscriptionId, {
              nextDueDate: dueDate
            });

            // Atualizar data de sincronização
            await company.update({ asaasSyncedAt: new Date() });

            result.asaasUpdated = true;
            logger.info(`${company.asaasSubscriptionId} atualizada no Asaas com nova data: ${dueDate}`);
          }
        } else {
          logger.warn("Configuração do Asaas não encontrada ou inativa");
        }
      } catch (asaasError: any) {
        logger.error(`Erro ao processar assinatura no Asaas: ${asaasError.message}`);
        // Não falha o processo se houver erro no Asaas
      }
    }

    result.success = true;
    result.company = company;
    
    if (result.asaasUpdated && result.trialUpdated) {
      result.message = `Data de vencimento, período de avaliação e assinatura no Asaas atualizados com sucesso`;
    } else if (result.asaasUpdated) {
      result.message = `Data de vencimento e assinatura no Asaas atualizados com sucesso`;
    } else if (result.trialUpdated) {
      result.message = `Data de vencimento e período de avaliação atualizados com sucesso`;
    } else {
      result.message = `Data de vencimento atualizada com sucesso`;
    }

    return result;

  } catch (error: any) {
    logger.error('Error syncing company due date:', error);
    throw new AppError(error.message || "Erro ao sincronizar data de vencimento");
  }
};

export default SyncCompanyDueDateService;