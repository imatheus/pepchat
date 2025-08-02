import sequelize from "../database";

const clearDatabase = async () => {
  try {
    console.log("🗑️ Limpando banco de dados...");
    
    // Drop all tables with CASCADE
    await sequelize.drop({ cascade: true });
    console.log("✅ Todas as tabelas foram removidas");
    
    // Close connection
    await sequelize.close();
    console.log("✅ Conexão fechada");
    
  } catch (error) {
    console.error("❌ Erro ao limpar banco de dados:", error);
    process.exit(1);
  }
};

clearDatabase();