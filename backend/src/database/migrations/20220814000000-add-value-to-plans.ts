import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Plans");
      
      if (!tableDescription.value) {
        await queryInterface.addColumn("Plans", "value", {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: 0
        });
        console.log('✅ Coluna value adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna value já existe na tabela Plans');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna value:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Plans", "value");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna value:', error.message);
    }
  }
};