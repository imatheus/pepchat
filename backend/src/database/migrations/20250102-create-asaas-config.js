'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AsaasConfigs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      apiKey: {
        type: Sequelize.STRING,
        allowNull: false
      },
      webhookUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      environment: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'sandbox'
      },
      asaasCustomerId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      asaasSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Adicionar índices
    await queryInterface.addIndex('AsaasConfigs', ['companyId']);
    await queryInterface.addIndex('AsaasConfigs', ['asaasCustomerId']);
    await queryInterface.addIndex('AsaasConfigs', ['asaasSubscriptionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AsaasConfigs');
  }
};