import "../bootstrap";
import sequelize from "../database";
import Whatsapp from "../models/Whatsapp";

const updateDefaultComplationMessage = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Mensagem padrão de conclusão
    const defaultComplationMessage = "Atendimento finalizado. Obrigado pelo contato! 😊";

    // Buscar todas as conexões WhatsApp
    const whatsapps = await Whatsapp.findAll();
    
    console.log(`📱 Encontradas ${whatsapps.length} conexões WhatsApp`);

    let updatedCount = 0;

    for (const whatsapp of whatsapps) {
      console.log(`\n🔍 Verificando: ${whatsapp.name} (ID: ${whatsapp.id})`);
      
      if (!whatsapp.complationMessage || whatsapp.complationMessage.trim() === "") {
        await whatsapp.update({
          complationMessage: defaultComplationMessage
        });
        
        console.log(`  ✅ Mensagem de conclusão padrão definida`);
        updatedCount++;
      } else {
        console.log(`  ℹ️  Já possui mensagem de conclusão personalizada`);
        console.log(`  📝 Mensagem atual: "${whatsapp.complationMessage}"`);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`✅ Conexões atualizadas: ${updatedCount}`);
    console.log(`ℹ️  Conexões que já tinham mensagem: ${whatsapps.length - updatedCount}`);

    if (updatedCount > 0) {
      console.log(`\n📋 Mensagem padrão de conclusão aplicada:`);
      console.log(`"${defaultComplationMessage}"`);
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

updateDefaultComplationMessage();