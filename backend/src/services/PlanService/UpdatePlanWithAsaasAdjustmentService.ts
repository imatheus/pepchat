import { Transaction } from "sequelize";
import AppError from "../../errors/AppError";
import Plan from "../../models/Plan";
import Company from "../../models/Company";
import CompanyPlan from "../../models/CompanyPlan";
import AsaasConfig from "../../models/AsaasConfig";
import AsaasService from "../AsaasService/AsaasService";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import sequelize from "../../database";

interface PlanData {
  name: string;
  id?: number | string;
  users?: number;
  connections?: number;
  queues?: number;
  value?: number;
  useWhatsapp?: boolean;
  useCampaigns?: boolean;
  campaignContactsLimit?: number;
  campaignsPerMonthLimit?: number;
}

interface AffectedCompany {
  id: number;
  name: string;
  asaasSubscriptionId: string;
  oldValue: number;
  newValue: number;
  licenseCount: number;
}

interface UpdateResult {
  plan: Plan;
  affectedCompanies: AffectedCompany[];
  successfulUpdates: number;
  failedUpdates: number;
  errors: string[];
}

const UpdatePlanWithAsaasAdjustmentService = async (planData: PlanData): Promise<UpdateResult> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id, name, users, connections, queues, value, useWhatsapp, useCampaigns, campaignContactsLimit, campaignsPerMonthLimit } = planData;

    // 1. Buscar o plano atual
    const plan = await Plan.findByPk(id, { transaction });
    if (!plan) {
      throw new AppError("ERR_NO_PLAN_FOUND", 404);
    }

    // Armazenar valores antigos para comparação
    const oldValue = plan.value;
    const oldName = plan.name;
    const valueChanged = value !== undefined && value !== oldValue;
    const nameChanged = name !== undefined && name !== oldName;

    // 2. Validações básicas (mesmo código do UpdatePlanService original)
    if (name && name !== plan.name) {
      const existingPlan = await Plan.findOne({
        where: { name },
        transaction
      });

      if (existingPlan && existingPlan.id !== plan.id) {
        throw new AppError("ERR_PLAN_NAME_ALREADY_EXISTS");
      }
    }

    // Validar valores numéricos se fornecidos
    if (users !== undefined && (isNaN(users) || users < 0)) {
      throw new AppError("ERR_PLAN_INVALID_USERS");
    }
    if (connections !== undefined && (isNaN(connections) || connections < 0)) {
      throw new AppError("ERR_PLAN_INVALID_CONNECTIONS");
    }
    if (queues !== undefined && (isNaN(queues) || queues < 0)) {
      throw new AppError("ERR_PLAN_INVALID_QUEUES");
    }
    if (value !== undefined && (isNaN(value) || value < 0)) {
      throw new AppError("ERR_PLAN_INVALID_VALUE");
    }
    if (campaignContactsLimit !== undefined && (isNaN(campaignContactsLimit) || campaignContactsLimit < 0)) {
      throw new AppError("ERR_PLAN_INVALID_CAMPAIGN_CONTACTS_LIMIT");
    }
    if (campaignsPerMonthLimit !== undefined && (isNaN(campaignsPerMonthLimit) || campaignsPerMonthLimit < 0)) {
      throw new AppError("ERR_PLAN_INVALID_CAMPAIGNS_PER_MONTH_LIMIT");
    }

    // 3. Atualizar o plano
    await plan.update({
      name,
      users,
      connections,
      queues,
      value,
      useWhatsapp,
      useCampaigns,
      campaignContactsLimit,
      campaignsPerMonthLimit
    }, { transaction });

    let affectedCompanies: AffectedCompany[] = [];
    let successfulUpdates = 0;
    let failedUpdates = 0;
    let errors: string[] = [];

    // 4. Se o valor ou nome foi alterado, processar ajustes automáticos
    if ((valueChanged && value !== undefined) || nameChanged) {
      if (valueChanged) {
        logger.info(`Plan ${plan.name} (ID: ${plan.id}) value changed from ${oldValue} to ${value}. Starting automatic adjustments...`);
      }
      if (nameChanged) {
        logger.info(`Plan ${plan.name} (ID: ${plan.id}) name changed from "${oldName}" to "${name}". Updating subscription descriptions...`);
      }

      // 4.1. Identificar todas as empresas vinculadas a este plano
      const companiesWithPlan = await Company.findAll({
        where: { planId: plan.id },
        include: [
          {
            model: CompanyPlan,
            as: 'companyPlans',
            where: { isActive: true },
            required: false
          }
        ],
        transaction
      });

      // 4.2. Identificar empresas com planos personalizados baseados neste plano
      const companiesWithCustomPlan = await Company.findAll({
        include: [
          {
            model: CompanyPlan,
            as: 'companyPlans',
            where: { 
              basePlanId: plan.id,
              isActive: true 
            },
            required: true
          }
        ],
        transaction
      });

      // Combinar todas as empresas afetadas
      const allAffectedCompanies = [...companiesWithPlan, ...companiesWithCustomPlan];
      
      // Remover duplicatas
      const uniqueCompanies = allAffectedCompanies.filter((company, index, self) => 
        index === self.findIndex(c => c.id === company.id)
      );

      logger.info(`Found ${uniqueCompanies.length} companies affected by plan ${valueChanged ? 'value' : 'name'} change`);

      // 4.3. Buscar configuração do Asaas
      const asaasConfig = await AsaasConfig.findOne();
      if (!asaasConfig) {
        throw new AppError("ERR_ASAAS_CONFIG_NOT_FOUND");
      }

      const asaasService = new AsaasService(asaasConfig.apiKey, asaasConfig.environment);

      // 4.4. Processar cada empresa afetada
      for (const company of uniqueCompanies) {
        try {
          if (!company.asaasSubscriptionId) {
            logger.warn(`Company ${company.name} (ID: ${company.id}) has no Asaas subscription ID. Skipping...`);
            continue;
          }

          // Determinar número de licenças e calcular valores
          let licenseCount = 1;
          let oldTotalValue = oldValue;
          let newTotalValue = valueChanged ? value : oldValue;

          // Se a empresa tem plano personalizado, usar os dados do CompanyPlan
          const activeCompanyPlan = company.companyPlans?.find(cp => cp.isActive);
          if (activeCompanyPlan) {
            licenseCount = activeCompanyPlan.users;
            oldTotalValue = activeCompanyPlan.totalValue;
            
            if (valueChanged) {
              newTotalValue = value * licenseCount;
              
              // Atualizar o CompanyPlan com o novo preço por usuário e valor total
              await activeCompanyPlan.update({
                pricePerUser: value,
                totalValue: newTotalValue
              }, { transaction });

              logger.info(`Updated CompanyPlan for company ${company.name}: ${licenseCount} licenses × ${value} = ${newTotalValue}`);
            } else {
              // Se apenas o nome mudou, manter o valor atual
              newTotalValue = activeCompanyPlan.totalValue;
            }
          } else {
            // Empresa usa plano padrão, assumir 1 licença
            licenseCount = 1;
            newTotalValue = valueChanged ? value : oldValue;
          }

          // Registrar empresa afetada
          affectedCompanies.push({
            id: company.id,
            name: company.name,
            asaasSubscriptionId: company.asaasSubscriptionId,
            oldValue: oldTotalValue,
            newValue: newTotalValue,
            licenseCount
          });

          // 4.5. Atualizar assinatura no Asaas
          try {
            const updateData: any = {
              description: `${plan.name}`
            };
            
            // Só incluir o valor se ele realmente mudou
            if (valueChanged) {
              updateData.value = newTotalValue;
            }
            
            await asaasService.updateSubscription(company.asaasSubscriptionId, updateData);

            successfulUpdates++;
            logger.info(`Successfully updated Asaas subscription for company ${company.name} (ID: ${company.id}): ${oldTotalValue} → ${newTotalValue}`);

            // Emitir evento via Socket.IO
            const io = getIO();
            io.emit(`company-${company.id}-subscription-updated`, {
              action: valueChanged ? "plan_value_adjusted" : "plan_description_updated",
              company: {
                id: company.id,
                name: company.name
              },
              plan: {
                id: plan.id,
                name: plan.name,
                oldName: oldName,
                oldValue: oldValue,
                newValue: valueChanged ? value : oldValue
              },
              subscription: {
                oldTotalValue: oldTotalValue,
                newTotalValue: newTotalValue,
                licenseCount: licenseCount
              }
            });

          } catch (asaasError: any) {
            failedUpdates++;
            const errorMessage = `Failed to update Asaas subscription for company ${company.name} (ID: ${company.id}): ${asaasError.message}`;
            errors.push(errorMessage);
            logger.error(errorMessage, asaasError);

            // Em caso de erro no Asaas, reverter alterações no CompanyPlan se necessário
            if (activeCompanyPlan) {
              await activeCompanyPlan.update({
                pricePerUser: oldValue,
                totalValue: oldTotalValue
              }, { transaction });
            }
          }

        } catch (companyError: any) {
          failedUpdates++;
          const errorMessage = `Error processing company ${company.name} (ID: ${company.id}): ${companyError.message}`;
          errors.push(errorMessage);
          logger.error(errorMessage, companyError);
        }
      }

      // 4.6. Log de auditoria
      logger.info(`Plan value adjustment completed for plan ${plan.name} (ID: ${plan.id}):`, {
        oldValue: oldValue,
        newValue: value,
        affectedCompanies: affectedCompanies.length,
        successfulUpdates: successfulUpdates,
        failedUpdates: failedUpdates,
        errors: errors
      });

      // Se houve falhas, mas algumas atualizações foram bem-sucedidas, não reverter a transação
      // Apenas logar os erros para retry posterior
      if (failedUpdates > 0) {
        logger.warn(`${failedUpdates} subscription updates failed. These will need to be retried.`);
      }
    }

    // 5. Commit da transação
    await transaction.commit();

    // 6. Emitir evento geral de atualização do plano
    const io = getIO();
    io.emit("plan", {
      action: "update",
      plan: plan,
      valueChanged: valueChanged,
      affectedCompanies: affectedCompanies.length
    });

    return {
      plan,
      affectedCompanies,
      successfulUpdates,
      failedUpdates,
      errors
    };

  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error in UpdatePlanWithAsaasAdjustmentService:', error);
    throw new AppError(error.message || "Erro ao atualizar plano com ajuste automático");
  }
};

export default UpdatePlanWithAsaasAdjustmentService;