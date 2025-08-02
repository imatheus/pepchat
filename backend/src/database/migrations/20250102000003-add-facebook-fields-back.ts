import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      // Add facebookUserId if it doesn't exist
      if (!tableDescription.facebookUserId) {
        await queryInterface.addColumn("Whatsapps", "facebookUserId", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log('✅ Coluna facebookUserId adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna facebookUserId já existe na tabela Whatsapps');
      }

      // Add facebookUserToken if it doesn't exist
      if (!tableDescription.facebookUserToken) {
        await queryInterface.addColumn("Whatsapps", "facebookUserToken", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log('✅ Coluna facebookUserToken adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna facebookUserToken já existe na tabela Whatsapps');
      }

      // Add facebookPageUserId if it doesn't exist
      if (!tableDescription.facebookPageUserId) {
        await queryInterface.addColumn("Whatsapps", "facebookPageUserId", {
          type: DataTypes.TEXT,
          allowNull: true
        });
        console.log('✅ Coluna facebookPageUserId adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna facebookPageUserId já existe na tabela Whatsapps');
      }

    } catch (error) {
      console.error('❌ Erro ao adicionar colunas do Facebook:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (tableDescription.facebookUserId) {
        await queryInterface.removeColumn("Whatsapps", "facebookUserId");
        console.log('✅ Coluna facebookUserId removida da tabela Whatsapps');
      }
      
      if (tableDescription.facebookUserToken) {
        await queryInterface.removeColumn("Whatsapps", "facebookUserToken");
        console.log('✅ Coluna facebookUserToken removida da tabela Whatsapps');
      }
      
      if (tableDescription.facebookPageUserId) {
        await queryInterface.removeColumn("Whatsapps", "facebookPageUserId");
        console.log('✅ Coluna facebookPageUserId removida da tabela Whatsapps');
      }

    } catch (error) {
      console.error('❌ Erro ao remover colunas do Facebook:', error);
      throw error;
    }
  }
};