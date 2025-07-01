import "../bootstrap";
import sequelize from "../database";
import Setting from "../models/Setting";
import Company from "../models/Company";

const checkAndSetupAutoRating = async () => {
  try {
    console.log("🔍 Verificando configurações de avaliação automática...");

    // Testar conexão com o banco
    await sequelize.authenticate();
    console.log("✅ Conexão com banco estabelecida");

    // Buscar todas as empresas
    const companies = await Company.findAll({
      attributes: ['id', 'name']
    });

    console.log(`📊 Encontradas ${companies.length} empresas`);

    for (const company of companies) {
      console.log(`\n🏢 Empresa: ${company.name} (ID: ${company.id})`);

      // Verificar se existe configuração autoRating
      const autoRatingSetting = await Setting.findOne({
        where: {
          companyId: company.id,
          key: "autoRating"
        }
      });

      if (autoRatingSetting) {
        console.log(`  ✅ autoRating: ${autoRatingSetting.value}`);
      } else {
        console.log(`  ❌ autoRating: NÃO CONFIGURADO`);
        
        // Criar configuração
        await Setting.create({
          companyId: company.id,
          key: "autoRating",
          value: "enabled"
        });
        
        console.log(`  ✅ autoRating: CRIADO (enabled)`);
      }

      // Verificar userRating também
      const userRatingSetting = await Setting.findOne({
        where: {
          companyId: company.id,
          key: "userRating"
        }
      });

      if (userRatingSetting) {
        console.log(`  ℹ️  userRating: ${userRatingSetting.value}`);
      } else {
        console.log(`  ⚠️  userRating: NÃO CONFIGURADO`);
      }
    }

    console.log("\n🎉 Verificação concluída!");
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
};

checkAndSetupAutoRating();