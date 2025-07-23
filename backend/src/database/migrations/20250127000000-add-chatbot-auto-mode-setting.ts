import { QueryInterface, DataTypes, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Buscar todas as empresas existentes
    const companies = await queryInterface.sequelize.query(
      'SELECT id FROM "Companies"',
      { type: QueryTypes.SELECT }
    );

    // Criar configuração para cada empresa
    const settings = companies.map((company: any) => ({
      key: "chatbotAutoMode",
      value: "enabled", // Padrão habilitado para manter compatibilidade
      companyId: company.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (settings.length > 0) {
      return queryInterface.bulkInsert("Settings", settings);
    }
    
    return Promise.resolve();
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Settings", {
      key: "chatbotAutoMode"
    });
  }
};