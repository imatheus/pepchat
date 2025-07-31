"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Check if the migration record exists in SequelizeMeta
            const migrationExists = await queryInterface.sequelize.query(`SELECT name FROM "SequelizeMeta" WHERE name = '20211212125704-add-chatbot-to-tickets.js'`, { transaction });
            // If the migration is not marked as completed, mark it as completed
            if (migrationExists[0].length === 0) {
                await queryInterface.sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ('20211212125704-add-chatbot-to-tickets.js')`, { transaction });
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            // Don't throw error if SequelizeMeta table doesn't exist or other issues
            console.log('Note: Could not mark migration as complete, this is usually fine');
        }
    },
    down: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Remove the migration record if needed
            await queryInterface.sequelize.query(`DELETE FROM "SequelizeMeta" WHERE name = '20211212125704-add-chatbot-to-tickets.js'`, { transaction });
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            // Don't throw error
        }
    }
};
