import "../bootstrap";
import sequelize from "../database";
import Whatsapp from "../models/Whatsapp";

const showCurrentRatingMessage = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Buscar todas as conexões WhatsApp
    const whatsapps = await Whatsapp.findAll();
    
    console.log(`📱 Encontradas ${whatsapps.length} conexões WhatsApp\n`);

    for (const whatsapp of whatsapps) {
      console.log(`🔍 ${whatsapp.name} (ID: ${whatsapp.id})`);
      console.log(`📝 Mensagem atual:`);
      
      if (whatsapp.ratingMessage && whatsapp.ratingMessage.trim() !== "") {
        console.log(whatsapp.ratingMessage);
        
        console.log(`\n📋 Mensagem final que será enviada:`);
        console.log(`${whatsapp.ratingMessage}

*1* - 😡 Insatisfeito
*2* - 🙄 Satisfeito
*3* - 😁 Muito Satisfeito

_Digite apenas o número correspondente à sua avaliação._`);
      } else {
        console.log("(Vazia - usará mensagem padrão do sistema)");
      }
      
      console.log("\n" + "=".repeat(50) + "\n");
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

showCurrentRatingMessage();