import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      if (!tableDescription.recurrence) {
        await queryInterface.addColumn("Companies", "recurrence", {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: ""
        });
        console.log('✅ Coluna recurrence adicionada à tabela Companies');
      } else {
        console.log('✅ Coluna recurrence já existe na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna recurrence:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Companies", "recurrence");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna recurrence:', error.message);
    }
  }
};
