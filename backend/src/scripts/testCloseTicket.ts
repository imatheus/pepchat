import "../bootstrap";
import sequelize from "../database";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";

const testCloseTicket = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    const ticketId = process.argv[2] || "1";
    const companyId = 2; // Assumindo company ID 2
    
    console.log(`🎯 Testando fechamento do ticket ${ticketId}...`);

    const result = await UpdateTicketService({
      ticketData: {
        status: "closed",
        userId: 2 // Assumindo user ID 2
      },
      ticketId,
      companyId
    });

    console.log(`✅ Ticket fechado com sucesso`);
    console.log(`  Status: ${result.ticket.status}`);
    console.log(`  Old Status: ${result.oldStatus}`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

testCloseTicket();