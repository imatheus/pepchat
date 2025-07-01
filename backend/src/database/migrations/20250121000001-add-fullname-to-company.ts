import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Verificar se a coluna já existe
      const tableDescription = await queryInterface.describeTable("Companies");
      if (!tableDescription.fullName) {
        return queryInterface.addColumn("Companies", "fullName", {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }
    } catch (error) {
      console.log("Column fullName already exists or error occurred:", error.message);
    }
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Companies", "fullName");
  },
};