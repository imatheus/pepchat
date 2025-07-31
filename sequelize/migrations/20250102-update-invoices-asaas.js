'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar colunas relacionadas ao Asaas na tabela Invoices
    try {
      await queryInterface.addColumn('Invoices', 'asaasInvoiceId', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('Column asaasInvoiceId may already exist');
    }

    try {
      await queryInterface.addColumn('Invoices', 'asaasSubscriptionId', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('Column asaasSubscriptionId may already exist');
    }

    try {
      await queryInterface.addColumn('Invoices', 'paymentMethod', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('Column paymentMethod may already exist');
    }

    try {
      await queryInterface.addColumn('Invoices', 'paymentDate', {
        type: Sequelize.DATE,
        allowNull: true
      });
    } catch (error) {
      console.log('Column paymentDate may already exist');
    }

    try {
      await queryInterface.addColumn('Invoices', 'billingType', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('Column billingType may already exist');
    }

    try {
      await queryInterface.addColumn('Invoices', 'invoiceUrl', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('Column invoiceUrl may already exist');
    }

    // Adicionar foreign key para companyId se não existir
    try {
      await queryInterface.addConstraint('Invoices', {
        fields: ['companyId'],
        type: 'foreign key',
        name: 'fk_invoices_company',
        references: {
          table: 'Companies',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (error) {
      // Foreign key pode já existir
      console.log('Foreign key constraint may already exist');
    }

    // Adicionar índices
    await queryInterface.addIndex('Invoices', ['asaasInvoiceId']);
    await queryInterface.addIndex('Invoices', ['asaasSubscriptionId']);
    await queryInterface.addIndex('Invoices', ['companyId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover colunas adicionadas
    await queryInterface.removeColumn('Invoices', 'asaasInvoiceId');
    await queryInterface.removeColumn('Invoices', 'asaasSubscriptionId');
    await queryInterface.removeColumn('Invoices', 'paymentMethod');
    await queryInterface.removeColumn('Invoices', 'paymentDate');
    await queryInterface.removeColumn('Invoices', 'billingType');
    await queryInterface.removeColumn('Invoices', 'invoiceUrl');

    // Remover constraint se existir
    try {
      await queryInterface.removeConstraint('Invoices', 'fk_invoices_company');
    } catch (error) {
      // Constraint pode não existir
      console.log('Foreign key constraint may not exist');
    }
  }
};