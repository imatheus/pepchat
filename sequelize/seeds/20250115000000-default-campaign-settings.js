'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Buscar todas as empresas existentes
    const companies = await queryInterface.sequelize.query(
      'SELECT id FROM "Companies"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Configurações padrão para campanhas
    const defaultSettings = [
      {
        key: 'campaignMaxMessagesPerHour',
        value: '30'
      },
      {
        key: 'campaignMinDelaySeconds',
        value: '10'
      },
      {
        key: 'campaignMaxDelaySeconds',
        value: '30'
      }
    ];

    // Inserir configurações para cada empresa
    const settingsToInsert = [];
    
    for (const company of companies) {
      for (const setting of defaultSettings) {
        // Verificar se a configuração já existe
        const existingSetting = await queryInterface.sequelize.query(
          'SELECT id FROM "Settings" WHERE "companyId" = :companyId AND key = :key',
          {
            replacements: { companyId: company.id, key: setting.key },
            type: Sequelize.QueryTypes.SELECT
          }
        );

        if (existingSetting.length === 0) {
          settingsToInsert.push({
            companyId: company.id,
            key: setting.key,
            value: setting.value,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (settingsToInsert.length > 0) {
      await queryInterface.bulkInsert('"Settings"', settingsToInsert);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('"Settings"', {
      key: {
        [Sequelize.Op.in]: [
          'campaignMaxMessagesPerHour',
          'campaignMinDelaySeconds',
          'campaignMaxDelaySeconds'
        ]
      }
    });
  }
};