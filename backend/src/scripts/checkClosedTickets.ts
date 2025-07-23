import sequelize from "../database";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import User from "../models/User";
import Queue from "../models/Queue";

const checkClosedTickets = async () => {
  try {
    console.log("🔍 Verificando tickets fechados...");
    
    // Buscar todos os tickets fechados
    const closedTickets = await Ticket.findAll({
      where: {
        status: "closed"
      },
      include: [
        {
          model: Contact,
          as: "contact",
          attributes: ["id", "name", "number"]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"]
        },
        {
          model: Queue,
          as: "queue",
          attributes: ["id", "name"]
        }
      ],
      order: [["updatedAt", "DESC"]],
      limit: 10
    });

    console.log(`📊 Total de tickets fechados encontrados: ${closedTickets.length}`);
    
    if (closedTickets.length > 0) {
      console.log("\n📋 Últimos 10 tickets fechados:");
      closedTickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. Ticket ID: ${ticket.id}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Contato: ${ticket.contact?.name || 'N/A'} (${ticket.contact?.number || 'N/A'})`);
        console.log(`   Usuário: ${ticket.user?.name || 'N/A'}`);
        console.log(`   Fila: ${ticket.queue?.name || 'Sem fila'}`);
        console.log(`   Criado em: ${ticket.createdAt}`);
        console.log(`   Atualizado em: ${ticket.updatedAt}`);
        console.log(`   Company ID: ${ticket.companyId}`);
      });
    } else {
      console.log("❌ Nenhum ticket fechado encontrado!");
    }

    // Verificar contagem por status
    console.log("\n📈 Contagem de tickets por status:");
    const statusCounts = await Ticket.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    statusCounts.forEach((item: any) => {
      console.log(`   ${item.status}: ${item.count} tickets`);
    });

    // Verificar tickets da empresa específica (assumindo companyId = 1)
    console.log("\n🏢 Tickets da empresa (companyId = 1):");
    const companyTickets = await Ticket.findAll({
      where: {
        companyId: 1
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    companyTickets.forEach((item: any) => {
      console.log(`   ${item.status}: ${item.count} tickets`);
    });

  } catch (error) {
    console.error("❌ Erro ao verificar tickets:", error);
  } finally {
    await sequelize.close();
  }
};

checkClosedTickets();