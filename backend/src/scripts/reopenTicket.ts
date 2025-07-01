import "../bootstrap";
import sequelize from "../database";
import Ticket from "../models/Ticket";
import TicketTraking from "../models/TicketTraking";

const reopenTicket = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    const ticketId = process.argv[2] || "1";
    
    console.log(`🔄 Reabrindo ticket ${ticketId}...`);

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      console.log("❌ Ticket não encontrado");
      process.exit(1);
    }

    // Reabrir o ticket
    await ticket.update({
      status: "open"
    });

    // Resetar o TicketTraking
    const ticketTraking = await TicketTraking.findOne({
      where: { ticketId: ticket.id }
    });

    if (ticketTraking) {
      await ticketTraking.update({
        ratingAt: null,
        rated: false,
        finishedAt: null
      });
      console.log("✅ TicketTraking resetado");
    }

    console.log(`✅ Ticket ${ticket.id} reaberto com sucesso`);
    console.log(`  Status: ${ticket.status}`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

reopenTicket();