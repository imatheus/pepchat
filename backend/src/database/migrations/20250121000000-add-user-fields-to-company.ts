import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Companies", "fullName", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("Companies", "document", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Companies", "fullName"),
      queryInterface.removeColumn("Companies", "document"),
    ]);
  },
};