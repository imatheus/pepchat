"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.removeConstraint("Queues", "Queues_color_key"),
            queryInterface.removeConstraint("Queues", "Queues_name_key"),
            queryInterface.removeIndex("Queues", "Queues_color_key"),
            queryInterface.removeIndex("Queues", "Queues_name_key"),
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.addConstraint("Queues", {
                fields: ["color"],
                name: "Queues_color_key",
                type: 'unique'
            }),
            queryInterface.addConstraint("Queues", {
                fields: ["name"],
                name: "Queues_name_key",
                type: 'unique'
            }),
        ]);
    }
};
