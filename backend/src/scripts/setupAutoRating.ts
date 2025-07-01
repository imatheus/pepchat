import "../bootstrap";
import Company from "../models/Company";
import Setting from "../models/Setting";
import { logger } from "../utils/logger";

/**
 * Script para configurar avaliação automática em empresas existentes
 */
const setupAutoRatingForExistingCompanies = async (): Promise<void> => {
  try {
    logger.info("Iniciando configuração de avaliação automática para empresas existentes...");

    // Buscar todas as empresas
    const companies = await Company.findAll({
      attributes: ['id', 'name']
    });

    logger.info(`Encontradas ${companies.length} empresas para configurar`);

    let successCount = 0;
    let errorCount = 0;

    for (const company of companies) {
      try {
        // Verificar se já existe a configuração
        const existingSetting = await Setting.findOne({
          where: {
            companyId: company.id,
            key: "autoRating"
          }
        });

        if (existingSetting) {
          logger.info(`Empresa ${company.name} (ID: ${company.id}) já possui configuração de autoRating: ${existingSetting.value}`);
          continue;
        }

        // Criar configuração de avaliação automática
        await Setting.create({
          companyId: company.id,
          key: "autoRating",
          value: "enabled"
        });

        logger.info(`✅ Configuração de autoRating criada para empresa ${company.name} (ID: ${company.id})`);
        successCount++;

      } catch (error) {
        logger.error(`❌ Erro ao configurar empresa ${company.name} (ID: ${company.id}):`, error);
        errorCount++;
      }
    }

    logger.info(`\n📊 Resumo da configuração:`);
    logger.info(`✅ Empresas configuradas com sucesso: ${successCount}`);
    logger.info(`❌ Empresas com erro: ${errorCount}`);
    logger.info(`ℹ️  Empresas que já tinham configuração: ${companies.length - successCount - errorCount}`);

    if (errorCount === 0) {
      logger.info(`\n🎉 Todas as empresas foram configuradas com sucesso!`);
    } else {
      logger.warn(`\n⚠️  Algumas empresas tiveram problemas na configuração. Verifique os logs acima.`);
    }

  } catch (error) {
    logger.error("Erro fatal ao configurar avaliação automática:", error);
    process.exit(1);
  }
};

/**
 * Script para verificar o status das configurações
 */
const checkAutoRatingStatus = async (): Promise<void> => {
  try {
    logger.info("Verificando status das configurações de avaliação automática...");

    const settings = await Setting.findAll({
      where: {
        key: "autoRating"
      },
      include: [
        {
          model: Company,
          as: "company",
          attributes: ['id', 'name']
        }
      ]
    });

    logger.info(`\n📋 Status das configurações (${settings.length} empresas):`);

    const enabledCount = settings.filter(s => s.value === "enabled").length;
    const disabledCount = settings.filter(s => s.value === "disabled").length;

    settings.forEach(setting => {
      const status = setting.value === "enabled" ? "✅ HABILITADO" : "❌ DESABILITADO";
      logger.info(`  ${(setting as any).company.name} (ID: ${(setting as any).company.id}): ${status}`);
    });

    logger.info(`\n📊 Resumo:`);
    logger.info(`✅ Habilitado: ${enabledCount} empresas`);
    logger.info(`❌ Desabilitado: ${disabledCount} empresas`);

  } catch (error) {
    logger.error("Erro ao verificar status:", error);
  }
};

// Executar baseado no argumento passado
const main = async (): Promise<void> => {
  const action = process.argv[2];

  switch (action) {
    case "setup":
      await setupAutoRatingForExistingCompanies();
      break;
    case "status":
      await checkAutoRatingStatus();
      break;
    default:
      logger.info("Uso:");
      logger.info("  npm run script:auto-rating setup  - Configurar empresas existentes");
      logger.info("  npm run script:auto-rating status - Verificar status das configurações");
      break;
  }

  process.exit(0);
};

main().catch(error => {
  logger.error("Erro na execução do script:", error);
  process.exit(1);
});