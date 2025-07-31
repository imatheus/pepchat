import { QueryInterface, DataTypes } from "sequelize";

declare const module: any;

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Plans", {
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
      users: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      connections: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      queues: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
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
      campaignContactsLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 150
      },
      campaignsPerMonthLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 4
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
    return queryInterface.dropTable("Plans");
  }
};
