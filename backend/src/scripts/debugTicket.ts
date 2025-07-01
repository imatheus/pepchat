import "../bootstrap";
import sequelize from "../database";
import Ticket from "../models/Ticket";
import TicketTraking from "../models/TicketTraking";
import Setting from "../models/Setting";

const debugTicket = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Buscar um ticket específico (você pode alterar o ID)
    const ticketId = process.argv[2] || "1";
    
    console.log(`🔍 Verificando ticket ${ticketId}...`);

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      console.log("❌ Ticket não encontrado");
      process.exit(1);
    }

    console.log(`📋 Ticket ${ticket.id}:`);
    console.log(`  Status: ${ticket.status}`);
    console.log(`  Company ID: ${ticket.companyId}`);
    console.log(`  Channel: ${ticket.channel}`);
    console.log(`  WhatsApp ID: ${ticket.whatsappId}`);

    // Verificar TicketTraking
    const ticketTraking = await TicketTraking.findOne({
      where: { ticketId: ticket.id }
    });

    if (ticketTraking) {
      console.log(`📊 TicketTraking:`);
      console.log(`  ID: ${ticketTraking.id}`);
      console.log(`  ratingAt: ${ticketTraking.ratingAt}`);
      console.log(`  rated: ${ticketTraking.rated}`);
      console.log(`  finishedAt: ${ticketTraking.finishedAt}`);
    } else {
      console.log("❌ TicketTraking não encontrado");
    }

    // Verificar configuração autoRating
    const autoRatingSetting = await Setting.findOne({
      where: {
        companyId: ticket.companyId,
        key: "autoRating"
      }
    });

    if (autoRatingSetting) {
      console.log(`⚙️ AutoRating: ${autoRatingSetting.value}`);
    } else {
      console.log("❌ Configuração autoRating não encontrada");
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

debugTicket();