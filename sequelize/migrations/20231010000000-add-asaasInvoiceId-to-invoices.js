"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Invoices", "asaasInvoiceId", {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Invoices", "asaasInvoiceId");
    }
};
