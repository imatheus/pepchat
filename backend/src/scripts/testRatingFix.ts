import sequelize from "../database";
import AutoRatingService from "../services/TicketServices/AutoRatingService";
import Ticket from "../models/Ticket";
import TicketTraking from "../models/TicketTraking";
import Setting from "../models/Setting";

const testRatingFix = async () => {
  try {
    console.log("🧪 Testando correção das avaliações...");
    
    // Verificar configurações atuais
    const userRatingSetting = await Setting.findOne({
      where: {
        companyId: 1,
        key: "userRating"
      }
    });

    console.log(`📋 Configuração userRating: ${userRatingSetting?.value || 'NÃO ENCONTRADA'}`);

    // Buscar um ticket fechado para teste
    const ticket = await Ticket.findOne({
      where: {
        status: "closed",
        companyId: 1
      },
      order: [["updatedAt", "DESC"]]
    });

    if (!ticket) {
      console.log("❌ Nenhum ticket fechado encontrado para teste");
      return;
    }

    console.log(`🎫 Testando com ticket ${ticket.id}`);

    // Buscar ou criar tracking
    let ticketTraking = await TicketTraking.findOne({
      where: { ticketId: ticket.id }
    });

    if (!ticketTraking) {
      console.log("❌ TicketTraking não encontrado");
      return;
    }

    // Resetar ratingAt para simular ticket que não teve avaliação enviada
    await ticketTraking.update({ ratingAt: null });

    console.log(`🚀 Executando AutoRatingService...`);
    
    const result = await AutoRatingService({
      ticket,
      ticketTraking,
      companyId: 1
    });

    console.log(`📊 Resultado: ${result}`);
    
    if (userRatingSetting?.value === "disabled") {
      if (result === false) {
        console.log("✅ CORREÇÃO FUNCIONOU: Avaliação não foi enviada (userRating=disabled)");
      } else {
        console.log("❌ PROBLEMA: Avaliação foi enviada mesmo com userRating=disabled");
      }
    } else if (userRatingSetting?.value === "enabled") {
      if (result === true) {
        console.log("✅ FUNCIONANDO: Avaliação foi enviada (userRating=enabled)");
      } else {
        console.log("⚠️ Avaliação não foi enviada - verificar logs para detalhes");
      }
    }

  } catch (error) {
    console.error("❌ Erro no teste:", error);
  } finally {
    await sequelize.close();
  }
};

testRatingFix();