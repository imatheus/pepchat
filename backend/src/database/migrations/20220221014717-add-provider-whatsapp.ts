import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.provider) {
        await queryInterface.addColumn("Whatsapps", "provider", { type: DataTypes.TEXT, defaultValue: "stable" });
        console.log('âœ… Coluna provider adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna provider jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna provider:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "provider");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna provider:', error.message);
    }
  }
};
