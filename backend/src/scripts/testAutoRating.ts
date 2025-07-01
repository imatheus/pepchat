import "../bootstrap";
import sequelize from "../database";
import Ticket from "../models/Ticket";
import TicketTraking from "../models/TicketTraking";
import AutoRatingService from "../services/TicketServices/AutoRatingService";
import FindOrCreateATicketTrakingService from "../services/TicketServices/FindOrCreateATicketTrakingService";

const testAutoRating = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    const ticketId = process.argv[2] || "1";
    
    console.log(`🧪 Testando AutoRatingService para ticket ${ticketId}...`);

    const ticket = await Ticket.findByPk(ticketId, {
      include: ['contact']
    });
    
    if (!ticket) {
      console.log("❌ Ticket não encontrado");
      process.exit(1);
    }

    console.log(`📋 Ticket encontrado:`);
    console.log(`  ID: ${ticket.id}`);
    console.log(`  Status: ${ticket.status}`);
    console.log(`  Company ID: ${ticket.companyId}`);
    console.log(`  Channel: ${ticket.channel}`);

    // Buscar ou criar TicketTraking
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId: ticket.companyId,
      whatsappId: ticket.whatsappId
    });

    console.log(`📊 TicketTraking:`);
    console.log(`  ID: ${ticketTraking.id}`);
    console.log(`  ratingAt: ${ticketTraking.ratingAt}`);
    console.log(`  rated: ${ticketTraking.rated}`);

    // Testar AutoRatingService
    console.log(`\n🚀 Executando AutoRatingService...`);
    
    const result = await AutoRatingService({
      ticket,
      ticketTraking,
      companyId: ticket.companyId
    });

    console.log(`📊 Resultado: ${result}`);

    // Verificar se o TicketTraking foi atualizado
    await ticketTraking.reload();
    console.log(`\n📊 TicketTraking após execução:`);
    console.log(`  ratingAt: ${ticketTraking.ratingAt}`);
    console.log(`  rated: ${ticketTraking.rated}`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

testAutoRating();