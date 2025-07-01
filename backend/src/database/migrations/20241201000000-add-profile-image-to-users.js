module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar se a coluna já existe
      const tableDescription = await queryInterface.describeTable("Users");
      if (!tableDescription.profileImage) {
        return queryInterface.addColumn("Users", "profileImage", {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null
        });
      }
    } catch (error) {
      console.log("Column profileImage already exists or error occurred:", error.message);
    }
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("Users", "profileImage");
  }
};