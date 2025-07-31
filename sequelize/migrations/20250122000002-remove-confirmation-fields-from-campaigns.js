"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("Campaigns", "confirmationMessage1"),
            queryInterface.removeColumn("Campaigns", "confirmationMessage2"),
            queryInterface.removeColumn("Campaigns", "confirmationMessage3"),
            queryInterface.removeColumn("Campaigns", "confirmationMessage4"),
            queryInterface.removeColumn("Campaigns", "confirmationMessage5"),
            queryInterface.removeColumn("Campaigns", "confirmation")
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.addColumn("Campaigns", "confirmationMessage1", {
                type: "TEXT",
                allowNull: true,
                defaultValue: ""
            }),
            queryInterface.addColumn("Campaigns", "confirmationMessage2", {
                type: "TEXT",
                allowNull: true,
                defaultValue: ""
            }),
            queryInterface.addColumn("Campaigns", "confirmationMessage3", {
                type: "TEXT",
                allowNull: true,
                defaultValue: ""
            }),
            queryInterface.addColumn("Campaigns", "confirmationMessage4", {
                type: "TEXT",
                allowNull: true,
                defaultValue: ""
            }),
            queryInterface.addColumn("Campaigns", "confirmationMessage5", {
                type: "TEXT",
                allowNull: true,
                defaultValue: ""
            }),
            queryInterface.addColumn("Campaigns", "confirmation", {
                type: "BOOLEAN",
                allowNull: true,
                defaultValue: false
            })
        ]);
    }
};
