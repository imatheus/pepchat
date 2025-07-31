"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.addColumn("Plans", "useWhatsapp", {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }),
            queryInterface.addColumn("Plans", "useFacebook", {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }),
            queryInterface.addColumn("Plans", "useInstagram", {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            })
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("Plans", "useWhatsapp"),
            queryInterface.removeColumn("Plans", "useFacebook"),
            queryInterface.removeColumn("Plans", "useInstagram")
        ]);
    }
};
