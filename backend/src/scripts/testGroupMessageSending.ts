import { logger } from "../utils/logger";
import Whatsapp from "../models/Whatsapp";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import "../database"; // Inicializar conexão com banco

/**
 * Script para testar envio de mensagens para grupos
 * Usado para verificar se a correção das configurações funcionou
 */

const testGroupMessageSending = async () => {
  try {
    logger.info("🧪 Testando envio de mensagens para grupos...");

    // Buscar uma conexão WhatsApp ativa
    const whatsapp = await Whatsapp.findOne({
      where: { status: "CONNECTED" }
    });

    if (!whatsapp) {
      logger.error("❌ Nenhuma conexão WhatsApp ativa encontrada");
      return;
    }

    logger.info(`📱 Usando WhatsApp: ${whatsapp.name} (ID: ${whatsapp.id})`);

    // Buscar um contato de grupo
    const groupContact = await Contact.findOne({
      where: { 
        isGroup: true,
        companyId: whatsapp.companyId
      }
    });

    if (!groupContact) {
      logger.error("❌ Nenhum contato de grupo encontrado");
      return;
    }

    logger.info(`👥 Grupo encontrado: ${groupContact.name} (${groupContact.number})`);

    // Buscar um ticket para este grupo
    let ticket = await Ticket.findOne({
      where: { 
        contactId: groupContact.id,
        whatsappId: whatsapp.id
      },
      include: ["contact"]
    });

    if (!ticket) {
      logger.info("📋 Nenhum ticket encontrado, criando um novo...");
      
      // Criar um ticket temporário para teste
      ticket = await Ticket.create({
        contactId: groupContact.id,
        whatsappId: whatsapp.id,
        companyId: whatsapp.companyId,
        status: "open",
        isGroup: true,
        userId: null,
        queueId: null
      });

      // Recarregar com as associações
      ticket = await Ticket.findByPk(ticket.id, {
        include: ["contact"]
      });
    }

    if (!ticket) {
      logger.error("❌ Erro ao criar/encontrar ticket");
      return;
    }

    logger.info(`🎫 Usando ticket: ${ticket.id}`);

    // Testar envio de mensagem
    const testMessage = `🧪 Teste de envio para grupo - ${new Date().toLocaleString()}`;
    
    logger.info(`📤 Enviando mensagem de teste: "${testMessage}"`);

    try {
      const result = await SendWhatsAppMessage({
        body: testMessage,
        ticket: ticket as any
      });

      logger.info("✅ Mensagem enviada com sucesso!");
      logger.info(`📋 ID da mensagem: ${result.id}`);
      logger.info(`📝 Conteúdo: ${result.body}`);

    } catch (sendError: any) {
      logger.error("❌ Erro ao enviar mensagem:", sendError.message);
      
      if (sendError.message.includes("timeout")) {
        logger.error("⚠️  PROBLEMA: Timeout detectado - verifique:");
        logger.error("   1. Se a configuração CheckMsgIsGroup está correta");
        logger.error("   2. Se a conexão WhatsApp está estável");
        logger.error("   3. Se o grupo ainda existe e o bot tem permissão");
      }
    }

  } catch (error) {
    logger.error("❌ Erro no teste:", error);
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  testGroupMessageSending()
    .then(() => {
      logger.info("🎉 Teste concluído");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Erro ao executar teste:", error);
      process.exit(1);
    });
}

export default testGroupMessageSending;