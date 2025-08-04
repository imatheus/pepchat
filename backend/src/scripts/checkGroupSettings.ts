import Setting from "../models/Setting";
import { logger } from "../utils/logger";
import "../database"; // Inicializar conexão com banco

const checkGroupSettings = async () => {
  try {
    logger.info("🔍 Verificando configurações de mensagens de grupos...");

    const groupSettings = await Setting.findAll({
      where: { key: "CheckMsgIsGroup" },
      order: [['companyId', 'ASC']]
    });

    logger.info(`📊 Total de configurações CheckMsgIsGroup: ${groupSettings.length}`);
    
    groupSettings.forEach(setting => {
      logger.info(`🏢 Empresa ${setting.companyId}: ${setting.value}`);
    });

    // Verificar se há configurações problemáticas restantes
    const problematicSettings = await Setting.findAll({
      where: { key: "enabled" }
    });

    if (problematicSettings.length > 0) {
      logger.warn(`⚠️  Ainda existem ${problematicSettings.length} configurações problemáticas`);
    } else {
      logger.info("✅ Nenhuma configuração problemática encontrada");
    }

    process.exit(0);
  } catch (error) {
    logger.error(error, "❌ Erro ao verificar configurações");
    process.exit(1);
  }
};

checkGroupSettings();