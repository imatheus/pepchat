import { logger } from "../utils/logger";
import Setting from "../models/Setting";
import "../database"; // Inicializar conexão com banco

/**
 * Script para remover configurações de chatBotType do banco de dados
 * 
 * MOTIVO:
 * - O campo "Tipo de Interface do Chatbot" foi removido da interface
 * - O Baileys sempre usa texto, então não há necessidade de configuração
 * - Limpeza do banco de dados removendo configurações obsoletas
 */

const removeChatBotTypeSettings = async () => {
  try {
    logger.info("🗑️ Iniciando remoção das configurações chatBotType...");

    // Buscar todas as configurações chatBotType
    const chatBotTypeSettings = await Setting.findAll({
      where: { key: "chatBotType" }
    });

    logger.info(`📋 Encontradas ${chatBotTypeSettings.length} configurações chatBotType para remover`);

    if (chatBotTypeSettings.length === 0) {
      logger.info("ℹ️ Nenhuma configuração chatBotType encontrada. Nada para remover.");
      return;
    }

    // Remover todas as configurações chatBotType
    const deletedCount = await Setting.destroy({
      where: { key: "chatBotType" }
    });

    logger.info(`✅ ${deletedCount} configurações chatBotType removidas com sucesso`);

    // Verificar se a remoção foi bem-sucedida
    const remainingSettings = await Setting.count({
      where: { key: "chatBotType" }
    });

    if (remainingSettings === 0) {
      logger.info("🎉 Todas as configurações chatBotType foram removidas com sucesso!");
    } else {
      logger.warn(`⚠️ Ainda restam ${remainingSettings} configurações chatBotType no banco`);
    }

    logger.info("\n📊 Resumo da limpeza:");
    logger.info(`🗑️ Configurações removidas: ${deletedCount}`);
    logger.info(`📋 Configurações restantes: ${remainingSettings}`);

  } catch (error) {
    logger.error("❌ Erro ao remover configurações chatBotType:", error);
    throw error;
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  removeChatBotTypeSettings()
    .then(() => {
      logger.info("✅ Script executado com sucesso");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Erro ao executar script:", error);
      process.exit(1);
    });
}

export default removeChatBotTypeSettings;