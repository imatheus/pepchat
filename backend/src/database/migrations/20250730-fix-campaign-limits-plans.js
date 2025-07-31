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
        console.log('✅ Coluna campaignContactsLimit corrigida na tabela Plans');
      }

      // Verificar e adicionar campaignsPerMonthLimit se não existir
      if (!tableDescription.campaignsPerMonthLimit) {
        await queryInterface.addColumn('Plans', 'campaignsPerMonthLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 4
        });
        console.log('✅ Coluna campaignsPerMonthLimit corrigida na tabela Plans');
      }

      // Corrigir valores para todos os planos
      await queryInterface.sequelize.query(`
        UPDATE "Plans" 
        SET 
          "campaignContactsLimit" = COALESCE("campaignContactsLimit", 150),
          "campaignsPerMonthLimit" = COALESCE("campaignsPerMonthLimit", 4)
        WHERE "useCampaigns" = true
      `);
      
      console.log('✅ Correção final aplicada aos limites de campanhas');
    } catch (error) {
      console.log('⚠️ Erro na correção final dos limites de campanhas:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Não remover colunas por segurança
    console.log('⚠️ Reversão não implementada para segurança dos dados');
  }
};