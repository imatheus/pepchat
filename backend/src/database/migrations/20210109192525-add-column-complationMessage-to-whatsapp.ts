import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.complationMessage) {
        await queryInterface.addColumn("Whatsapps", "complationMessage", {
          type: DataTypes.TEXT
        });
        console.log('✅ Coluna complationMessage adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna complationMessage já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna complationMessage:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "complationMessage");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna complationMessage:', error.message);
    }
  }
};
