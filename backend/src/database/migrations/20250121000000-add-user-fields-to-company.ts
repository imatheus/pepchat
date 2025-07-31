import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      const columnsToAdd = [];
      
      if (!tableDescription.fullName) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "fullName", {
            type: DataTypes.STRING,
            allowNull: true,
          })
        );
      }
      
      if (!tableDescription.document) {
        columnsToAdd.push(
          queryInterface.addColumn("Companies", "document", {
            type: DataTypes.STRING,
            allowNull: true,
          })
        );
      }
      
      if (columnsToAdd.length > 0) {
        await Promise.all(columnsToAdd);
        console.log('✅ Colunas fullName/document adicionadas à tabela Companies');
      } else {
        console.log('✅ Colunas fullName/document já existem na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar colunas fullName/document:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await Promise.all([
        queryInterface.removeColumn("Companies", "fullName"),
        queryInterface.removeColumn("Companies", "document"),
      ]);
    } catch (error) {
      console.log('⚠️ Erro ao remover colunas fullName/document:', error.message);
    }
  },
};