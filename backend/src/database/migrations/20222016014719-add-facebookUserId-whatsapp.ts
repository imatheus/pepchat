import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.facebookUserId) {
        await queryInterface.addColumn("Whatsapps", "facebookUserId", { type: DataTypes.TEXT, allowNull: true });
        console.log('âœ… Coluna facebookUserId adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna facebookUserId jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna facebookUserId:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "facebookUserId");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna facebookUserId:', error.message);
    }
  }
};
