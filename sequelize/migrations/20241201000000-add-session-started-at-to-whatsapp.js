const { QueryInterface, DataTypes } = require("sequelize");

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn("Whatsapps", "sessionStartedAt", {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp de quando a sessão foi iniciada para filtrar mensagens antigas"
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("Whatsapps", "sessionStartedAt");
  }
};