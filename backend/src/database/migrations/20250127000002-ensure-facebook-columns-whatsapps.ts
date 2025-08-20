import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");

      if (!tableDescription.facebookUserId) {
        await queryInterface.addColumn("Whatsapps", "facebookUserId", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log("✅ Coluna facebookUserId adicionada à tabela Whatsapps");
      }

      if (!tableDescription.facebookUserToken) {
        await queryInterface.addColumn("Whatsapps", "facebookUserToken", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log("✅ Coluna facebookUserToken adicionada à tabela Whatsapps");
      }

      if (!tableDescription.facebookPageUserId) {
        await queryInterface.addColumn("Whatsapps", "facebookPageUserId", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log("✅ Coluna facebookPageUserId adicionada à tabela Whatsapps");
      }
    } catch (error) {
      console.error("❌ Erro ao garantir colunas do Facebook na tabela Whatsapps:", (error as any)?.message || error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");

      if (tableDescription.facebookPageUserId) {
        await queryInterface.removeColumn("Whatsapps", "facebookPageUserId");
      }
      if (tableDescription.facebookUserToken) {
        await queryInterface.removeColumn("Whatsapps", "facebookUserToken");
      }
      if (tableDescription.facebookUserId) {
        await queryInterface.removeColumn("Whatsapps", "facebookUserId");
      }
    } catch (error) {
      console.error("❌ Erro ao remover colunas do Facebook na tabela Whatsapps:", (error as any)?.message || error);
      throw error;
    }
  }
};
