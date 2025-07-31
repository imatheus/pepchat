import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Verificar se as tabelas existem
      const tables = await queryInterface.showAllTables();
      
      if (!tables.includes('Companies')) {
        console.log('⚠️ Tabela Companies não existe ainda, pulando foreign key');
        return;
      }

      // Tentar adicionar a foreign key constraint
      await queryInterface.addConstraint("Users", {
        fields: ["companyId"],
        type: "foreign key",
        name: "fk_users_company_id",
        references: {
          table: "Companies",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      });
      
      console.log('✅ Foreign key Users→Companies adicionada com sucesso');
    } catch (error) {
      // Se a constraint já existe, não é um erro
      if (error.message && error.message.includes('already exists')) {
        console.log('✅ Foreign key Users→Companies já existe');
      } else {
        console.log("⚠️ Erro ao adicionar foreign key Users→Companies:", error.message);
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeConstraint("Users", "fk_users_company_id");
      console.log('✅ Foreign key Users→Companies removida');
    } catch (error) {
      console.log("⚠️ Erro ao remover foreign key Users→Companies:", error.message);
    }
  }
};