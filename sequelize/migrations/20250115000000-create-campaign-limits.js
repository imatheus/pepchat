'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CampaignLimits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      whatsappId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Whatsapps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hourKey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Formato: YYYY-MM-DD-HH'
      },
      messagesSent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      maxMessagesPerHour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('CampaignLimits', ['companyId']);
    await queryInterface.addIndex('CampaignLimits', ['whatsappId']);
    await queryInterface.addIndex('CampaignLimits', ['hourKey']);
    await queryInterface.addIndex('CampaignLimits', ['companyId', 'whatsappId', 'hourKey'], {
      unique: true,
      name: 'campaign_limits_unique_key'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CampaignLimits');
  }
};