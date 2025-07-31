const { QueryInterface, DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      const columnsToAdd = [];
      
      if (!tableDescription.asaasCustomerId) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "asaasCustomerId", {
            type: DataTypes.STRING,
            allowNull: true
          })
        );
      }
      
      if (!tableDescription.asaasSubscriptionId) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "asaasSubscriptionId", {
            type: DataTypes.STRING,
            allowNull: true
          })
        );
      }
      
      if (!tableDescription.asaasSyncedAt) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "asaasSyncedAt", {
            type: DataTypes.DATE,
            allowNull: true
          })
        );
      }
      
      if (columnsToAdd.length > 0) {
        await Promise.all(columnsToAdd);
        console.log('✅ Colunas Asaas adicionadas à tabela Companies');
      } else {
        console.log('✅ Colunas Asaas já existem na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar colunas Asaas:', error.message);
    }
  },

  down: async (queryInterface) => {
    try {
      await Promise.all([
        queryInterface.removeColumn("Companies", "asaasCustomerId"),
        queryInterface.removeColumn("Companies", "asaasSubscriptionId"),
        queryInterface.removeColumn("Companies", "asaasSyncedAt")
      ]);
    } catch (error) {
      console.log('⚠️ Erro ao remover colunas Asaas:', error.message);
    }
  }
};