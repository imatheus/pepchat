import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Companies");
      
      if (!tableDescription.planId) {
        await queryInterface.addColumn("Companies", "planId", {
          type: DataTypes.INTEGER,
          references: { model: "Plans", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        });
        console.log('✅ Coluna planId adicionada à tabela Companies');
      } else {
        console.log('✅ Coluna planId já existe na tabela Companies');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna planId:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Companies", "planId");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna planId:', error.message);
    }
  }
};
