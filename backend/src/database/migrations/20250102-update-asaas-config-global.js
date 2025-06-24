'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remover constraint de foreign key se existir
    try {
      await queryInterface.removeConstraint('AsaasConfigs', 'AsaasConfigs_companyId_fkey');
    } catch (error) {
      console.log('Foreign key constraint may not exist');
    }

    // Remover colunas relacionadas a empresa específica
    await queryInterface.removeColumn('AsaasConfigs', 'companyId');
    await queryInterface.removeColumn('AsaasConfigs', 'asaasCustomerId');
    await queryInterface.removeColumn('AsaasConfigs', 'asaasSubscriptionId');

    // Remover índices se existirem
    try {
      await queryInterface.removeIndex('AsaasConfigs', 'asaas_configs_company_id');
    } catch (error) {
      console.log('Index may not exist');
    }

    try {
      await queryInterface.removeIndex('AsaasConfigs', 'asaas_configs_asaas_customer_id');
    } catch (error) {
      console.log('Index may not exist');
    }

    try {
      await queryInterface.removeIndex('AsaasConfigs', 'asaas_configs_asaas_subscription_id');
    } catch (error) {
      console.log('Index may not exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Adicionar colunas de volta
    await queryInterface.addColumn('AsaasConfigs', 'companyId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'Companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('AsaasConfigs', 'asaasCustomerId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('AsaasConfigs', 'asaasSubscriptionId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Adicionar índices de volta
    await queryInterface.addIndex('AsaasConfigs', ['companyId']);
    await queryInterface.addIndex('AsaasConfigs', ['asaasCustomerId']);
    await queryInterface.addIndex('AsaasConfigs', ['asaasSubscriptionId']);
  }
};