"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        try {
            // Verificar se a coluna já existe
            const tableDescription = await queryInterface.describeTable("Companies");
            if (!tableDescription.fullName) {
                return queryInterface.addColumn("Companies", "fullName", {
                    type: sequelize_1.DataTypes.STRING,
                    allowNull: true,
                });
            }
        }
        catch (error) {
            console.log("Column fullName already exists or error occurred:", error.message);
        }
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Companies", "fullName");
    },
};
