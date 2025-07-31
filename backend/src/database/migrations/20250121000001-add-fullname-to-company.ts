import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      if (!tableDescription.fullName) {
        await queryInterface.addColumn("Companies", "fullName", {
          type: DataTypes.STRING,
          allowNull: true,
        });
        console.log('✅ Coluna fullName adicionada à tabela Companies');
      } else {
        console.log('✅ Coluna fullName já existe na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna fullName:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Companies", "fullName");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna fullName:', error.message);
    }
  },
};