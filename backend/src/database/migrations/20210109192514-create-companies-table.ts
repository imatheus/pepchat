import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Companies", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      fullName: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      document: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      recurrence: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      trialExpiration: {
        type: DataTypes.DATE,
        allowNull: true
      },
      asaasCustomerId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      asaasSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      asaasSyncedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      schedules: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      planId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Plans",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
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
    return queryInterface.dropTable("Companies");
  }
};
