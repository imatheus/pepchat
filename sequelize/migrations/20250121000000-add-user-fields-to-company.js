"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.addColumn("Companies", "fullName", {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            }),
            queryInterface.addColumn("Companies", "document", {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            }),
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("Companies", "fullName"),
            queryInterface.removeColumn("Companies", "document"),
        ]);
    },
};
