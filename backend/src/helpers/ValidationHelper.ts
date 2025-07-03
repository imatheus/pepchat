import * as Yup from "yup";
import AppError from "../errors/AppError";

export class ValidationHelper {
  /**
   * Schema comum para validação de usuário
   */
  static getUserValidationSchema() {
    return Yup.object().shape({
      name: Yup.string()
        .required("Nome é obrigatório")
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
      
      email: Yup.string()
        .email("Email deve ter um formato válido")
        .required("Email é obrigatório"),
      
      password: Yup.string()
        .min(6, "Senha deve ter pelo menos 6 caracteres")
        .max(50, "Senha deve ter no máximo 50 caracteres")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"
        ),
      
      profile: Yup.string()
        .oneOf(["admin", "user"], "Perfil deve ser 'admin' ou 'user'"),
      
      profileImage: Yup.string().nullable()
    });
  }

  /**
   * Schema para validação de empresa
   */
  static getCompanyValidationSchema() {
    return Yup.object().shape({
      name: Yup.string()
        .required("Nome da empresa é obrigatório")
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres"),
      
      email: Yup.string()
        .email("Email deve ter um formato válido")
        .required("Email é obrigatório"),
      
      document: Yup.string()
        .matches(/^\d{11}$|^\d{14}$/, "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)")
        .nullable()
    });
  }

  /**
   * Schema para validação de contato
   */
  static getContactValidationSchema() {
    return Yup.object().shape({
      name: Yup.string()
        .required("Nome é obrigatório")
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres"),
      
      number: Yup.string()
        .required("Número é obrigatório")
        .matches(/^\d{10,15}$/, "Número deve conter entre 10 e 15 dígitos"),
      
      email: Yup.string()
        .email("Email deve ter um formato válido")
        .nullable()
    });
  }

  /**
   * Schema para validação de fila
   */
  static getQueueValidationSchema() {
    return Yup.object().shape({
      name: Yup.string()
        .required("Nome da fila é obrigatório")
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(50, "Nome deve ter no máximo 50 caracteres"),
      
      color: Yup.string()
        .required("Cor é obrigatória")
        .matches(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido")
    });
  }

  /**
   * Schema para validação de mensagem
   */
  static getMessageValidationSchema() {
    return Yup.object().shape({
      body: Yup.string()
        .required("Mensagem é obrigatória")
        .min(1, "Mensagem não pode estar vazia")
        .max(4096, "Mensagem deve ter no máximo 4096 caracteres"),
      
      ticketId: Yup.number()
        .required("ID do ticket é obrigatório")
        .positive("ID do ticket deve ser um número positivo")
        .integer("ID do ticket deve ser um número inteiro")
    });
  }

  /**
   * Schema para validação de campanha
   */
  static getCampaignValidationSchema() {
    return Yup.object().shape({
      name: Yup.string()
        .required("Nome da campanha é obrigatório")
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres"),
      
      message: Yup.string()
        .required("Mensagem é obrigatória")
        .min(1, "Mensagem não pode estar vazia")
        .max(4096, "Mensagem deve ter no máximo 4096 caracteres"),
      
      contactListId: Yup.number()
        .required("Lista de contatos é obrigatória")
        .positive("ID da lista deve ser um número positivo")
        .integer("ID da lista deve ser um número inteiro")
    });
  }

  /**
   * Valida dados usando um schema Yup
   */
  static async validateData(schema: Yup.ObjectSchema<any>, data: any): Promise<void> {
    try {
      await schema.validate(data, { abortEarly: false });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const messages = error.errors.join(", ");
        throw new AppError(`Dados inválidos: ${messages}`, 400);
      }
      throw error;
    }
  }

  /**
   * Sanitiza dados de entrada removendo campos não permitidos
   */
  static sanitizeUserData(data: any): any {
    const allowedFields = ['name', 'email', 'password', 'profile', 'profileImage', 'queueIds'];
    return this.pickFields(data, allowedFields);
  }

  /**
   * Sanitiza dados de empresa
   */
  static sanitizeCompanyData(data: any): any {
    const allowedFields = ['name', 'email', 'document', 'phone', 'planId'];
    return this.pickFields(data, allowedFields);
  }

  /**
   * Sanitiza dados de contato
   */
  static sanitizeContactData(data: any): any {
    const allowedFields = ['name', 'number', 'email', 'profilePicUrl', 'isGroup'];
    return this.pickFields(data, allowedFields);
  }

  /**
   * Utilitário para pegar apenas campos permitidos
   */
  private static pickFields(obj: any, fields: string[]): any {
    const result: any = {};
    fields.forEach(field => {
      if (obj.hasOwnProperty(field)) {
        result[field] = obj[field];
      }
    });
    return result;
  }

  /**
   * Valida IDs numéricos
   */
  static validateId(id: any, fieldName: string = "ID"): number {
    const numericId = parseInt(id, 10);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new AppError(`${fieldName} deve ser um número inteiro positivo`, 400);
    }
    return numericId;
  }

  /**
   * Valida parâmetros de paginação
   */
  static validatePaginationParams(pageNumber: any, searchParam: any = ""): { pageNumber: number; searchParam: string } {
    const validPageNumber = pageNumber ? this.validateId(pageNumber, "Número da página") : 1;
    const validSearchParam = typeof searchParam === 'string' ? searchParam.trim().substring(0, 100) : "";
    
    return {
      pageNumber: validPageNumber,
      searchParam: validSearchParam
    };
  }
}