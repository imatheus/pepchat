import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Create join table TicketUsers if it doesn't exist
    let exists = false;
    try {
      await queryInterface.describeTable("TicketUsers");
      exists = true;
    } catch (e) {
      exists = false;
    }

    if (exists) return;

    await queryInterface.createTable("TicketUsers", {
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add unique constraint to avoid duplicate assignments
    await queryInterface.addConstraint("TicketUsers", {
      fields: ["ticketId", "userId"],
      type: "unique",
      name: "uniq_ticket_user"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("TicketUsers");
  }
};
