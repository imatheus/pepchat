import sequelize from "../database";
import ListTicketsService from "../services/TicketServices/ListTicketsService";

const testClosedTicketsQuery = async () => {
  try {
    console.log("🧪 Testando consulta de tickets fechados...");
    
    // Simular parâmetros da requisição para tickets fechados
    const params = {
      searchParam: "",
      pageNumber: "1",
      status: "closed",
      showAll: "true", // Importante: showAll deve estar true para ver todos os tickets
      userId: "1", // ID do usuário
      queueIds: [], // Sem filtro de fila
      tags: [],
      users: [],
      companyId: 1
    };

    console.log("📋 Parâmetros da consulta:", params);

    const result = await ListTicketsService(params);

    console.log(`📊 Resultado da consulta:`);
    console.log(`   Total de tickets: ${result.count}`);
    console.log(`   Tickets retornados: ${result.tickets.length}`);
    console.log(`   Tem mais páginas: ${result.hasMore}`);

    if (result.tickets.length > 0) {
      console.log("\n📋 Tickets encontrados:");
      result.tickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. Ticket ID: ${ticket.id}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Contato: ${ticket.contact?.name || 'N/A'}`);
        console.log(`   Usuário: ${ticket.user?.name || 'N/A'}`);
        console.log(`   Fila: ${ticket.queue?.name || 'Sem fila'}`);
      });
    } else {
      console.log("❌ Nenhum ticket retornado pela consulta!");
      
      // Vamos testar sem showAll
      console.log("\n🔄 Testando sem showAll...");
      const paramsWithoutShowAll = { ...params, showAll: undefined };
      const resultWithoutShowAll = await ListTicketsService(paramsWithoutShowAll);
      
      console.log(`📊 Resultado sem showAll:`);
      console.log(`   Total de tickets: ${resultWithoutShowAll.count}`);
      console.log(`   Tickets retornados: ${resultWithoutShowAll.tickets.length}`);
    }

  } catch (error) {
    console.error("❌ Erro ao testar consulta:", error);
  } finally {
    await sequelize.close();
  }
};

testClosedTicketsQuery();