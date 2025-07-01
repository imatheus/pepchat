import "../bootstrap";
import sequelize from "../database";
import Whatsapp from "../models/Whatsapp";

const testCustomRatingMessage = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Buscar WhatsApp para testar
    const whatsapp = await Whatsapp.findOne();
    if (!whatsapp) {
      console.log("❌ Nenhum WhatsApp encontrado");
      process.exit(1);
    }

    console.log(`📱 WhatsApp encontrado: ${whatsapp.name} (ID: ${whatsapp.id})`);
    console.log(`📝 Mensagem de avaliação atual:`);
    console.log(whatsapp.ratingMessage || "(Vazia - usará mensagem padrão)");

    // Definir uma mensagem personalizada de exemplo
    const customMessage = `Muito obrigado por escolher nossa empresa! 😊

🌟 *COMO FOI SEU ATENDIMENTO?* 🌟

Queremos sempre melhorar nossos serviços!

Avalie nossa equipe:`;

    await whatsapp.update({
      ratingMessage: customMessage
    });

    console.log(`\n✅ Mensagem personalizada definida:`);
    console.log(customMessage);
    console.log(`\n📋 A mensagem final enviada será:`);
    console.log(`${customMessage}

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

testCustomRatingMessage();