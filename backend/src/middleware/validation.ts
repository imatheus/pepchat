import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import AppError from "../errors/AppError";

// Middleware para processar resultados de validação
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(", ");
    throw new AppError(`Dados inválidos: ${errorMessages}`, 400);
  }
  
  next();
};

// Validações comuns para usuários
export const validateUser = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres")
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage("Nome deve conter apenas letras e espaços"),
  
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email deve ter um formato válido"),
  
  body("password")
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage("Senha deve ter entre 6 e 50 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"),
  
  body("profile")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Perfil deve ser 'admin' ou 'user'"),
  
  handleValidationErrors
];

// Validações para login
export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email deve ter um formato válido"),
  
  body("password")
    .notEmpty()
    .withMessage("Senha é obrigatória"),
  
  handleValidationErrors
];

// Validações para empresa
export const validateCompany = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da empresa deve ter entre 2 e 100 caracteres"),
  
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email deve ter um formato válido"),
  
  body("document")
    .optional()
    .matches(/^\d{11}$|^\d{14}$/)
    .withMessage("Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)"),
  
  handleValidationErrors
];

// Valida��ões para contatos
export const validateContact = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),
  
  body("number")
    .matches(/^\d{10,15}$/)
    .withMessage("Número deve conter entre 10 e 15 dígitos"),
  
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email deve ter um formato válido"),
  
  handleValidationErrors
];

// Validações para mensagens
export const validateMessage = [
  body("body")
    .trim()
    .isLength({ min: 1, max: 4096 })
    .withMessage("Mensagem deve ter entre 1 e 4096 caracteres"),
  
  param("ticketId")
    .isInt({ min: 1 })
    .withMessage("ID do ticket deve ser um número inteiro positivo"),
  
  handleValidationErrors
];

// Validações para tickets
export const validateTicket = [
  body("contactId")
    .isInt({ min: 1 })
    .withMessage("ID do contato deve ser um número inteiro positivo"),
  
  body("status")
    .optional()
    .isIn(["open", "pending", "closed"])
    .withMessage("Status deve ser 'open', 'pending' ou 'closed'"),
  
  body("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID do usuário deve ser um número inteiro positivo"),
  
  handleValidationErrors
];

// Validações para filas
export const validateQueue = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Nome da fila deve ter entre 2 e 50 caracteres"),
  
  body("color")
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Cor deve ser um código hexadecimal válido"),
  
  handleValidationErrors
];

// Validações para campanhas
export const validateCampaign = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da campanha deve ter entre 2 e 100 caracteres"),
  
  body("message")
    .trim()
    .isLength({ min: 1, max: 4096 })
    .withMessage("Mensagem deve ter entre 1 e 4096 caracteres"),
  
  body("contactListId")
    .isInt({ min: 1 })
    .withMessage("ID da lista de contatos deve ser um número inteiro positivo"),
  
  handleValidationErrors
];

// Validações para parâmetros de ID
export const validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID deve ser um número inteiro positivo"),
  
  handleValidationErrors
];

// Validações para paginação
export const validatePagination = [
  query("pageNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Número da página deve ser um inteiro positivo"),
  
  query("searchParam")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Parâmetro de busca deve ter no máximo 100 caracteres"),
  
  handleValidationErrors
];