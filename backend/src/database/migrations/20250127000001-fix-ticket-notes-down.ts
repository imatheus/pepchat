import { QueryInterface } from "sequelize";

module.exports = {
  up: async () => {},
  down: async (queryInterface: QueryInterface) => {
    // Correct the wrong drop in 20210109192523-create-ticket-notes.ts which drops 'Plans'
    // This fixer ensures rollback won't try to drop the wrong table
    const tables = await queryInterface.showAllTables();
    if (Array.isArray(tables) && tables.includes("TicketNotes")) {
      await queryInterface.dropTable("TicketNotes");
    }
  }
};
