import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Alterar campos que podem estar limitados a VARCHAR(255) para TEXT
    await queryInterface.changeColumn("Messages", "remoteJid", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "participant", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "dataJson", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    // Garantir que o campo body também seja TEXT
    await queryInterface.changeColumn("Messages", "body", {
      type: DataTypes.TEXT,
      allowNull: false
    });

    // Verificar outros campos que podem estar limitados
    await queryInterface.changeColumn("Messages", "mediaUrl", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "mediaType", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Reverter para VARCHAR se necessário (não recomendado)
    await queryInterface.changeColumn("Messages", "remoteJid", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "participant", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "dataJson", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "body", {
      type: DataTypes.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn("Messages", "mediaUrl", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn("Messages", "mediaType", {
      type: DataTypes.STRING,
      allowNull: true
    });
  }
};