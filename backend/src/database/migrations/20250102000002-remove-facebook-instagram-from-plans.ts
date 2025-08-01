import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Remover colunas do Facebook e Instagram da tabela Plans
      const tableDescription = await queryInterface.describeTable("Plans");
      
      if (tableDescription.useFacebook) {
        await queryInterface.removeColumn("Plans", "useFacebook");
        console.log('✅ Coluna useFacebook removida da tabela Plans');
      }
      
      if (tableDescription.useInstagram) {
        await queryInterface.removeColumn("Plans", "useInstagram");
        console.log('✅ Coluna useInstagram removida da tabela Plans');
      }

      // Remover colunas do Facebook e Instagram da tabela CompanyPlans
      const companyPlansDescription = await queryInterface.describeTable("CompanyPlans");
      
      if (companyPlansDescription.useFacebook) {
        await queryInterface.removeColumn("CompanyPlans", "useFacebook");
        console.log('✅ Coluna useFacebook removida da tabela CompanyPlans');
      }
      
      if (companyPlansDescription.useInstagram) {
        await queryInterface.removeColumn("CompanyPlans", "useInstagram");
        console.log('✅ Coluna useInstagram removida da tabela CompanyPlans');
      }

      // Remover colunas relacionadas ao Facebook da tabela Whatsapps
      const whatsappsDescription = await queryInterface.describeTable("Whatsapps");
      
      if (whatsappsDescription.facebookUserId) {
        await queryInterface.removeColumn("Whatsapps", "facebookUserId");
        console.log('✅ Coluna facebookUserId removida da tabela Whatsapps');
      }
      
      if (whatsappsDescription.facebookUserToken) {
        await queryInterface.removeColumn("Whatsapps", "facebookUserToken");
        console.log('✅ Coluna facebookUserToken removida da tabela Whatsapps');
      }
      
      if (whatsappsDescription.facebookPageUserId) {
        await queryInterface.removeColumn("Whatsapps", "facebookPageUserId");
        console.log('✅ Coluna facebookPageUserId removida da tabela Whatsapps');
      }

      // Remover conexões do Facebook e Instagram
      await queryInterface.sequelize.query(`
        DELETE FROM "Whatsapps" WHERE channel IN ('facebook', 'instagram');
      `);
      console.log('✅ Conexões do Facebook e Instagram removidas');

    } catch (error) {
      console.error('❌ Erro ao remover colunas do Facebook e Instagram:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      // Recriar colunas na tabela Plans
      await queryInterface.addColumn("Plans", "useFacebook", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn("Plans", "useInstagram", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });

      // Recriar colunas na tabela CompanyPlans
      await queryInterface.addColumn("CompanyPlans", "useFacebook", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn("CompanyPlans", "useInstagram", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });

      // Recriar colunas na tabela Whatsapps
      await queryInterface.addColumn("Whatsapps", "facebookUserId", {
        type: DataTypes.TEXT,
        allowNull: true
      });
      
      await queryInterface.addColumn("Whatsapps", "facebookUserToken", {
        type: DataTypes.TEXT,
        allowNull: true
      });
      
      await queryInterface.addColumn("Whatsapps", "facebookPageUserId", {
        type: DataTypes.TEXT,
        allowNull: true
      });

    } catch (error) {
      console.error('❌ Erro ao recriar colunas do Facebook e Instagram:', error);
      throw error;
    }
  }
};