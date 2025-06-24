import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Companies", "trialExpiration", {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Data de expiração do período de teste. NULL = não está em teste"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Companies", "trialExpiration");
  }
};