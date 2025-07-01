import "../bootstrap";
import sequelize from "../database";
import Whatsapp from "../models/Whatsapp";

const updateDefaultRatingMessage = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Mensagem padrão (sem as opções 1-3)
    const defaultRatingMessage = `Obrigado por utilizar nossos serviços!

🌟 *AVALIAÇÃO DO ATENDIMENTO* 🌟

Como você avalia nosso atendimento?

Sua opinião é muito importante para melhorarmos nossos serviços! 🙏`;

    // Buscar todas as conexões WhatsApp
    const whatsapps = await Whatsapp.findAll();
    
    console.log(`📱 Encontradas ${whatsapps.length} conexões WhatsApp`);

    let updatedCount = 0;

    for (const whatsapp of whatsapps) {
      console.log(`\n🔍 Verificando: ${whatsapp.name} (ID: ${whatsapp.id})`);
      
      if (!whatsapp.ratingMessage || whatsapp.ratingMessage.trim() === "") {
        await whatsapp.update({
          ratingMessage: defaultRatingMessage
        });
        
        console.log(`  ✅ Mensagem padrão definida`);
        updatedCount++;
      } else {
        console.log(`  ℹ️  Já possui mensagem personalizada`);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`✅ Conexões atualizadas: ${updatedCount}`);
    console.log(`ℹ️  Conexões que já tinham mensagem: ${whatsapps.length - updatedCount}`);

    if (updatedCount > 0) {
      console.log(`\n📋 Mensagem padrão aplicada:`);
      console.log(defaultRatingMessage);
      console.log(`\n📝 Mensagem final que será enviada (exemplo):`);
      console.log(`${defaultRatingMessage}

*1* - 😡 Insatisfeito
*2* - 🙄 Satisfeito
*3* - 😁 Muito Satisfeito

_Digite apenas o número correspondente à sua avaliação._`);
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

updateDefaultRatingMessage();