import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Verificar se as tabelas existem
      const tables = await queryInterface.showAllTables();
      
      if (!tables.includes('Plans')) {
        console.log('⚠️ Tabela Plans não existe ainda, pulando seeder');
        return;
      }
      
      if (!tables.includes('Companies')) {
        console.log('⚠️ Tabela Companies não existe ainda, pulando seeder');
        return;
      }

      return queryInterface.sequelize.transaction(async t => {
        // Primeiro criar o plano com ID específico
        await queryInterface.sequelize.query(
          `INSERT INTO "Plans" (id, name, users, connections, queues, value, "useWhatsapp", "useCampaigns", "campaignContactsLimit", "campaignsPerMonthLimit", "createdAt", "updatedAt")
          VALUES (1, 'Plano 1', 10, 10, 10, 30, true, true, 150, 4, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          { transaction: t }
        );

        // Depois criar a empresa
        await queryInterface.sequelize.query(
          `INSERT INTO "Companies" (id, name, "planId", "dueDate", "createdAt", "updatedAt") 
           VALUES (1, 'Empresa 1', 1, '2093-03-14 04:00:00+01', NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          { transaction: t }
        );
        
        console.log('✅ Empresa e plano padrão criados com sucesso');
      });
    } catch (error) {
      console.log('⚠️ Erro no seeder de empresa padrão:', error.message);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      return Promise.all([
        queryInterface.bulkDelete("Companies", {}),
        queryInterface.bulkDelete("Plans", {})
      ]);
    } catch (error) {
      console.log('⚠️ Erro ao reverter seeder:', error.message);
    }
  }
};
