import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Insere a chave 'signAllMessages' = 'disabled' para todas as empresas que ainda não possuem
    await queryInterface.sequelize.query(`
      INSERT INTO "Settings" ("key", "value", "companyId", "createdAt", "updatedAt")
      SELECT 'signAllMessages', 'disabled', c.id, NOW(), NOW()
      FROM "Companies" c
      WHERE NOT EXISTS (
        SELECT 1 FROM "Settings" s WHERE s."companyId" = c.id AND s."key" = 'signAllMessages'
      );
    `);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DELETE FROM "Settings" WHERE "key" = 'signAllMessages';
    `);
  }
};
