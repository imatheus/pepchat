import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Whatsapps", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true
      },
      session: {
        type: DataTypes.TEXT
      },
      qrcode: {
        type: DataTypes.TEXT
      },
      status: {
        type: DataTypes.STRING
      },
      battery: {
        type: DataTypes.STRING
      },
      plugged: {
        type: DataTypes.BOOLEAN
      },
      retries: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      greetingMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      farewellMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      complationMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      outOfHoursMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      ratingMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "stable"
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      facebookUserId: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      facebookUserToken: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      facebookPageUserId: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tokenMeta: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      channel: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      sessionStartedAt: {
        type: DataTypes.DATE,
        allowNull: true
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
    return queryInterface.dropTable("Whatsapps");
  }
};
