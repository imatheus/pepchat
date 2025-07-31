const { QueryInterface, DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.sessionStartedAt) {
        await queryInterface.addColumn("Whatsapps", "sessionStartedAt", {
          type: DataTypes.DATE,
          allowNull: true,
          comment: "Timestamp de quando a sessão foi iniciada para filtrar mensagens antigas"
        });
        console.log('✅ Coluna sessionStartedAt adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna sessionStartedAt já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna sessionStartedAt:', error.message);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "sessionStartedAt");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna sessionStartedAt:', error.message);
    }
  }
};