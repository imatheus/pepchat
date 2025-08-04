import "../database"; // Inicializar conexão com banco
import { logger } from "../utils/logger";
import { getWbot } from "../libs/wbot";
import Whatsapp from "../models/Whatsapp";

const checkWhatsAppConnection = async () => {
  try {
    logger.info("🔍 Verificando conexões WhatsApp...");

    // Buscar todas as conexões WhatsApp
    const whatsapps = await Whatsapp.findAll({
      order: [['id', 'ASC']]
    });

    if (whatsapps.length === 0) {
      logger.warn("⚠️ Nenhuma conexão WhatsApp encontrada");
      process.exit(1);
    }

    logger.info(`📱 Encontradas ${whatsapps.length} conexões WhatsApp`);

    for (const whatsapp of whatsapps) {
      logger.info(`\n🔍 Verificando conexão: ${whatsapp.name} (ID: ${whatsapp.id})`);
      logger.info(`📊 Status no banco: ${whatsapp.status}`);
      logger.info(`🏢 Empresa: ${whatsapp.companyId}`);

      try {
        const wbot = getWbot(whatsapp.id);
        
        if (!wbot) {
          logger.error(`❌ Bot não encontrado para conexão ${whatsapp.id}`);
          continue;
        }

        // Verificar se o bot tem usuário conectado
        if (wbot.user) {
          logger.info(`✅ Bot conectado: ${wbot.user.id}`);
          logger.info(`👤 Nome: ${wbot.user.name || 'N/A'}`);
          
          // Testar conectividade básica
          try {
            const state = wbot.ws?.readyState;
            logger.info(`🌐 WebSocket State: ${state} (1=OPEN, 0=CONNECTING, 2=CLOSING, 3=CLOSED)`);
            
            if (state === 1) {
              logger.info(`🟢 Conexão WebSocket ativa`);
              
              // Testar uma operação simples
              try {
                await Promise.race([
                  wbot.fetchStatus(wbot.user.id),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout")), 10000)
                  )
                ]);
                logger.info(`✅ Teste de conectividade passou`);
              } catch (testError) {
                logger.warn(`⚠️ Teste de conectividade falhou: ${testError.message}`);
              }
            } else {
              logger.warn(`🟡 WebSocket não está aberto`);
            }
          } catch (wsError) {
            logger.warn(`⚠️ Erro ao verificar WebSocket: ${wsError.message}`);
          }
        } else {
          logger.warn(`🟡 Bot não tem usuário conectado`);
        }

      } catch (error: any) {
        logger.error(`❌ Erro ao verificar bot ${whatsapp.id}: ${error.message}`);
      }
    }

    // Verificar conexões ativas
    const activeConnections = whatsapps.filter(w => w.status === "CONNECTED");
    const inactiveConnections = whatsapps.filter(w => w.status !== "CONNECTED");

    logger.info(`\n📊 Resumo:`);
    logger.info(`✅ Conexões ativas: ${activeConnections.length}`);
    logger.info(`❌ Conexões inativas: ${inactiveConnections.length}`);

    if (activeConnections.length === 0) {
      logger.error(`🚨 PROBLEMA: Nenhuma conexão WhatsApp ativa!`);
      logger.info(`💡 Soluções:`);
      logger.info(`   1. Verifique se o QR Code foi escaneado`);
      logger.info(`   2. Reconecte o WhatsApp na interface`);
      logger.info(`   3. Verifique a conexão com a internet`);
      logger.info(`   4. Reinicie o servidor se necessário`);
    }

    process.exit(0);
  } catch (error) {
    logger.error(error, "❌ Erro ao verificar conexões WhatsApp");
    process.exit(1);
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  checkWhatsAppConnection();
}

export default checkWhatsAppConnection;