import { logger } from "../utils/logger";
import Setting from "../models/Setting";
import Company from "../models/Company";
import "../database"; // Inicializar conexão com banco

/**
 * Script para corrigir configurações de CheckMsgIsGroup
 * 
 * PROBLEMA IDENTIFICADO:
 * - Quando CheckMsgIsGroup = "enabled", o sistema IGNORA mensagens de grupos
 * - Isso causa timeouts ao tentar enviar mensagens para grupos
 * 
 * SOLUÇÃO:
 * - Inverter a lógica: "enabled" = processar grupos, "disabled" = ignorar grupos
 * - Atualizar todas as configurações existentes
 */

const fixGroupMessageSettings = async () => {
  try {
    logger.info("🔧 Iniciando correção das configurações de mensagens de grupos...");

    // Buscar todas as configurações CheckMsgIsGroup
    const groupSettings = await Setting.findAll({
      where: { key: "CheckMsgIsGroup" },
      include: [{ model: Company, as: "company" }]
    });

    logger.info(`📋 Encontradas ${groupSettings.length} configurações CheckMsgIsGroup`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const setting of groupSettings) {
      const company = (setting as any).company;
      logger.info(`\n🏢 Empresa: ${company?.name || 'N/A'} (ID: ${setting.companyId})`);
      logger.info(`   Valor atual: ${setting.value}`);

      // A lógica correta deve ser:
      // "enabled" = processar mensagens de grupos (permitir)
      // "disabled" = ignorar mensagens de grupos (bloquear)
      
      // Como a maioria das empresas quer processar grupos, vamos definir como "enabled"
      if (setting.value !== "enabled") {
        await setting.update({ value: "enabled" });
        logger.info(`   ✅ Corrigido para: enabled (processar grupos)`);
        fixedCount++;
      } else {
        logger.info(`   ℹ️  Já está correto: enabled (processar grupos)`);
        alreadyCorrectCount++;
      }
    }

    // Verificar se existem empresas sem a configuração
    const allCompanies = await Company.findAll({
      attributes: ['id', 'name'],
      include: [{
        model: Setting,
        as: 'settings',
        where: { key: "CheckMsgIsGroup" },
        required: false
      }]
    });

    let createdCount = 0;
    for (const company of allCompanies) {
      const hasGroupSetting = (company as any).settings?.some((s: any) => s.key === "CheckMsgIsGroup");
      
      if (!hasGroupSetting) {
        await Setting.create({
          companyId: company.id,
          key: "CheckMsgIsGroup",
          value: "enabled" // Permitir mensagens de grupos por padrão
        });
        logger.info(`✅ Configuração CheckMsgIsGroup criada para empresa ${company.name} (ID: ${company.id})`);
        createdCount++;
      }
    }

    logger.info(`\n📊 Resumo da correção:`);
    logger.info(`✅ Configurações corrigidas: ${fixedCount}`);
    logger.info(`ℹ️  Configurações já corretas: ${alreadyCorrectCount}`);
    logger.info(`🆕 Configurações criadas: ${createdCount}`);
    logger.info(`📋 Total de empresas: ${allCompanies.length}`);

    // Verificar configuração final
    const finalGroupSettings = await Setting.count({
      where: { key: "CheckMsgIsGroup" }
    });

    logger.info(`\n📊 Total de configurações CheckMsgIsGroup após correção: ${finalGroupSettings}`);

    logger.info("\n🎉 Correção das configurações de mensagens de grupos concluída!");
    logger.info("\n📝 IMPORTANTE:");
    logger.info("   - enabled = processar mensagens de grupos (PERMITIR)");
    logger.info("   - disabled = ignorar mensagens de grupos (BLOQUEAR)");
    logger.info("   - Todas as empresas agora estão configuradas para processar grupos");

  } catch (error) {
    logger.error("❌ Erro ao corrigir configurações de mensagens de grupos:", error);
    throw error;
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  fixGroupMessageSettings()
    .then(() => {
      logger.info("✅ Script executado com sucesso");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Erro ao executar script:", error);
      process.exit(1);
    });
}

export default fixGroupMessageSettings;