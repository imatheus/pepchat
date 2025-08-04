import "../database"; // Inicializar conexão com banco
import { logger } from "../utils/logger";
import { SendMessage } from "../helpers/SendMessage";
import Whatsapp from "../models/Whatsapp";

const testGroupMessage = async () => {
  try {
    logger.info("🧪 Testando envio de mensagem para grupo...");

    // Buscar uma conexão WhatsApp ativa
    const whatsapp = await Whatsapp.findOne({
      where: { status: "CONNECTED" }
    });

    if (!whatsapp) {
      logger.error("❌ Nenhuma conexão WhatsApp ativa encontrada");
      process.exit(1);
    }

    logger.info(`📱 Usando WhatsApp: ${whatsapp.name} (ID: ${whatsapp.id})`);

    // Número de grupo de teste (substitua pelo ID real do grupo)
    const groupNumber = "5511949802134-1531962503"; // Exemplo de ID de grupo
    const testMessage = "🧪 Teste de envio para grupo - " + new Date().toLocaleString();

    logger.info(`📤 Enviando mensagem para grupo: ${groupNumber}`);
    logger.info(`💬 Mensagem: ${testMessage}`);

    const result = await SendMessage(whatsapp, {
      number: groupNumber,
      body: testMessage
    });

    if (result) {
      logger.info("✅ Mensagem enviada com sucesso!");
      logger.info(`📋 Resultado:`, result);
    } else {
      logger.error("❌ Falha no envio da mensagem");
    }

    process.exit(0);
  } catch (error) {
    logger.error(error, "❌ Erro ao testar envio para grupo");
    process.exit(1);
  }
};

// Executar o teste se chamado diretamente
if (require.main === module) {
  testGroupMessage();
}

export default testGroupMessage;