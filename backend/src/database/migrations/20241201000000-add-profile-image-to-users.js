module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Users", "profileImage", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("Users", "profileImage");
  }
};