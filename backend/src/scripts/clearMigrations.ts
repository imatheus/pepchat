import sequelize from "../database";

const clearMigrations = async () => {
  try {
    console.log("🗑️ Limpando tabela de migrações...");
    
    // Drop SequelizeMeta table
    await sequelize.query('DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;');
    console.log("✅ Tabela SequelizeMeta removida");
    
    // Close connection
    await sequelize.close();
    console.log("✅ Conexão fechada");
    
  } catch (error) {
    console.error("❌ Erro ao limpar migrações:", error);
    process.exit(1);
  }
};

clearMigrations();