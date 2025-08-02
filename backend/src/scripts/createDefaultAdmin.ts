import sequelize from "../database";
import User from "../models/User";
import Company from "../models/Company";
import Plan from "../models/Plan";

const createDefaultAdmin = async () => {
  try {
    console.log("🚀 Criando usuário admin padrão...");

    // Verificar se já existe um plano padrão
    let plan = await Plan.findOne({
      where: { name: "Plano Básico" }
    });

    if (!plan) {
      // Criar plano padrão
      plan = await Plan.create({
        name: "Plano Básico",
        users: 5,
        connections: 3,
        queues: 5,
        value: 1.00,
        useWhatsapp: true,
        useCampaigns: true,
        campaignContactsLimit: 1000,
        campaignsPerMonthLimit: 10
      });
      console.log("✅ Plano padrão criado:", plan.name);
    } else {
      console.log("✅ Plano padrão já existe:", plan.name);
    }

    // Verificar se já existe uma empresa padrão
    let company = await Company.findOne({
      where: { email: "admin@admin.com" }
    });

    if (!company) {
      // Criar empresa padrão
      company = await Company.create({
        name: "Empresa Padrão",
        phone: "(11) 99999-9999",
        email: "admin@admin.com",
        fullName: "Administrador Padrão",
        document: "00000000000",
        status: true,
        dueDate: "2025-12-31",
        recurrence: "MONTHLY",
        planId: plan.id,
        schedules: []
      });
      console.log("✅ Empresa padrão criada:", company.name);
    } else {
      console.log("✅ Empresa padrão já existe:", company.name);
    }

    // Verificar se já existe o usuário admin
    let adminUser = await User.findOne({
      where: { email: "admin@admin.com" }
    });

    if (!adminUser) {
      // Criar usuário admin
      adminUser = await User.create({
        name: "Administrador",
        email: "admin@admin.com",
        password: "123456", // Será hasheado automaticamente pelo hook
        profile: "admin",
        super: true,
        online: false,
        companyId: company.id
      });
      console.log("✅ Usuário admin criado:", adminUser.email);
    } else {
      console.log("✅ Usuário admin já existe:", adminUser.email);
    }

    console.log("\n🎉 Setup concluído!");
    console.log("📧 Email: admin@admin.com");
    console.log("🔑 Senha: 123456");
    console.log("🏢 Empresa:", company.name);
    console.log("📋 Plano:", plan.name, "- R$", plan.value);

    // Fechar conexão
    await sequelize.close();
    console.log("✅ Conexão fechada");

  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
    process.exit(1);
  }
};

createDefaultAdmin();