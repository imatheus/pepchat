import Setting from "../models/Setting";
import { logger } from "../utils/logger";
import "../database"; // Inicializar conexão com banco

/**
 * Script para corrigir configurações de CheckMsgIsGroup que foram criadas incorretamente
 */
const fixGroupMessageSettings = async () => {
  try {
    logger.info("🔧 Iniciando correção das configurações de mensagens de grupos...");

    // Buscar todas as configurações com problemas
    const problematicSettings = await Setting.findAll({
      where: {
        key: "enabled" // Configurações criadas com key incorreta
      }
    });

    logger.info(`📋 Encontradas ${problematicSettings.length} configurações com problemas`);

    for (const setting of problematicSettings) {
      logger.info(`🔄 Corrigindo configuração da empresa ${setting.companyId}`);
      
      // Verificar se já existe uma configuração correta
      const existingCorrectSetting = await Setting.findOne({
        where: {
          companyId: setting.companyId,
          key: "CheckMsgIsGroup"
        }
      });

      if (!existingCorrectSetting) {
        // Criar a configuração correta
        await Setting.create({
          companyId: setting.companyId,
          key: "CheckMsgIsGroup",
          value: "enabled" // Valor padrão
        });
        logger.info(`✅ Configuração CheckMsgIsGroup criada para empresa ${setting.companyId}`);
      } else {
        logger.info(`ℹ️  Configuração CheckMsgIsGroup já existe para empresa ${setting.companyId}`);
      }

      // Remover a configuração problemática
      await setting.destroy();
      logger.info(`🗑️  Configuração problemática removida para empresa ${setting.companyId}`);
    }

    // Verificar se todas as empresas têm a configuração CheckMsgIsGroup
    const allCompanies = await Setting.findAll({
      attributes: ['companyId'],
      group: ['companyId'],
      raw: true
    });

    logger.info(`🏢 Verificando ${allCompanies.length} empresas...`);

    for (const company of allCompanies) {
      const hasGroupSetting = await Setting.findOne({
        where: {
          companyId: company.companyId,
          key: "CheckMsgIsGroup"
        }
      });

      if (!hasGroupSetting) {
        await Setting.create({
          companyId: company.companyId,
          key: "CheckMsgIsGroup",
          value: "enabled"
        });
        logger.info(`✅ Configuração CheckMsgIsGroup criada para empresa ${company.companyId}`);
      }
    }

    logger.info("🎉 Correção das configurações de mensagens de grupos concluída com sucesso!");

    // Mostrar estatísticas finais
    const totalGroupSettings = await Setting.count({
      where: { key: "CheckMsgIsGroup" }
    });

    logger.info(`📊 Total de configurações CheckMsgIsGroup: ${totalGroupSettings}`);

  } catch (error) {
    logger.error(error, "❌ Erro ao corrigir configurações de mensagens de grupos");
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
      logger.error(error, "❌ Erro ao executar script");
      process.exit(1);
    });
}

export default fixGroupMessageSettings;