import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("CompanyPlans", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      basePlanId: {
        type: DataTypes.INTEGER,
        references: { model: "Plans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      users: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      connections: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      queues: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      pricePerUser: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      useWhatsapp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      useFacebook: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      useInstagram: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      useCampaigns: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    return queryInterface.dropTable("CompanyPlans");
  }
};