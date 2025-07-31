import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.token) {
        await queryInterface.addColumn("Whatsapps", "token", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log('✅ Coluna token adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna token já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna token:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "token");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna token:', error.message);
    }
  }
};
