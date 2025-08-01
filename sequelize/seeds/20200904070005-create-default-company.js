"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.bulkInsert("Plans", [
                    {
                        name: "Plano 1",
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
                ], { transaction: t }),
                queryInterface.bulkInsert("Companies", [
                    {
                        name: "Empresa 1",
                        planId: 1,
                        dueDate: "2093-03-14 04:00:00+01",
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ], { transaction: t })
            ]);
        });
    },
    down: async (queryInterface) => {
        return Promise.all([
            queryInterface.bulkDelete("Companies", {}),
            queryInterface.bulkDelete("Plans", {})
        ]);
    }
};
