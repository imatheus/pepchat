import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.facebookUserToken) {
        await queryInterface.addColumn("Whatsapps", "facebookUserToken", { type: DataTypes.TEXT, allowNull: true });
        console.log('âœ… Coluna facebookUserToken adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna facebookUserToken jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna facebookUserToken:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "facebookUserToken");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna facebookUserToken:', error.message);
    }
  }
};
