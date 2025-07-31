import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      if (!tableDescription.dueDate) {
        await queryInterface.addColumn("Companies", "dueDate", {
          type: DataTypes.DATE,
          allowNull: true
        });
        console.log('✅ Coluna dueDate adicionada à tabela Companies');
      } else {
        console.log('✅ Coluna dueDate já existe na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna dueDate:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Companies", "dueDate");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna dueDate:', error.message);
    }
  }
};
