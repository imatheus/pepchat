import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      const columnsToAdd = [];
      
      if (!tableDescription.status) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "status", {
            type: DataTypes.BOOLEAN,
            defaultValue: true
          })
        );
      }
      
      if (!tableDescription.schedules) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "schedules", {
            type: DataTypes.JSONB,
            defaultValue: []
          })
        );
      }
      
      if (columnsToAdd.length > 0) {
        await Promise.all(columnsToAdd);
        console.log('✅ Colunas status/schedules adicionadas à tabela Companies');
      } else {
        console.log('✅ Colunas status/schedules já existem na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar colunas status/schedules:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await Promise.all([
        queryInterface.removeColumn("Companies", "schedules"),
        queryInterface.removeColumn("Companies", "status")
      ]);
    } catch (error) {
      console.log('⚠️ Erro ao remover colunas status/schedules:', error.message);
    }
  }
};
