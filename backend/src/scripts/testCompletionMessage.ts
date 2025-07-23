import sequelize from "../database";
import Setting from "../models/Setting";

const testCompletionMessage = async () => {
  try {
    console.log("🧪 Testando configuração de mensagem de finalização...");
    
    // Verificar configuração atual
    const userRatingSetting = await Setting.findOne({
      where: {
        companyId: 1,
        key: "userRating"
      }
    });

    console.log(`📋 Configuração userRating atual: ${userRatingSetting?.value || 'NÃO ENCONTRADA'}`);

    if (userRatingSetting?.value === "disabled") {
      console.log("✅ CONFIGURAÇÃO CORRETA:");
      console.log("   - userRating: disabled");
      console.log("   - Resultado esperado: NENHUMA mensagem será enviada ao finalizar ticket");
      console.log("   - Nem avaliação, nem mensagem de finalização");
    } else if (userRatingSetting?.value === "enabled") {
      console.log("✅ CONFIGURAÇÃO CORRETA:");
      console.log("   - userRating: enabled");
      console.log("   - Resultado esperado: Mensagem de avaliação E mensagem de finalização serão enviadas");
    } else {
      console.log("⚠️ CONFIGURAÇÃO NÃO ENCONTRADA:");
      console.log("   - Criando configuração padrão (disabled)...");
      
      await Setting.findOrCreate({
        where: {
          companyId: 1,
          key: "userRating"
        },
        defaults: {
          companyId: 1,
          key: "userRating",
          value: "disabled"
        }
      });
      
      console.log("✅ Configuração criada: userRating = disabled");
    }

    console.log("\n🔧 Para testar:");
    console.log("1. Finalize um ticket");
    console.log("2. Verifique se NENHUMA mensagem é enviada ao cliente");
    console.log("3. Para habilitar: vá em /settings > Opções e ative 'Enviar avaliações'");

  } catch (error) {
    console.error("❌ Erro no teste:", error);
  } finally {
    await sequelize.close();
  }
};

testCompletionMessage();