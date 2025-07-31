"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Check if Companies table exists
            const companiesTableExists = await queryInterface.sequelize.query(`SELECT table_name FROM information_schema.tables 
         WHERE table_name = 'Companies'`, { transaction });
            // If Companies table doesn't exist, create it
            if (companiesTableExists[0].length === 0) {
                console.log('Creating Companies table...');
                // First, check if Plans table exists, if not create it
                const plansTableExists = await queryInterface.sequelize.query(`SELECT table_name FROM information_schema.tables 
           WHERE table_name = 'Plans'`, { transaction });
                if (plansTableExists[0].length === 0) {
                    console.log('Creating Plans table...');
                    await queryInterface.createTable("Plans", {
                        id: {
                            type: sequelize_1.DataTypes.INTEGER,
                            autoIncrement: true,
                            primaryKey: true,
                            allowNull: false
                        },
                        name: {
                            type: sequelize_1.DataTypes.STRING,
                            allowNull: false
                        },
                        users: {
                            type: sequelize_1.DataTypes.INTEGER,
                            allowNull: false,
                            defaultValue: 0
                        },
                        connections: {
                            type: sequelize_1.DataTypes.INTEGER,
                            allowNull: false,
                            defaultValue: 0
                        },
                        queues: {
                            type: sequelize_1.DataTypes.INTEGER,
                            allowNull: false,
                            defaultValue: 0
                        },
                        value: {
                            type: sequelize_1.DataTypes.DECIMAL(10, 2),
                            allowNull: false,
                            defaultValue: 0
                        },
                        useWhatsapp: {
                            type: sequelize_1.DataTypes.BOOLEAN,
                            allowNull: false,
                            defaultValue: true
                        },
                        useFacebook: {
                            type: sequelize_1.DataTypes.BOOLEAN,
                            allowNull: false,
                            defaultValue: false
                        },
                        useInstagram: {
                            type: sequelize_1.DataTypes.BOOLEAN,
                            allowNull: false,
                            defaultValue: false
                        },
                        useCampaigns: {
                            type: sequelize_1.DataTypes.BOOLEAN,
                            allowNull: false,
                            defaultValue: false
                        },
                        createdAt: {
                            type: sequelize_1.DataTypes.DATE,
                            allowNull: false
                        },
                        updatedAt: {
                            type: sequelize_1.DataTypes.DATE,
                            allowNull: false
                        }
                    }, { transaction });
                    // Insert default plan
                    await queryInterface.bulkInsert("Plans", [
                        {
                            name: "Plano Padrão",
                            users: 10,
                            connections: 10,
                            queues: 10,
                            value: 30.00,
                            useWhatsapp: true,
                            useFacebook: true,
                            useInstagram: true,
                            useCampaigns: true,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    ], { transaction });
                }
                // Now create Companies table
                await queryInterface.createTable("Companies", {
                    id: {
                        type: sequelize_1.DataTypes.INTEGER,
                        autoIncrement: true,
                        primaryKey: true,
                        allowNull: false
                    },
                    name: {
                        type: sequelize_1.DataTypes.STRING,
                        allowNull: false,
                        unique: true
                    },
                    phone: {
                        type: sequelize_1.DataTypes.STRING,
                        allowNull: true
                    },
                    email: {
                        type: sequelize_1.DataTypes.STRING,
                        allowNull: true
                    },
                    status: {
                        type: sequelize_1.DataTypes.BOOLEAN,
                        allowNull: false,
                        defaultValue: true
                    },
                    planId: {
                        type: sequelize_1.DataTypes.INTEGER,
                        references: { model: "Plans", key: "id" },
                        onUpdate: "CASCADE",
                        onDelete: "SET NULL",
                        allowNull: true
                    },
                    dueDate: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: true
                    },
                    recurrence: {
                        type: sequelize_1.DataTypes.STRING,
                        allowNull: true
                    },
                    trialExpiration: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: true
                    },
                    asaasCustomerId: {
                        type: sequelize_1.DataTypes.STRING,
                        allowNull: true
                    },
                    asaasSubscriptionId: {
                        type: sequelize_1.DataTypes.STRING,
                        allowNull: true
                    },
                    asaasSyncedAt: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: true
                    },
                    createdAt: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: false
                    },
                    updatedAt: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: false
                    }
                }, { transaction });
                // Insert default company with ID 1
                await queryInterface.sequelize.query(`INSERT INTO "Companies" (id, name, "planId", "dueDate", status, "createdAt", "updatedAt") 
           VALUES (1, 'Empresa Padrão', 1, '2093-03-14 04:00:00+01', true, NOW(), NOW())`, { transaction });
                // Reset the sequence to start from the next ID
                await queryInterface.sequelize.query(`SELECT setval('"Companies_id_seq"', (SELECT MAX(id) FROM "Companies"))`, { transaction });
                console.log('Companies table created with default company (ID: 1)');
            }
            else {
                // Companies table exists, check if company with ID 1 exists
                const companyExists = await queryInterface.sequelize.query('SELECT id FROM "Companies" WHERE id = 1', { transaction });
                if (companyExists[0].length === 0) {
                    // Insert company with ID 1
                    await queryInterface.sequelize.query(`INSERT INTO "Companies" (id, name, "planId", "dueDate", status, "createdAt", "updatedAt") 
             VALUES (1, 'Empresa Padrão', 1, '2093-03-14 04:00:00+01', true, NOW(), NOW())`, { transaction });
                    // Reset the sequence
                    await queryInterface.sequelize.query(`SELECT setval('"Companies_id_seq"', (SELECT MAX(id) FROM "Companies"))`, { transaction });
                    console.log('Default company (ID: 1) created');
                }
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            console.error('Error ensuring Companies table exists:', error);
            throw error;
        }
    },
    down: async (queryInterface) => {
        // Don't drop tables in down migration to avoid data loss
        return Promise.resolve();
    }
};
