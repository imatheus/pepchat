import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Plans");
      
      // Adicionar useWhatsapp se não existir
      if (!tableDescription.useWhatsapp) {
        await queryInterface.addColumn("Plans", "useWhatsapp", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        });
        console.log('✅ Coluna useWhatsapp adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna useWhatsapp já existe na tabela Plans');
      }

      // Adicionar useFacebook se não existir
      if (!tableDescription.useFacebook) {
        await queryInterface.addColumn("Plans", "useFacebook", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('✅ Coluna useFacebook adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna useFacebook já existe na tabela Plans');
      }

      // Adicionar useInstagram se não existir
      if (!tableDescription.useInstagram) {
        await queryInterface.addColumn("Plans", "useInstagram", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('✅ Coluna useInstagram adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna useInstagram já existe na tabela Plans');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar colunas de canais:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Plans", "useWhatsapp");
      await queryInterface.removeColumn("Plans", "useFacebook");
      await queryInterface.removeColumn("Plans", "useInstagram");
    } catch (error) {
      console.log('⚠️ Erro ao remover colunas de canais:', error.message);
    }
  }
};