import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("QuickMessages", "mediaPath", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("QuickMessages", "mediaType", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("QuickMessages", "mediaName", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QuickMessages", "mediaPath"),
      queryInterface.removeColumn("QuickMessages", "mediaType"),
      queryInterface.removeColumn("QuickMessages", "mediaName")
    ]);
  }
};