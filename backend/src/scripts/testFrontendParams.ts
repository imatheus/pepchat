import sequelize from "../database";
import ListTicketsService from "../services/TicketServices/ListTicketsService";

const testFrontendParams = async () => {
  try {
    console.log("🧪 Testando com parâmetros exatos do frontend...");
    
    // Simular exatamente o que o frontend está enviando
    const params = {
      searchParam: "",
      pageNumber: "1",
      status: "closed",
      showAll: "true",
      userId: "1",
      queueIds: [4], // O usuário tem a fila 4 selecionada
      tags: [],
      users: [],
      companyId: 1
    };

    console.log("📋 Parâmetros do frontend:", params);

    const result = await ListTicketsService(params);

    console.log(`📊 Resultado da consulta:`);
    console.log(`   Total de tickets: ${result.count}`);
    console.log(`   Tickets retornados: ${result.tickets.length}`);

    if (result.tickets.length > 0) {
      console.log("\n✅ Tickets encontrados:");
      result.tickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. Ticket ID: ${ticket.id}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Contato: ${ticket.contact?.name || 'N/A'}`);
        console.log(`   QueueId: ${ticket.queueId || 'null'}`);
      });
    } else {
      console.log("❌ Nenhum ticket retornado!");
      
      // Testar sem filtro de fila
      console.log("\n🔄 Testando sem filtro de fila...");
      const paramsNoQueue = { ...params, queueIds: [] };
      const resultNoQueue = await ListTicketsService(paramsNoQueue);
      
      console.log(`📊 Resultado sem filtro de fila:`);
      console.log(`   Total de tickets: ${resultNoQueue.count}`);
      console.log(`   Tickets retornados: ${resultNoQueue.tickets.length}`);
      
      if (resultNoQueue.tickets.length > 0) {
        console.log("✅ PROBLEMA ENCONTRADO: O filtro de fila está escondendo os tickets!");
        resultNoQueue.tickets.forEach((ticket, index) => {
          console.log(`\n${index + 1}. Ticket ID: ${ticket.id}`);
          console.log(`   Status: ${ticket.status}`);
          console.log(`   QueueId: ${ticket.queueId || 'null'}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Erro ao testar:", error);
  } finally {
    await sequelize.close();
  }
};

testFrontendParams();