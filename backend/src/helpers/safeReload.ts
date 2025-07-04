import { Model } from "sequelize-typescript";

/**
 * Realiza um reload seguro de uma instância do Sequelize
 * Verifica se a instância ainda existe no banco antes de tentar recarregar
 * @param instance - Instância do modelo Sequelize
 * @param ModelClass - Classe do modelo para verificar existência
 * @returns Promise<Model | null> - Instância recarregada ou null se não existir
 */
export async function safeReload<T extends Model>(
  instance: T, 
  ModelClass: any
): Promise<T | null> {
  try {
    // Verificar se a instância ainda existe no banco
    const exists = await ModelClass.findByPk(instance.id);
    if (!exists) {
      console.log(`Instância ${ModelClass.name} com ID ${instance.id} não existe mais no banco de dados`);
      return null;
    }

    // Recarregar a instância
    await instance.reload();
    return instance;
  } catch (error: any) {
    console.error(`Erro ao recarregar ${ModelClass.name} ID ${instance.id}:`, error.message);
    
    // Se o erro for relacionado à instância não existir, retornar null
    if (error.message.includes('could not be reloaded') || 
        error.message.includes('does not exist') ||
        error.message.includes('find call returned null')) {
      return null;
    }
    
    // Para outros erros, re-lançar
    throw error;
  }
}

/**
 * Verifica se uma instância ainda existe no banco de dados
 * @param ModelClass - Classe do modelo
 * @param id - ID da instância
 * @returns Promise<boolean> - true se existir, false caso contrário
 */
export async function instanceExists<T extends Model>(
  ModelClass: any, 
  id: number | string
): Promise<boolean> {
  try {
    const instance = await ModelClass.findByPk(id);
    return !!instance;
  } catch (error) {
    console.error(`Erro ao verificar existência de ${ModelClass.name} ID ${id}:`, error);
    return false;
  }
}