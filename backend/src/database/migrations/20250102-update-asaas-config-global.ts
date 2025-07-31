import { QueryInterface, DataTypes } from "sequelize";

declare const module: any;

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: any) => {
    try {
      // Verificar se a tabela existe
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('AsaasConfigs')) {
        console.log('⚠️ Tabela AsaasConfigs não existe ainda, pulando migração');
        return;
      }

      const tableDescription = await queryInterface.describeTable('AsaasConfigs');
      
      // Remover constraint de foreign key se existir
      try {
        await queryInterface.removeConstraint('AsaasConfigs', 'AsaasConfigs_companyId_fkey');
      } catch (error) {
        console.log('Foreign key constraint may not exist');
      }

      // Remover colunas relacionadas a empresa específica se existirem
      if (tableDescription.companyId) {
        await queryInterface.removeColumn('AsaasConfigs', 'companyId');
        console.log('✅ Coluna companyId removida da tabela AsaasConfigs');
      }
      
      if (tableDescription.asaasCustomerId) {
        await queryInterface.removeColumn('AsaasConfigs', 'asaasCustomerId');
        console.log('✅ Coluna asaasCustomerId removida da tabela AsaasConfigs');
      }
      
      if (tableDescription.asaasSubscriptionId) {
        await queryInterface.removeColumn('AsaasConfigs', 'asaasSubscriptionId');
        console.log('✅ Coluna asaasSubscriptionId removida da tabela AsaasConfigs');
      }

      // Adicionar webhookToken se não existir
      if (!tableDescription.webhookToken) {
        await queryInterface.addColumn('AsaasConfigs', 'webhookToken', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('✅ Coluna webhookToken adicionada à tabela AsaasConfigs');
      }

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
      
      console.log('✅ Migração AsaasConfigs global concluída');
    } catch (error) {
      console.log('⚠️ Erro na migração AsaasConfigs global:', error.message);
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