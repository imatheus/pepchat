import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Users", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      tokenVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      profile: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "admin"
      },
      super: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      online: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      profileImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Users");
  }
};
