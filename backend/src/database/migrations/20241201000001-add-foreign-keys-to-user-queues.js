module.exports = {
  up: async (queryInterface) => {
    // Primeiro, limpar registros órfãos na tabela UserQueues
    await queryInterface.sequelize.query(`
      DELETE FROM "UserQueues" 
      WHERE "queueId" NOT IN (SELECT id FROM "Queues")
      OR "userId" NOT IN (SELECT id FROM "Users")
    `);

    // Adicionar foreign key constraint para queueId
    await queryInterface.addConstraint("UserQueues", {
      fields: ["queueId"],
      type: "foreign key",
      name: "fk_user_queues_queue_id",
      references: {
        table: "Queues",
        field: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    // Adicionar foreign key constraint para userId
    await queryInterface.addConstraint("UserQueues", {
      fields: ["userId"],
      type: "foreign key",
      name: "fk_user_queues_user_id",
      references: {
        table: "Users",
        field: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
  },

  down: async (queryInterface) => {
    // Remover as foreign key constraints
    await queryInterface.removeConstraint("UserQueues", "fk_user_queues_queue_id");
    await queryInterface.removeConstraint("UserQueues", "fk_user_queues_user_id");
  }
};