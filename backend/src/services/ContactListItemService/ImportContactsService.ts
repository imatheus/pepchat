import { Op } from "sequelize";
import Contact from "../../models/Contact";
import ContactListItem from "../../models/ContactListItem";
import { logger } from "../../utils/logger";

interface ImportContactsRequest {
  contactListId: number;
  companyId: number;
  contactIds?: number[]; // IDs específicos ou todos se não informado
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: string[];
}

const ImportContactsService = async ({
  contactListId,
  companyId,
  contactIds
}: ImportContactsRequest): Promise<ImportResult> => {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  try {
    // Buscar contatos para importar
    const whereClause: any = {
      companyId: companyId
    };

    if (contactIds && contactIds.length > 0) {
      whereClause.id = { [Op.in]: contactIds };
    }

    const contacts = await Contact.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    logger.info(`Found ${contacts.length} contacts to import for company ${companyId}`);

    for (const contact of contacts) {
      try {
        // Verificar se já existe na lista
        const existingItem = await ContactListItem.findOne({
          where: {
            contactListId: contactListId,
            number: contact.number
          }
        });

        if (existingItem) {
          result.skipped++;
          result.details.push(`Contato ${contact.name} (${contact.number}) já existe na lista`);
          continue;
        }

        // Criar item na lista
        await ContactListItem.create({
          name: contact.name,
          number: contact.number,
          email: contact.email || "",
          isWhatsappValid: true, // Assumir válido por padrão
          companyId: companyId,
          contactListId: contactListId
        });

        result.imported++;
        result.details.push(`Contato ${contact.name} (${contact.number}) importado com sucesso`);

      } catch (contactError) {
        result.errors++;
        result.details.push(`Erro ao importar ${contact.name}: ${contactError.message}`);
        logger.error(`Error importing contact ${contact.id}:`, contactError);
      }
    }

    logger.info(`Import completed - Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`);

  } catch (error) {
    logger.error("Error in ImportContactsService:", error);
    throw error;
  }

  return result;
};

export default ImportContactsService;