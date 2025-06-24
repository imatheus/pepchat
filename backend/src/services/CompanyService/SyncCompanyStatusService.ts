import moment from "moment";
import Company from "../../models/Company";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";

interface Request {
  companyId: number;
  forceUpdate?: boolean;
}

interface Response {
  company: Company;
  statusChanged: boolean;
  previousStatus: boolean;
  newStatus: boolean;
  isInTrial: boolean;
  isExpired: boolean;
  message: string;
}

const SyncCompanyStatusService = async ({
  companyId,
  forceUpdate = false
}: Request): Promise<Response> => {
  const company = await Company.findByPk(companyId);
  
  if (!company) {
    throw new Error(`Empresa com ID ${companyId} não encontrada`);
  }

  const now = moment();
  const previousStatus = company.status;
  let newStatus = company.status;
  let isInTrial = false;
  let isExpired = false;
  let statusChanged = false;
  let message = "";

  // Verificar período de avaliação primeiro
  if (company.trialExpiration) {
    const trialExpiration = moment(company.trialExpiration);
    isInTrial = trialExpiration.isAfter(now);
    
    if (isInTrial) {
      // Ainda em trial - deve estar ativa
      newStatus = true;
      isExpired = false;
      const daysRemaining = Math.ceil(trialExpiration.diff(now, 'days', true));
      message = `Empresa em período de avaliação - ${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`;
    } else {
      // Trial expirou, verificar data de vencimento
      if (company.dueDate) {
        const dueDate = moment(company.dueDate);
        isExpired = dueDate.isBefore(now);
        newStatus = !isExpired;
        
        if (isExpired) {
          const daysExpired = Math.ceil(now.diff(dueDate, 'days', true));
          message = `Empresa vencida há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}`;
        } else {
          const daysRemaining = Math.ceil(dueDate.diff(now, 'days', true));
          message = `Empresa ativa - vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
        }
      } else {
        // Sem data de vencimento e trial expirado
        isExpired = true;
        newStatus = false;
        message = "Período de avaliação expirado";
      }
      
      // Remover trial expirado
      if (company.trialExpiration) {
        await company.update({ trialExpiration: null });
        logger.info(`Trial expirado removido da empresa ${company.name}`);
      }
    }
  } else if (company.dueDate) {
    // Não está em trial, verificar apenas data de vencimento
    const dueDate = moment(company.dueDate);
    isExpired = dueDate.isBefore(now);
    newStatus = !isExpired;
    
    if (isExpired) {
      const daysExpired = Math.ceil(now.diff(dueDate, 'days', true));
      message = `Empresa vencida há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}`;
    } else {
      const daysRemaining = Math.ceil(dueDate.diff(now, 'days', true));
      message = `Empresa ativa - vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
    }
  } else {
    // Sem trial e sem data de vencimento - manter status atual
    message = newStatus ? "Empresa ativa" : "Empresa inativa";
  }

  // Verificar se o status mudou
  statusChanged = previousStatus !== newStatus;

  // Atualizar status se mudou ou se forçado
  if (statusChanged || forceUpdate) {
    await company.update({ status: newStatus });
    logger.info(`Status da empresa ${company.name} ${statusChanged ? 'atualizado' : 'sincronizado'}: ${newStatus ? 'ativa' : 'inativa'} - ${message}`);

    // Emitir evento via socket se o status mudou
    if (statusChanged) {
      const io = getIO();
      const eventData = {
        action: newStatus ? "company_reactivated" : "company_blocked",
        company: {
          id: company.id,
          name: company.name,
          status: newStatus,
          isInTrial,
          isExpired,
          dueDate: company.dueDate,
          trialExpiration: company.trialExpiration
        },
        message
      };

      // Emitir para todos os usuários da empresa
      io.to(`company:${company.id}`).emit(`company-${company.id}-status-updated`, eventData);
      
      logger.info(`Evento de mudança de status emitido para empresa ${company.name}: ${eventData.action}`);
    }
  }

  return {
    company: await company.reload(), // Recarregar para obter dados atualizados
    statusChanged,
    previousStatus,
    newStatus,
    isInTrial,
    isExpired,
    message
  };
};

export default SyncCompanyStatusService;