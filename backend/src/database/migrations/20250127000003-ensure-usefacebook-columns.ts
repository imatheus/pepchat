import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Ensure Plans.useFacebook exists if code expects it somewhere
      const plans = await queryInterface.describeTable("Plans");
      if (!plans.useFacebook) {
        await queryInterface.addColumn("Plans", "useFacebook", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }

      // Ensure CompanyPlans.useFacebook
      const companyPlans = await queryInterface.describeTable("CompanyPlans");
      if (!companyPlans.useFacebook) {
        await queryInterface.addColumn("CompanyPlans", "useFacebook", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
    } catch (error) {
      console.error("❌ Erro ao garantir colunas useFacebook:", (error as any)?.message || error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      const plans = await queryInterface.describeTable("Plans");
      if (plans.useFacebook) {
        await queryInterface.removeColumn("Plans", "useFacebook");
      }
      const companyPlans = await queryInterface.describeTable("CompanyPlans");
      if (companyPlans.useFacebook) {
        await queryInterface.removeColumn("CompanyPlans", "useFacebook");
      }
    } catch (error) {
      console.error("❌ Erro ao remover colunas useFacebook:", (error as any)?.message || error);
      throw error;
    }
  }
};
