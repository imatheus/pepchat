import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.name) {
        await queryInterface.addColumn("Whatsapps", "name", {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        });
        console.log('✅ Coluna name adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna name já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna name:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "name");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna name:', error.message);
    }
  }
};
