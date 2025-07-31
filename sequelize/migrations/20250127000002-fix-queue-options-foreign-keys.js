"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Check if the foreign key constraint exists
            const constraintExists = await queryInterface.sequelize.query(`SELECT constraint_name FROM information_schema.table_constraints 
         WHERE table_name = 'Tickets' AND constraint_name = 'Tickets_queueOptionId_fkey'`, { transaction });
            // If constraint exists, we need to handle it properly
            if (constraintExists[0].length > 0) {
                // Check if QueueOptions table exists
                const queueOptionsExists = await queryInterface.sequelize.query(`SELECT table_name FROM information_schema.tables 
           WHERE table_name = 'QueueOptions'`, { transaction });
                // If QueueOptions table doesn't exist, we need to remove the foreign key constraint
                if (queueOptionsExists[0].length === 0) {
                    // Remove the foreign key constraint
                    await queryInterface.sequelize.query(`ALTER TABLE "Tickets" DROP CONSTRAINT IF EXISTS "Tickets_queueOptionId_fkey"`, { transaction });
                    // Optionally, you might want to remove the column entirely if the table doesn't exist
                    const queueOptionIdColumnExists = await queryInterface.sequelize.query(`SELECT column_name FROM information_schema.columns 
             WHERE table_name = 'Tickets' AND column_name = 'queueOptionId'`, { transaction });
                    if (queueOptionIdColumnExists[0].length > 0) {
                        await queryInterface.removeColumn("Tickets", "queueOptionId", { transaction });
                    }
                }
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
    down: async (queryInterface) => {
        // This migration is meant to fix issues, so we don't want to reverse it
        return Promise.resolve();
    }
};
