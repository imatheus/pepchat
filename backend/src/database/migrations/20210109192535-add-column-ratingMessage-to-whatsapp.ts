import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.ratingMessage) {
        await queryInterface.addColumn("Whatsapps", "ratingMessage", {
          type: DataTypes.TEXT
        });
        console.log('✅ Coluna ratingMessage adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna ratingMessage já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna ratingMessage:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "ratingMessage");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna ratingMessage:', error.message);
    }
  }
};
