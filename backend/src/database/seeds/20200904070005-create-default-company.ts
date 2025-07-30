import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      // Primeiro criar o plano com ID específico
      await queryInterface.sequelize.query(
        `INSERT INTO "Plans" (id, name, users, connections, queues, value, "useWhatsapp", "useFacebook", "useInstagram", "createdAt", "updatedAt") 
         VALUES (1, 'Plano 1', 10, 10, 10, 30, true, true, true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        { transaction: t }
      );

      // Depois criar a empresa
      await queryInterface.sequelize.query(
        `INSERT INTO "Companies" (id, name, "planId", "dueDate", "createdAt", "updatedAt") 
         VALUES (1, 'Empresa 1', 1, '2093-03-14 04:00:00+01', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.bulkDelete("Companies", {}),
      queryInterface.bulkDelete("Plans", {})
    ]);
  }
};
