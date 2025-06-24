import ContactListItem from "../models/ContactListItem";
import ContactCustomField from "../models/ContactCustomField";

interface VariableData {
  nome?: string;
  numero?: string;
  email?: string;
  [key: string]: any; // Para variáveis personalizadas
}

export class MessageVariables {
  /**
   * Processa variáveis em uma mensagem
   */
  static processVariables(message: string, data: VariableData): string {
    if (!message) return message;

    let processedMessage = message;

    // Variáveis padrão
    const standardVariables = {
      '{nome}': data.nome || '',
      '{numero}': data.numero || '',
      '{email}': data.email || ''
    };

    // Substituir variáveis padrão
    Object.entries(standardVariables).forEach(([variable, value]) => {
      const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'gi');
      processedMessage = processedMessage.replace(regex, value);
    });

    // Substituir variáveis personalizadas
    Object.entries(data).forEach(([key, value]) => {
      if (!['nome', 'numero', 'email'].includes(key)) {
        const variable = `{${key}}`;
        const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'gi');
        processedMessage = processedMessage.replace(regex, value || '');
      }
    });

    return processedMessage;
  }

  /**
   * Extrai dados de um contato para usar como variáveis
   */
  static async extractContactData(contact: ContactListItem): Promise<VariableData> {
    const data: VariableData = {
      nome: contact.name,
      numero: contact.number,
      email: contact.email
    };

    // Buscar campos personalizados se existirem
    try {
      const customFields = await ContactCustomField.findAll({
        where: { contactId: contact.id }
      });

      customFields.forEach(field => {
        data[field.name] = field.value;
      });
    } catch (error) {
      // Ignorar erro se não conseguir buscar campos personalizados
    }

    return data;
  }

  /**
   * Lista todas as variáveis disponíveis em uma mensagem
   */
  static extractVariables(message: string): string[] {
    if (!message) return [];

    const variableRegex = /{([^}]+)}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(message)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Valida se todas as variáveis necessárias estão disponíveis
   */
  static validateVariables(message: string, availableData: VariableData): {
    valid: boolean;
    missingVariables: string[];
  } {
    const requiredVariables = this.extractVariables(message);
    const missingVariables: string[] = [];

    requiredVariables.forEach(variable => {
      if (!(variable in availableData) || !availableData[variable]) {
        missingVariables.push(variable);
      }
    });

    return {
      valid: missingVariables.length === 0,
      missingVariables
    };
  }

  /**
   * Gera preview de uma mensagem com dados de exemplo
   */
  static generatePreview(message: string): string {
    const exampleData: VariableData = {
      nome: 'João Silva',
      numero: '5511999999999',
      email: 'joao@exemplo.com'
    };

    return this.processVariables(message, exampleData);
  }
}

export default MessageVariables;