import "../bootstrap";
import sequelize from "../database";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import Company from "../models/Company";

const createTestTicket = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Buscar um contato existente
    const contact = await Contact.findOne();
    if (!contact) {
      console.log("❌ Nenhum contato encontrado");
      process.exit(1);
    }

    console.log(`📞 Usando contato: ${contact.name} (${contact.number})`);

    // Criar um novo ticket
    const ticket = await Ticket.create({
      contactId: contact.id,
      companyId: contact.companyId,
      whatsappId: 1, // Assumindo que existe um WhatsApp com ID 1
      status: "open",
      isGroup: false
    });

    console.log(`🎫 Ticket criado: ID ${ticket.id}`);
    console.log(`  Status: ${ticket.status}`);
    console.log(`  Company ID: ${ticket.companyId}`);
    console.log(`  Contact ID: ${ticket.contactId}`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

createTestTicket();