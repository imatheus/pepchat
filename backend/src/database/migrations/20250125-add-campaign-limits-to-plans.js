'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar campos de limite de campanhas à tabela Plans
    await queryInterface.addColumn('Plans', 'campaignContactsLimit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 150 // Valor padrão conservador
    });

    await queryInterface.addColumn('Plans', 'campaignsPerMonthLimit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 4 // Valor padrão conservador
    });

    // Adicionar campos de limite de campanhas à tabela CompanyPlans
    await queryInterface.addColumn('CompanyPlans', 'campaignContactsLimit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 150 // Valor padrão conservador
    });

    await queryInterface.addColumn('CompanyPlans', 'campaignsPerMonthLimit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 4 // Valor padrão conservador
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remover campos da tabela Plans
    await queryInterface.removeColumn('Plans', 'campaignContactsLimit');
    await queryInterface.removeColumn('Plans', 'campaignsPerMonthLimit');

    // Remover campos da tabela CompanyPlans
    await queryInterface.removeColumn('CompanyPlans', 'campaignContactsLimit');
    await queryInterface.removeColumn('CompanyPlans', 'campaignsPerMonthLimit');
  }
};