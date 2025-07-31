import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      // Se existe a coluna "default" e não existe "isDefault", renomear
      if (tableDescription.default && !tableDescription.isDefault) {
        await queryInterface.renameColumn("Whatsapps", "default", "isDefault");
        console.log('✅ Coluna "default" renomeada para "isDefault" na tabela Whatsapps');
      } else if (tableDescription.isDefault) {
        console.log('✅ Coluna "isDefault" já existe na tabela Whatsapps');
      } else {
        console.log('⚠️ Nenhuma das colunas "default" ou "isDefault" encontrada');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/renomear coluna default→isDefault:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (tableDescription.isDefault && !tableDescription.default) {
        await queryInterface.renameColumn("Whatsapps", "isDefault", "default");
        console.log('✅ Coluna "isDefault" renomeada para "default" na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao reverter renomeação isDefault→default:', error.message);
    }
  }
};
