const { DataTypes } = require("sequelize");

module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn("ContactListItems", "empresa", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      }),
      queryInterface.addColumn("ContactListItems", "cargo", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      }),
      queryInterface.addColumn("ContactListItems", "endereco", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("ContactListItems", "empresa"),
      queryInterface.removeColumn("ContactListItems", "cargo"),
      queryInterface.removeColumn("ContactListItems", "endereco")
    ]);
  }
};