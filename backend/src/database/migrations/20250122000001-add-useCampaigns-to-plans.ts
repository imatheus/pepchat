import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Plans");
      
      if (!tableDescription.useCampaigns) {
        await queryInterface.addColumn("Plans", "useCampaigns", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('✅ Coluna useCampaigns adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna useCampaigns já existe na tabela Plans');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna useCampaigns:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Plans", "useCampaigns");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna useCampaigns:', error.message);
    }
  }
};