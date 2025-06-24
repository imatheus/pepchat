module.exports = {
  up: async (queryInterface) => {
    // Primeiro, limpar registros órfãos na tabela WhatsappQueues
    await queryInterface.sequelize.query(`
      DELETE FROM "WhatsappQueues" 
      WHERE "queueId" NOT IN (SELECT id FROM "Queues")
      OR "whatsappId" NOT IN (SELECT id FROM "Whatsapps")
    `);

    // Adicionar foreign key constraint para queueId
    await queryInterface.addConstraint("WhatsappQueues", {
      fields: ["queueId"],
      type: "foreign key",
      name: "fk_whatsapp_queues_queue_id",
      references: {
        table: "Queues",
        field: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    // Adicionar foreign key constraint para whatsappId
    await queryInterface.addConstraint("WhatsappQueues", {
      fields: ["whatsappId"],
      type: "foreign key",
      name: "fk_whatsapp_queues_whatsapp_id",
      references: {
        table: "Whatsapps",
        field: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
  },

  down: async (queryInterface) => {
    // Remover as foreign key constraints
    await queryInterface.removeConstraint("WhatsappQueues", "fk_whatsapp_queues_queue_id");
    await queryInterface.removeConstraint("WhatsappQueues", "fk_whatsapp_queues_whatsapp_id");
  }
};