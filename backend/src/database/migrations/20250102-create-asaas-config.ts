import { QueryInterface, DataTypes } from "sequelize";

declare const module: any;

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: any) => {
    try {
      // Verificar se a tabela já existe
      const tables = await queryInterface.showAllTables();
      if (tables.includes('AsaasConfigs')) {
        console.log('✅ Tabela AsaasConfigs já existe');
        return;
      }

      await queryInterface.createTable('AsaasConfigs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        apiKey: {
          type: Sequelize.STRING,
          allowNull: false
        },
        webhookUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        webhookToken: {
          type: Sequelize.STRING,
          allowNull: true
        },
        environment: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'sandbox'
        },
        enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
      
      console.log('✅ Tabela AsaasConfigs criada com sucesso');
    } catch (error) {
      console.log('⚠️ Erro ao criar tabela AsaasConfigs:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('AsaasConfigs');
    } catch (error) {
      console.log('⚠️ Erro ao remover tabela AsaasConfigs:', error.message);
    }
  }
};