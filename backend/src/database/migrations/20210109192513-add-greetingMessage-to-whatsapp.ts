import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.greetingMessage) {
        await queryInterface.addColumn("Whatsapps", "greetingMessage", {
          type: DataTypes.TEXT
        });
        console.log('✅ Coluna greetingMessage adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna greetingMessage já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna greetingMessage:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "greetingMessage");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna greetingMessage:', error.message);
    }
  }
};
