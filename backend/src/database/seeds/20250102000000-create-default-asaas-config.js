'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar se a tabela AsaasConfigs existe
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('AsaasConfigs')) {
        console.log('⚠️ Tabela AsaasConfigs não existe ainda, pulando seeder');
        return;
      }

      // Verificar se já existe uma configuração
      const existingConfig = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "AsaasConfigs"',
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingConfig[0].count > 0) {
        console.log('✅ Configuração Asaas já existe');
        return;
      }

      // Inserir configuração padrão
      await queryInterface.bulkInsert('AsaasConfigs', [{
        apiKey: 'sandbox_api_key_placeholder',
        webhookUrl: null,
        webhookToken: null,
        environment: 'sandbox',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      console.log('✅ Configuração padrão do Asaas criada');
    } catch (error) {
      console.log('⚠️ Erro no seeder de configuração Asaas:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('AsaasConfigs', {});
    } catch (error) {
      console.log('⚠️ Erro ao reverter seeder Asaas:', error.message);
    }
  }
};