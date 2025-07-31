module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('Plans');
      
      // Adicionar campaignContactsLimit se não existir
      if (!tableDescription.campaignContactsLimit) {
        await queryInterface.addColumn('Plans', 'campaignContactsLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 150
        });
        console.log('✅ Coluna campaignContactsLimit adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna campaignContactsLimit já existe na tabela Plans');
      }

      // Adicionar campaignsPerMonthLimit se não existir
      if (!tableDescription.campaignsPerMonthLimit) {
        await queryInterface.addColumn('Plans', 'campaignsPerMonthLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 4
        });
        console.log('✅ Coluna campaignsPerMonthLimit adicionada à tabela Plans');
      } else {
        console.log('✅ Coluna campaignsPerMonthLimit já existe na tabela Plans');
      }

      // Atualizar planos existentes que usam campanhas
      await queryInterface.sequelize.query(`
        UPDATE "Plans" 
        SET 
          "campaignContactsLimit" = COALESCE("campaignContactsLimit", 150),
          "campaignsPerMonthLimit" = COALESCE("campaignsPerMonthLimit", 4)
        WHERE "useCampaigns" = true
      `);
      
      console.log('✅ Valores padrão atualizados para planos com campanhas');
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar colunas de limite de campanhas:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Plans', 'campaignContactsLimit');
      await queryInterface.removeColumn('Plans', 'campaignsPerMonthLimit');
    } catch (error) {
      console.log('⚠️ Erro ao remover colunas de limite de campanhas:', error.message);
    }
  }
};