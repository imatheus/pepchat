"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Companies", "trialExpiration", {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: "Data de expiração do período de teste. NULL = não está em teste"
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Companies", "trialExpiration");
    }
};
