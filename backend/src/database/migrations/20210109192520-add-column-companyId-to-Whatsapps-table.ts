import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("Whatsapps");
      
      if (!tableDescription.companyId) {
        await queryInterface.addColumn("Whatsapps", "companyId", {
          type: DataTypes.INTEGER,
          references: { model: "Companies", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        });
        console.log('✅ Coluna companyId adicionada à tabela Whatsapps');
      } else {
        // Se a coluna já existe, verificar se tem foreign key
        try {
          await queryInterface.addConstraint("Whatsapps", {
            fields: ["companyId"],
            type: "foreign key",
            name: "fk_whatsapps_company_id",
            references: {
              table: "Companies",
              field: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          });
          console.log('✅ Foreign key companyId adicionada à tabela Whatsapps');
        } catch (fkError) {
          console.log('✅ Coluna companyId já existe na tabela Whatsapps');
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/adicionar coluna companyId:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeColumn("Whatsapps", "companyId");
    } catch (error) {
      console.log('⚠️ Erro ao remover coluna companyId:', error.message);
    }
  }
};
