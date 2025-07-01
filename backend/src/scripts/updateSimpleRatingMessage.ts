import "../bootstrap";
import sequelize from "../database";
import Whatsapp from "../models/Whatsapp";

const updateSimpleRatingMessage = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Nova mensagem padrão mais simples
    const newDefaultRatingMessage = `Muito obrigado por escolher nossa empresa! 😊

Avalie nossa equipe:`;

    // Buscar todas as conexões WhatsApp
    const whatsapps = await Whatsapp.findAll();
    
    console.log(`📱 Encontradas ${whatsapps.length} conexões WhatsApp`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const whatsapp of whatsapps) {
      console.log(`\n🔍 Verificando: ${whatsapp.name} (ID: ${whatsapp.id})`);
      console.log(`📝 Mensagem atual:`);
      console.log(whatsapp.ratingMessage || "(Vazia)");
      
      // Perguntar se deve atualizar (apenas mostrar, não interativo)
      console.log(`\n🔄 Atualizando para nova mensagem padrão...`);
      
      await whatsapp.update({
        ratingMessage: newDefaultRatingMessage
      });
      
      console.log(`  ✅ Mensagem atualizada`);
      updatedCount++;
    }

    console.log(`\n📊 Resumo:`);
    console.log(`✅ Conexões atualizadas: ${updatedCount}`);
    console.log(`⏭️  Conexões ignoradas: ${skippedCount}`);

    console.log(`\n📋 Nova mensagem padrão aplicada:`);
    console.log(`"${newDefaultRatingMessage}"`);
    
    console.log(`\n📝 Mensagem final que será enviada (exemplo):`);
    console.log(`${newDefaultRatingMessage}

*1* - 😡 Insatisfeito
*2* - 🙄 Satisfeito
*3* - 😁 Muito Satisfeito

_Digite apenas o número correspondente à sua avaliação._`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

updateSimpleRatingMessage();