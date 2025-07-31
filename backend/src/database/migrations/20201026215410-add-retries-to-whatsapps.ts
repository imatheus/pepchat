import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.retries) {
        await queryInterface.addColumn("Whatsapps", "retries", {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false
        });
        console.log('✅ Coluna retries adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna retries já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna retries:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "retries");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna retries:', error.message);
    }
  }
};
