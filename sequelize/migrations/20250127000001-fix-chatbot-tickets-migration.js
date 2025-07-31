"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Check if chatbot column exists
            const chatbotColumnExists = await queryInterface.sequelize.query(`SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'Tickets' AND column_name = 'chatbot'`, { transaction });
            // Add chatbot column if it doesn't exist
            if (chatbotColumnExists[0].length === 0) {
                await queryInterface.addColumn("Tickets", "chatbot", {
                    type: sequelize_1.DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false
                }, { transaction });
            }
            // Check if queueOptionId column exists
            const queueOptionIdColumnExists = await queryInterface.sequelize.query(`SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'Tickets' AND column_name = 'queueOptionId'`, { transaction });
            // Add queueOptionId column if it doesn't exist
            if (queueOptionIdColumnExists[0].length === 0) {
                // First check if QueueOptions table exists
                const queueOptionsTableExists = await queryInterface.sequelize.query(`SELECT table_name FROM information_schema.tables 
           WHERE table_name = 'QueueOptions'`, { transaction });
                if (queueOptionsTableExists[0].length > 0) {
                    await queryInterface.addColumn("Tickets", "queueOptionId", {
                        type: sequelize_1.DataTypes.INTEGER,
                        references: { model: "QueueOptions", key: "id" },
                        onUpdate: "SET NULL",
                        onDelete: "SET NULL",
                        allowNull: true
                    }, { transaction });
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
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Check if columns exist before removing them
            const chatbotColumnExists = await queryInterface.sequelize.query(`SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'Tickets' AND column_name = 'chatbot'`, { transaction });
            if (chatbotColumnExists[0].length > 0) {
                await queryInterface.removeColumn("Tickets", "chatbot", { transaction });
            }
            const queueOptionIdColumnExists = await queryInterface.sequelize.query(`SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'Tickets' AND column_name = 'queueOptionId'`, { transaction });
            if (queueOptionIdColumnExists[0].length > 0) {
                await queryInterface.removeColumn("Tickets", "queueOptionId", { transaction });
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
