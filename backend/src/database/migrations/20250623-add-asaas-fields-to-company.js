const { QueryInterface, DataTypes } = require("sequelize");

module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Companies", "asaasCustomerId", {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      }),
      queryInterface.addColumn("Companies", "asaasSubscriptionId", {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      }),
      queryInterface.addColumn("Companies", "asaasSyncedAt", {
        type: DataTypes.DATE,
        allowNull: true
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Companies", "asaasCustomerId"),
      queryInterface.removeColumn("Companies", "asaasSubscriptionId"),
      queryInterface.removeColumn("Companies", "asaasSyncedAt")
    ]);
  }
};