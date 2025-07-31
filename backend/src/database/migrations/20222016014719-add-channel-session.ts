import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.channel) {
        await queryInterface.addColumn("Whatsapps", "channel", { type: DataTypes.TEXT, allowNull: true });
        console.log('âœ… Coluna channel adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna channel jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna channel:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "channel");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna channel:', error.message);
    }
  }
};
