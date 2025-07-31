import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      if (!tableDescription.trialExpiration) {
        await queryInterface.addColumn("Companies", "trialExpiration", {
          type: DataTypes.DATE,
          allowNull: true,
          comment: "Data de expiração do período de teste. NULL = não está em teste"
        });
        console.log('✅ Coluna trialExpiration adicionada à tabela Companies');
      } else {
        console.log('✅ Coluna trialExpiration já existe na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna trialExpiration:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Companies", "trialExpiration");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna trialExpiration:', error.message);
    }
  }
};