'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar se as colunas já existem antes de tentar adicioná-las
      const tableDescription = await queryInterface.describeTable('Plans');
      
      // Adicionar campaignContactsLimit se não existir
      if (!tableDescription.campaignContactsLimit) {
        await queryInterface.addColumn('Plans', 'campaignContactsLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 150
        }, { transaction });
      }
      
      // Adicionar campaignsPerMonthLimit se não existir
      if (!tableDescription.campaignsPerMonthLimit) {
        await queryInterface.addColumn('Plans', 'campaignsPerMonthLimit', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 4
        }, { transaction });
      }

      // Atualizar planos existentes que têm campanhas habilitadas mas não têm limites definidos
      await queryInterface.sequelize.query(`
        UPDATE "Plans" 
        SET 
          "campaignContactsLimit" = COALESCE("campaignContactsLimit", 150),
          "campaignsPerMonthLimit" = COALESCE("campaignsPerMonthLimit", 4)
        WHERE "useCampaigns" = true
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar se as colunas existem antes de tentar removê-las
      const tableDescription = await queryInterface.describeTable('Plans');
      
      if (tableDescription.campaignContactsLimit) {
        await queryInterface.removeColumn('Plans', 'campaignContactsLimit', { transaction });
      }
      
      if (tableDescription.campaignsPerMonthLimit) {
        await queryInterface.removeColumn('Plans', 'campaignsPerMonthLimit', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};