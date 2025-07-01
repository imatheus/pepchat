import CheckContactNumberSafe from "../services/WbotServices/CheckNumberSafe";
import { logger } from "../utils/logger";

async function testSpecificNumber() {
  const numberToTest = "5511949802134";
  const companyId = 1; // Ajuste conforme necessário
  
  console.log(`Testando número: ${numberToTest}`);
  
  try {
    const result = await CheckContactNumberSafe(numberToTest, companyId);
    
    console.log("Resultado da validação:");
    console.log(`- isValid: ${result.isValid}`);
    console.log(`- exists: ${result.exists}`);
    console.log(`- jid: ${result.jid}`);
    console.log(`- error: ${result.error}`);
    
    if (result.isValid && result.exists) {
      console.log("✅ Número é válido e existe no WhatsApp");
    } else if (result.isValid && !result.exists) {
      console.log("❌ Número é válido mas não existe no WhatsApp");
    } else {
      console.log("⚠️ Erro de sistema/conexão");
    }
    
  } catch (error) {
    console.error("Erro ao testar número:", error);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testSpecificNumber().then(() => {
    console.log("Teste concluído");
    process.exit(0);
  }).catch(error => {
    console.error("Erro no teste:", error);
    process.exit(1);
  });
}

export default testSpecificNumber;