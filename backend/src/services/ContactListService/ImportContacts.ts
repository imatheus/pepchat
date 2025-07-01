import { head } from "lodash";
import XLSX from "xlsx";
import { has } from "lodash";
import ContactListItem from "../../models/ContactListItem";
import CheckContactNumberSafe from "../WbotServices/CheckNumberSafe";
import { logger } from "../../utils/logger";
import GetCompanyActivePlanService from "../CompanyService/GetCompanyActivePlanService";
import AppError from "../../errors/AppError";

interface ImportResult {
  imported: ContactListItem[];
  discarded: number;
  invalidNumbers: string[];
  limitExceeded: boolean;
  maxContactsAllowed: number;
}

export async function ImportContacts(
  contactListId: number,
  companyId: number,
  file: Express.Multer.File | undefined
): Promise<ImportResult> {
  // Verificar limites do plano da empresa
  const planLimits = await GetCompanyActivePlanService({ companyId });
  
  if (!planLimits.useCampaigns) {
    throw new AppError("Campanhas não estão habilitadas no seu plano atual", 403);
  }

  const maxContactsAllowed = planLimits.campaignContactsLimit || 0;

  const workbook = XLSX.readFile(file?.path as string);
  const worksheet = head(Object.values(workbook.Sheets)) as any;
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
  
  const contacts = rows.map(row => {
    let name = "";
    let number = "";
    let email = "";

    if (has(row, "nome") || has(row, "Nome")) {
      name = row["nome"] || row["Nome"];
    }

    if (
      has(row, "numero") ||
      has(row, "número") ||
      has(row, "Numero") ||
      has(row, "Número")
    ) {
      number = row["numero"] || row["número"] || row["Numero"] || row["Número"];
      number = `${number}`.replace(/\D/g, "");
    }

    if (
      has(row, "email") ||
      has(row, "e-mail") ||
      has(row, "Email") ||
      has(row, "E-mail")
    ) {
      email = row["email"] || row["e-mail"] || row["Email"] || row["E-mail"];
    }

    return { name, number, email, contactListId, companyId };
  });

  // Filtrar contatos com números válidos (não vazios e com pelo menos 10 dígitos)
  const validContacts = contacts.filter(contact => {
    return contact.number && contact.number.length >= 10;
  });

  // Verificar se excede o limite de contatos permitidos
  const currentContactsCount = await ContactListItem.count({
    where: {
      contactListId,
      companyId
    }
  });

  const totalAfterImport = currentContactsCount + validContacts.length;
  let limitExceeded = false;
  let contactsToImport = validContacts;

  if (totalAfterImport > maxContactsAllowed) {
    limitExceeded = true;
    const remainingSlots = Math.max(0, maxContactsAllowed - currentContactsCount);
    contactsToImport = validContacts.slice(0, remainingSlots);
    
    logger.warn(`Limite de contatos excedido. Importando apenas ${contactsToImport.length} de ${validContacts.length} contatos válidos.`);
  }

  const contactList: ContactListItem[] = [];
  const invalidNumbers: string[] = [];
  let discardedCount = 0;

  for (const contact of contactsToImport) {
    try {
      const [newContact, created] = await ContactListItem.findOrCreate({
        where: {
          number: `${contact.number}`,
          contactListId: contact.contactListId,
          companyId: contact.companyId
        },
        defaults: contact
      });
      
      if (created) {
        contactList.push(newContact);
      }
    } catch (error) {
      logger.error(`Erro ao criar contato: ${contact.number}`, error);
      discardedCount++;
    }
  }

  // Validar números no WhatsApp usando versão mais segura
  const validatedContacts: ContactListItem[] = [];
  
  for (let newContact of contactList) {
    logger.info(`Validando número: ${newContact.number}`);
    
    const checkResult = await CheckContactNumberSafe(newContact.number, companyId);
    
    if (!checkResult.isValid) {
      // Erro de sistema/conexão - manter contato mas marcar como não validado
      logger.warn(`Erro de sistema ao validar ${newContact.number}: ${checkResult.error}. Mantendo contato como não validado.`);
      newContact.isWhatsappValid = false;
      await newContact.save();
      validatedContacts.push(newContact);
    } else if (!checkResult.exists) {
      // Número não existe no WhatsApp - DESCARTAR apenas se temos certeza
      if (checkResult.error === "Número não encontrado no WhatsApp") {
        logger.warn(`Número de contato inválido descartado (não existe no WhatsApp): ${newContact.number}`);
        invalidNumbers.push(newContact.number);
        
        try {
          await newContact.destroy();
          discardedCount++;
        } catch (deleteError) {
          logger.error(`Erro ao remover contato inválido: ${newContact.number}`, deleteError);
        }
      } else {
        // Incerteza - manter como não validado
        logger.warn(`Incerteza sobre validade do número ${newContact.number}: ${checkResult.error}. Mantendo como não validado.`);
        newContact.isWhatsappValid = false;
        await newContact.save();
        validatedContacts.push(newContact);
      }
    } else {
      // Número válido e existe no WhatsApp
      newContact.isWhatsappValid = true;
      if (checkResult.jid) {
        const number = checkResult.jid.replace(/\D/g, "");
        newContact.number = number;
      }
      await newContact.save();
      validatedContacts.push(newContact);
      logger.info(`Número validado com sucesso: ${newContact.number}`);
    }
  }

  // Contar contatos descartados por filtros iniciais
  const initiallyDiscarded = contacts.length - validContacts.length;
  const totalDiscarded = discardedCount + initiallyDiscarded + (validContacts.length - contactsToImport.length);

  return {
    imported: validatedContacts,
    discarded: totalDiscarded,
    invalidNumbers,
    limitExceeded,
    maxContactsAllowed
  };
}