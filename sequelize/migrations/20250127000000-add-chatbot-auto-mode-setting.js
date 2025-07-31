"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        // Buscar todas as empresas existentes
        const companies = await queryInterface.sequelize.query('SELECT id FROM "Companies"', { type: sequelize_1.QueryTypes.SELECT });
        // Criar configuração para cada empresa
        const settings = companies.map((company) => ({
            key: "chatbotAutoMode",
            value: "enabled",
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        if (settings.length > 0) {
            return queryInterface.bulkInsert("Settings", settings);
        }
        return Promise.resolve();
    },
    down: (queryInterface) => {
        return queryInterface.bulkDelete("Settings", {
            key: "chatbotAutoMode"
        });
    }
};
