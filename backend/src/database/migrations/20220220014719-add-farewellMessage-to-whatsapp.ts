import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.farewellMessage) {
        await queryInterface.addColumn("Whatsapps", "farewellMessage", { type: DataTypes.TEXT });
        console.log('âœ… Coluna farewellMessage adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna farewellMessage jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna farewellMessage:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "farewellMessage");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna farewellMessage:', error.message);
    }
  }
};
