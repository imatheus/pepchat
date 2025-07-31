import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.tokenMeta) {
        await queryInterface.addColumn("Whatsapps", "tokenMeta", { type: DataTypes.TEXT, allowNull: true });
        console.log('âœ… Coluna tokenMeta adicionada Ã  tabela Whatsapps');
      } else {
        console.log('âœ… Coluna tokenMeta jÃ¡ existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('âš ï¸ Erro ao verificar/adicionar coluna tokenMeta:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "tokenMeta");
    } catch (error) {
      console.log('âš ï¸ Erro ao remover coluna tokenMeta:', error.message);
    }
  }
};
