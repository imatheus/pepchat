import "../database"; // Inicializar conexão com banco
import { logger } from "../utils/logger";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";

const fixGroupContacts = async () => {
  try {
    logger.info("🔧 Iniciando correção de contatos de grupos...");

    // Buscar contatos que são grupos mas têm números concatenados (sem hífen)
    const problematicContacts = await Contact.findAll({
      where: {
        isGroup: true
      }
    });

    logger.info(`📋 Encontrados ${problematicContacts.length} contatos de grupos`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const contact of problematicContacts) {
      const currentNumber = contact.number;
      
      // Verificar se o número não tem hífen (indicando que foi concatenado)
      if (!currentNumber.includes("-")) {
        logger.info(`🔄 Analisando contato ${contact.id}: ${currentNumber}`);
        
        // Tentar identificar o padrão do grupo
        // Grupos geralmente têm formato: 5511999999999-1234567890
        // Se foi concatenado, ficou: 55119999999991234567890
        
        // Verificar se tem mais de 13 dígitos (indicando concatenação)
        if (currentNumber.length > 13) {
          // Tentar reconstruir o formato correto
          // Assumir que os primeiros 13 dígitos são o número base
          // e o resto é o sufixo do grupo
          const baseNumber = currentNumber.substring(0, 13);
          const groupSuffix = currentNumber.substring(13);
          
          if (groupSuffix.length > 0) {
            const correctedNumber = `${baseNumber}-${groupSuffix}`;
            
            logger.info(`✏️  Corrigindo: ${currentNumber} → ${correctedNumber}`);
            
            // Verificar se já existe um contato com o número correto
            const existingContact = await Contact.findOne({
              where: {
                number: correctedNumber,
                companyId: contact.companyId,
                channel: contact.channel
              }
            });

            if (existingContact) {
              logger.warn(`⚠️  Já existe contato com número correto: ${correctedNumber}`);
              
              // Transferir tickets do contato incorreto para o correto
              const ticketsToTransfer = await Ticket.findAll({
                where: { contactId: contact.id }
              });

              if (ticketsToTransfer.length > 0) {
                logger.info(`📋 Transferindo ${ticketsToTransfer.length} tickets...`);
                
                for (const ticket of ticketsToTransfer) {
                  await ticket.update({ contactId: existingContact.id });
                }
                
                logger.info(`✅ Tickets transferidos com sucesso`);
              }
              
              // Remover o contato duplicado
              await contact.destroy();
              logger.info(`🗑️  Contato duplicado removido`);
              
            } else {
              // Atualizar o número do contato
              await contact.update({ number: correctedNumber });
              logger.info(`✅ Número do contato corrigido`);
            }
            
            fixedCount++;
          } else {
            logger.warn(`⚠️  Não foi possível identificar sufixo do grupo para: ${currentNumber}`);
            skippedCount++;
          }
        } else {
          logger.info(`ℹ️  Número parece estar correto: ${currentNumber}`);
          skippedCount++;
        }
      } else {
        logger.info(`✅ Número já tem hífen: ${currentNumber}`);
        skippedCount++;
      }
    }

    logger.info(`\n📊 Resumo da correção:`);
    logger.info(`✅ Contatos corrigidos: ${fixedCount}`);
    logger.info(`⏭️  Contatos ignorados: ${skippedCount}`);
    logger.info(`📋 Total processados: ${problematicContacts.length}`);

    if (fixedCount > 0) {
      logger.info(`\n🎉 Correção concluída! ${fixedCount} contatos de grupos foram corrigidos.`);
    } else {
      logger.info(`\nℹ️  Nenhum contato precisou ser corrigido.`);
    }

    process.exit(0);
  } catch (error) {
    logger.error(error, "❌ Erro ao corrigir contatos de grupos");
    process.exit(1);
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  fixGroupContacts();
}

export default fixGroupContacts;