import { QueryInterface, DataTypes } from "sequelize";
import { logger } from "../utils/logger";
import Contact from "../models/Contact";

/**
 * Script para corrigir números de contatos de grupos que foram corrompidos
 * pela remoção incorreta do hífen
 */

const fixGroupContactNumbers = async (): Promise<void> => {
  try {
    logger.info("🔧 Iniciando correção de números de contatos de grupos...");

    // Buscar todos os contatos marcados como grupos
    const groupContacts = await Contact.findAll({
      where: {
        isGroup: true
      }
    });

    logger.info(`📊 Encontrados ${groupContacts.length} contatos de grupos para verificar`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const contact of groupContacts) {
      const currentNumber = contact.number;
      
      // Verificar se o número não contém hífen (indicando que foi corrompido)
      if (!currentNumber.includes('-')) {
        // Tentar reconstruir o número do grupo
        // Formato esperado: 5511949802134-1531962503
        // Formato corrompido: 55119498021341531962503
        
        // Para números brasileiros de grupos, o padrão é:
        // 55 (país) + 11 (DDD) + 9 dígitos (número) + - + 13 dígitos (ID do grupo)
        // Total: 2 + 2 + 9 + 1 + 13 = 27 caracteres
        
        if (currentNumber.length >= 24) { // Mínimo para tentar reconstruir
          // Tentar diferentes posições para inserir o hífen
          const possiblePositions = [13, 14, 15]; // Posições mais comuns
          
          for (const pos of possiblePositions) {
            if (pos < currentNumber.length) {
              const reconstructed = currentNumber.slice(0, pos) + '-' + currentNumber.slice(pos);
              
              // Verificar se o formato parece correto (hífen na posição certa)
              const parts = reconstructed.split('-');
              if (parts.length === 2 && parts[0].length >= 10 && parts[1].length >= 10) {
                logger.info(`🔄 Corrigindo contato ${contact.id}: ${currentNumber} → ${reconstructed}`);
                
                await contact.update({ number: reconstructed });
                fixedCount++;
                break;
              }
            }
          }
        } else {
          logger.warn(`⚠️  Contato ${contact.id} com número muito curto para reconstruir: ${currentNumber}`);
        }
      } else {
        alreadyCorrectCount++;
      }
    }

    logger.info(`✅ Correção concluída!`);
    logger.info(`📈 Estatísticas:`);
    logger.info(`   - Contatos corrigidos: ${fixedCount}`);
    logger.info(`   - Contatos já corretos: ${alreadyCorrectCount}`);
    logger.info(`   - Total verificados: ${groupContacts.length}`);

  } catch (error) {
    logger.error("❌ Erro durante a correção de números de grupos:", error);
    throw error;
  }
};

// Executar o script se chamado diretamente
if (require.main === module) {
  fixGroupContactNumbers()
    .then(() => {
      logger.info("🎉 Script executado com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("💥 Erro ao executar script:", error);
      process.exit(1);
    });
}

export default fixGroupContactNumbers;