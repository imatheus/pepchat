import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      // Se não existe nem "default" nem "isDefault", adicionar "default"
      if (!tableDescription.default && !tableDescription.isDefault) {
        await queryInterface.addColumn("Whatsapps", "default", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('✅ Coluna "default" adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna "default" ou "isDefault" já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna default:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "default");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna default:', error.message);
    }
  }
};
