'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('AsaasConfigs', 'webhookToken', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'webhookUrl'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('AsaasConfigs', 'webhookToken');
  }
};