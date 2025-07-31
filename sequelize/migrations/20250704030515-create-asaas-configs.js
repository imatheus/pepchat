'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('AsaasConfigs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('AsaasConfigs');
  }
};
