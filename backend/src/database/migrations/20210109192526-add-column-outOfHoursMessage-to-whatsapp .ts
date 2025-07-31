import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.outOfHoursMessage) {
        await queryInterface.addColumn("Whatsapps", "outOfHoursMessage", {
          type: DataTypes.TEXT
        });
        console.log('✅ Coluna outOfHoursMessage adicionada à tabela Whatsapps');
      } else {
        console.log('✅ Coluna outOfHoursMessage já existe na tabela Whatsapps');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna outOfHoursMessage:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "outOfHoursMessage");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna outOfHoursMessage:', error.message);
    }
  }
};
