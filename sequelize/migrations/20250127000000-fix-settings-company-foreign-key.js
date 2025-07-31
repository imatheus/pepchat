"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Primeiro, verificar se existe uma empresa com ID 1
            const [companies] = await queryInterface.sequelize.query('SELECT id FROM "Companies" WHERE id = 1', { transaction });
            // Se não existe empresa com ID 1, criar uma
            if (companies.length === 0) {
                // Verificar se existe alguma empresa
                const [existingCompanies] = await queryInterface.sequelize.query('SELECT id, name FROM "Companies" ORDER BY id LIMIT 1', { transaction });
                if (existingCompanies.length > 0) {
                    // Se existe uma empresa mas não com ID 1, atualizar as configurações para usar o ID correto
                    const companyId = existingCompanies[0].id;
                    await queryInterface.sequelize.query('UPDATE "Settings" SET "companyId" = :companyId WHERE "companyId" = 1 OR "companyId" IS NULL', {
                        replacements: { companyId },
                        transaction
                    });
                }
                else {
                    // Se não existe nenhuma empresa, criar uma com ID 1
                    // Primeiro verificar se existe um plano
                    const [plans] = await queryInterface.sequelize.query('SELECT id FROM "Plans" ORDER BY id LIMIT 1', { transaction });
                    let planId = 1;
                    if (plans.length === 0) {
                        // Criar um plano padrão se não existir
                        await queryInterface.bulkInsert("Plans", [
                            {
                                name: "Plano Padrão",
                                users: 10,
                                connections: 10,
                                queues: 10,
                                value: 30,
                                useWhatsapp: true,
                                useFacebook: true,
                                useInstagram: true,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        ], { transaction });
                    }
                    else {
                        planId = plans[0].id;
                    }
                    // Criar empresa com ID específico 1
                    await queryInterface.sequelize.query('INSERT INTO "Companies" (id, name, "planId", "dueDate", "createdAt", "updatedAt") VALUES (1, \'Empresa Padrão\', :planId, \'2093-03-14 04:00:00+01\', NOW(), NOW())', {
                        replacements: { planId },
                        transaction
                    });
                    // Resetar a sequência para começar do próximo ID
                    await queryInterface.sequelize.query('SELECT setval(\'\"Companies_id_seq\"\', (SELECT MAX(id) FROM "Companies"))', { transaction });
                }
            }
            // Verificar se existem configurações sem companyId e atribuir à empresa padrão
            const [settingsWithoutCompany] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM "Settings" WHERE "companyId" IS NULL', { transaction });
            if (settingsWithoutCompany[0].count > 0) {
                // Pegar o ID da primeira empresa disponível
                const [firstCompany] = await queryInterface.sequelize.query('SELECT id FROM "Companies" ORDER BY id LIMIT 1', { transaction });
                if (firstCompany.length > 0) {
                    const companyId = firstCompany[0].id;
                    await queryInterface.sequelize.query('UPDATE "Settings" SET "companyId" = :companyId WHERE "companyId" IS NULL', {
                        replacements: { companyId },
                        transaction
                    });
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
        // Não fazer nada no rollback para evitar quebrar dados existentes
        return Promise.resolve();
    }
};
