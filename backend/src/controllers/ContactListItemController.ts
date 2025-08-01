import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListService from "../services/ContactListItemService/ListService";
import CreateService from "../services/ContactListItemService/CreateService";
import ShowService from "../services/ContactListItemService/ShowService";
import UpdateService from "../services/ContactListItemService/UpdateService";
import DeleteService from "../services/ContactListItemService/DeleteService";
import FindService from "../services/ContactListItemService/FindService";
import ImportContactsService from "../services/ContactListItemService/ImportContactsService";

import ContactListItem from "../models/ContactListItem";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  companyId: string | number;
  contactListId: string | number;
};

type StoreData = {
  name: string;
  number: string;
  contactListId: number;
  companyId?: string;
  email?: string;
};

type FindParams = {
  companyId: number;
  contactListId: number;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const { searchParam, pageNumber, contactListId } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { contacts, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    contactListId
  });

  res.json({ contacts, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateService({
    ...data,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-ContactListItem`, {
    action: "create",
    record
  });

  res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const record = await ShowService(id);

  res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = req.body as StoreData;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    id
  });

  const io = getIO();
  io.emit(`company-${companyId}-ContactListItem`, {
    action: "update",
    record
  });

  res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.emit(`company-${companyId}-ContactListItem`, {
    action: "delete",
    id
  });

  res.status(200).json({ message: "Contact deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const params = req.query as unknown as FindParams;
  const records: ContactListItem[] = await FindService(params);

  res.status(200).json(records);
};

export const importContacts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { contactListId } = req.params;
  const { companyId } = req.user;
  const { contactIds } = req.body; // Array de IDs ou vazio para importar todos

  try {
    const result = await ImportContactsService({
      contactListId: parseInt(contactListId),
      companyId: companyId,
      contactIds: contactIds
    });

    const io = getIO();
    io.emit(`company-${companyId}-ContactListItem-${contactListId}`, {
      action: "reload"
    });

    res.status(200).json({
      message: "Importação concluída",
      result: result
    });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const bulkDelete = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { companyId } = req.user;
  const { contactIds } = req.body; // Array de IDs para excluir

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    throw new AppError("Lista de contatos para exclusão é obrigatória", 400);
  }

  try {
    let deletedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Processar exclusões em lotes para evitar sobrecarga
    const batchSize = 10;
    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batch = contactIds.slice(i, i + batchSize);
      
      try {
        // Verificar se os contatos pertencem à empresa
        const contactsToDelete = await ContactListItem.findAll({
          where: {
            id: batch,
            companyId: companyId
          }
        });

        if (contactsToDelete.length !== batch.length) {
          const foundIds = contactsToDelete.map(c => c.id);
          const notFoundIds = batch.filter(id => !foundIds.includes(id));
          errors.push(`Contatos não encontrados ou sem permissão: ${notFoundIds.join(', ')}`);
        }

        // Excluir contatos encontrados
        for (const contact of contactsToDelete) {
          await DeleteService(contact.id.toString());
          deletedCount++;
        }

      } catch (err) {
        console.error(`Erro ao excluir lote ${i}-${i + batchSize}:`, err);
        errorCount += batch.length;
        errors.push(`Erro ao excluir lote: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    // Emitir evento para atualizar interface
    const io = getIO();
    io.emit(`company-${companyId}-ContactListItem`, {
      action: "bulk-delete",
      deletedIds: contactIds.slice(0, deletedCount)
    });

    res.status(200).json({
      message: `Exclusão em massa concluída`,
      result: {
        total: contactIds.length,
        deleted: deletedCount,
        errors: errorCount,
        errorMessages: errors
      }
    });

  } catch (err: any) {
    throw new AppError(`Erro na exclusão em massa: ${err.message}`);
  }
};