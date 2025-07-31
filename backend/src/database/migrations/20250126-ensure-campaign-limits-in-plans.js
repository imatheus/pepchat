module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('Plans');
      
      // Verificar e adicionar campaignContactsLimit se não existir
      if (!tableDescription.campaignContactsLimit) {
        await queryInterface.addColumn('Plans', 'campaignContactsLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 150
        });
        console.log('✅ Coluna campaignContactsLimit garantida na tabela Plans');
      }

      // Verificar e adicionar campaignsPerMonthLimit se não existir
      if (!tableDescription.campaignsPerMonthLimit) {
        await queryInterface.addColumn('Plans', 'campaignsPerMonthLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 4
        });
        console.log('✅ Coluna campaignsPerMonthLimit garantida na tabela Plans');
      }

      // Garantir valores padrão para planos existentes
      await queryInterface.sequelize.query(`
        UPDATE "Plans" 
        SET 
          "campaignContactsLimit" = COALESCE("campaignContactsLimit", 150),
          "campaignsPerMonthLimit" = COALESCE("campaignsPerMonthLimit", 4)
        WHERE "useCampaigns" = true
      `);
      
      console.log('✅ Valores padrão garantidos para todos os planos');
    } catch (error) {
      console.log('⚠️ Erro ao garantir colunas de limite de campanhas:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Não remover colunas por segurança
    console.log('⚠️ Reversão não implementada para segurança dos dados');
  }
};