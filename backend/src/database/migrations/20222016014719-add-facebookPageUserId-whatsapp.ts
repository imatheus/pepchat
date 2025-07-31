import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.facebookPageUserId) {
        await queryInterface.addColumn("Whatsapps", "facebookPageUserId", { type: DataTypes.TEXT, allowNull: true });
        console.log('âœ… Coluna facebookPageUserId adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna facebookPageUserId jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna facebookPageUserId:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "facebookPageUserId");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna facebookPageUserId:', error.message);
    }
  }
};
