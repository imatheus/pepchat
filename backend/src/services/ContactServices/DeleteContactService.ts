import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import TicketNote from "../../models/TicketNote";
import ContactCustomField from "../../models/ContactCustomField";
import Schedule from "../../models/Schedule";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import sequelize from "../../database";

const DeleteContactService = async (id: string): Promise<void> => {
  const contact = await Contact.findOne({
    where: { id }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  // Usar transação para garantir consistência
  const transaction = await sequelize.transaction();

  try {
    logger.info(`Starting deletion process for contact ${id}`);

    // 1. Deletar notas de tickets associadas ao contato
    const ticketNotesDeleted = await TicketNote.destroy({
      where: { contactId: id },
      transaction
    });
    
    if (ticketNotesDeleted > 0) {
      logger.info(`Deleted ${ticketNotesDeleted} ticket notes for contact ${id}`);
    }

    // 2. Buscar todos os tickets do contato para deletar suas dependências
    const tickets = await Ticket.findAll({
      where: { contactId: id },
      transaction
    });

    // 3. Para cada ticket, deletar suas dependências
    for (const ticket of tickets) {
      // Deletar notas do ticket
      const ticketNotesFromTicket = await TicketNote.destroy({
        where: { ticketId: ticket.id },
        transaction
      });
      
      // Deletar mensagens do ticket
      const messagesFromTicket = await Message.destroy({
        where: { ticketId: ticket.id },
        transaction
      });
      
      logger.info(`Ticket ${ticket.id}: deleted ${ticketNotesFromTicket} notes and ${messagesFromTicket} messages`);
    }

    // 4. Deletar mensagens associadas diretamente ao contato
    const messagesDeleted = await Message.destroy({
      where: { contactId: id },
      transaction
    });
    
    if (messagesDeleted > 0) {
      logger.info(`Deleted ${messagesDeleted} messages directly associated with contact ${id}`);
    }

    // 5. Deletar os tickets
    const ticketsDeleted = await Ticket.destroy({
      where: { contactId: id },
      transaction
    });

    if (ticketsDeleted > 0) {
      logger.info(`Deleted ${ticketsDeleted} tickets for contact ${id}`);
    }

    // 6. Deletar campos customizados
    const customFieldsDeleted = await ContactCustomField.destroy({
      where: { contactId: id },
      transaction
    });

    if (customFieldsDeleted > 0) {
      logger.info(`Deleted ${customFieldsDeleted} custom fields for contact ${id}`);
    }

    // 7. Deletar agendamentos
    const schedulesDeleted = await Schedule.destroy({
      where: { contactId: id },
      transaction
    });

    if (schedulesDeleted > 0) {
      logger.info(`Deleted ${schedulesDeleted} schedules for contact ${id}`);
    }

    // 8. Finalmente, deletar o contato
    await contact.destroy({ transaction });
    
    // Commit da transação
    await transaction.commit();
    
    logger.info(`Contact ${id} and all dependencies deleted successfully`);

  } catch (error) {
    // Rollback em caso de erro
    await transaction.rollback();
    
    logger.error(`Error deleting contact ${id}:`, error);
    
    // Se ainda houver erro de chave estrangeira, fornecer mensagem mais específica
    if (error.message && error.message.includes('foreign key constraint')) {
      logger.error(`Foreign key constraint violation when deleting contact ${id}: ${error.message}`);
      throw new AppError("ERR_CONTACT_HAS_DEPENDENCIES", 400);
    }
    
    throw new AppError("ERR_DELETE_CONTACT", 500);
  }
};

export default DeleteContactService;