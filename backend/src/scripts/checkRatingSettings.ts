import sequelize from "../database";
import { Op } from "sequelize";
import Setting from "../models/Setting";

const checkRatingSettings = async () => {
  try {
    console.log("🔍 Verificando configurações de avaliação...");
    
    // Buscar todas as configurações relacionadas a avaliação
    const ratingSettings = await Setting.findAll({
      where: {
        key: ["userRating", "autoRating"]
      },
      order: [["companyId", "ASC"], ["key", "ASC"]]
    });

    console.log(`📊 Total de configurações encontradas: ${ratingSettings.length}`);
    
    if (ratingSettings.length > 0) {
      console.log("\n📋 Configurações por empresa:");
      
      const groupedByCompany = ratingSettings.reduce((acc, setting) => {
        if (!acc[setting.companyId]) {
          acc[setting.companyId] = {};
        }
        acc[setting.companyId][setting.key] = setting.value;
        return acc;
      }, {} as any);

      Object.keys(groupedByCompany).forEach(companyId => {
        console.log(`\n🏢 Empresa ${companyId}:`);
        console.log(`   userRating: ${groupedByCompany[companyId].userRating || 'NÃO CONFIGURADO'}`);
        console.log(`   autoRating: ${groupedByCompany[companyId].autoRating || 'NÃO CONFIGURADO'}`);
        
        // Verificar inconsistências
        const userRating = groupedByCompany[companyId].userRating;
        const autoRating = groupedByCompany[companyId].autoRating;
        
        if (userRating && autoRating && userRating !== autoRating) {
          console.log(`   ⚠️  INCONSISTÊNCIA: userRating=${userRating}, autoRating=${autoRating}`);
        }
      });
    } else {
      console.log("❌ Nenhuma configuração de avaliação encontrada!");
    }

    // Verificar se há configurações órfãs
    console.log("\n🔍 Verificando outras configurações relacionadas...");
    const allSettings = await Setting.findAll({
      where: {
        key: {
          [Op.like]: '%rating%'
        }
      }
    });

    if (allSettings.length > ratingSettings.length) {
      console.log("📋 Outras configurações relacionadas a 'rating':");
      allSettings.forEach(setting => {
        if (!['userRating', 'autoRating'].includes(setting.key)) {
          console.log(`   ${setting.key}: ${setting.value} (Empresa ${setting.companyId})`);
        }
      });
    }

  } catch (error) {
    console.error("❌ Erro ao verificar configurações:", error);
  } finally {
    await sequelize.close();
  }
};

checkRatingSettings();