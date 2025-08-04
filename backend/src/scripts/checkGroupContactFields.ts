import "../database"; // Inicializar conexão com banco
import { logger } from "../utils/logger";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";

const checkGroupContactFields = async () => {
  try {
    logger.info("🔍 Verificando campos de contatos de grupos...");

    // Buscar contatos que têm hífen no número (indicando grupos)
    const groupContacts = await Contact.findAll({
      where: {},
      order: [['id', 'DESC']]
    });

    logger.info(`📋 Encontrados ${groupContacts.length} contatos no total`);

    for (const contact of groupContacts) {
      const hasHyphen = contact.number.includes("-");
      const isGroupField = contact.isGroup;
      
      if (hasHyphen) {
        logger.info(`🔍 Contato ${contact.id}:`);
        logger.info(`   📞 Número: ${contact.number}`);
        logger.info(`   👥 isGroup: ${isGroupField}`);
        logger.info(`   🏷️  Nome: ${contact.name}`);
        
        if (!isGroupField) {
          logger.warn(`   ⚠️  PROBLEMA: Número tem hífen mas isGroup = false`);
          
          // Corrigir o campo isGroup
          await contact.update({ isGroup: true });
          logger.info(`   ✅ Campo isGroup corrigido para true`);
        } else {
          logger.info(`   ✅ Campo isGroup está correto`);
        }
        
        // Verificar tickets relacionados
        const tickets = await Ticket.findAll({
          where: { contactId: contact.id },
          limit: 3
        });
        
        if (tickets.length > 0) {
          logger.info(`   🎫 Tickets relacionados: ${tickets.length}`);
          tickets.forEach(ticket => {
            logger.info(`      - Ticket ${ticket.id}: Status ${ticket.status}`);
          });
        }
        
        logger.info(`   ---`);
      }
    }

    logger.info("✅ Verificação concluída!");
    process.exit(0);
  } catch (error) {
    logger.error(error, "❌ Erro ao verificar campos de contatos");
    process.exit(1);
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  checkGroupContactFields();
}

export default checkGroupContactFields;