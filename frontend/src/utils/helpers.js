/**
 * Utilitários para substituir funções simples do lodash
 * Reduz o bundle size e melhora a performance
 */

/**
 * Verifica se um valor é um array
 * @param {*} value - Valor a ser verificado
 * @returns {boolean}
 */
export const isArray = (value) => Array.isArray(value);

/**
 * Verifica se um valor é uma string
 * @param {*} value - Valor a ser verificado
 * @returns {boolean}
 */
export const isString = (value) => typeof value === 'string';

/**
 * Verifica se um valor é um objeto (não array, não null)
 * @param {*} value - Valor a ser verificado
 * @returns {boolean}
 */
export const isObject = (value) => 
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Verifica se um valor é null ou undefined
 * @param {*} value - Valor a ser verificado
 * @returns {boolean}
 */
export const isNil = (value) => value == null;

/**
 * Verifica se um valor é null
 * @param {*} value - Valor a ser verificado
 * @returns {boolean}
 */
export const isNull = (value) => value === null;

/**
 * Verifica se um objeto/array está vazio
 * @param {*} value - Valor a ser verificado
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Verifica se um objeto tem uma propriedade específica
 * @param {object} object - Objeto a ser verificado
 * @param {string} path - Caminho da propriedade
 * @returns {boolean}
 */
export const has = (object, path) => {
  if (!object || typeof object !== 'object') return false;
  
  const keys = path.split('.');
  let current = object;
  
  for (const key of keys) {
    if (current == null || !(key in current)) return false;
    current = current[key];
  }
  
  return true;
};

/**
 * Obtém o valor de uma propriedade específica de um objeto
 * @param {object} object - Objeto fonte
 * @param {string} path - Caminho da propriedade
 * @param {*} defaultValue - Valor padrão se não encontrar
 * @returns {*}
 */
export const get = (object, path, defaultValue = undefined) => {
  if (!object || typeof object !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current = object;
  
  for (const key of keys) {
    if (current == null || !(key in current)) return defaultValue;
    current = current[key];
  }
  
  return current;
};

/**
 * Obtém valores de propriedades específicas de um objeto
 * @param {object} object - Objeto fonte
 * @param {...string} paths - Caminhos das propriedades
 * @returns {array}
 */
export const at = (object, ...paths) => {
  return paths.map(path => get(object, path));
};

/**
 * Capitaliza a primeira letra de uma string
 * @param {string} string - String a ser capitalizada
 * @returns {string}
 */
export const capitalize = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

/**
 * Obtém o primeiro elemento de um array
 * @param {array} array - Array fonte
 * @returns {*}
 */
export const head = (array) => {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  return array[0];
};

/**
 * Verifica se dois valores são iguais (comparação profunda simples)
 * @param {*} value1 - Primeiro valor
 * @param {*} value2 - Segundo valor
 * @returns {boolean}
 */
export const isEqual = (value1, value2) => {
  if (value1 === value2) return true;
  
  if (value1 == null || value2 == null) return value1 === value2;
  
  if (typeof value1 !== typeof value2) return false;
  
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    return value1.every((item, index) => isEqual(item, value2[index]));
  }
  
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => 
      keys2.includes(key) && isEqual(value1[key], value2[key])
    );
  }
  
  return false;
};

/**
 * Debounce function - limita a frequência de execução de uma função
 * @param {function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @param {boolean} immediate - Se deve executar imediatamente
 * @returns {function}
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

/**
 * Throttle function - limita a execução de uma função a uma vez por período
 * @param {function} func - Função a ser executada
 * @param {number} limit - Limite de tempo em ms
 * @returns {function}
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Clona um objeto/array de forma profunda (simples)
 * @param {*} obj - Objeto a ser clonado
 * @returns {*}
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * Remove propriedades undefined/null de um objeto
 * @param {object} obj - Objeto a ser limpo
 * @returns {object}
 */
export const cleanObject = (obj) => {
  if (!isObject(obj)) return obj;
  
  const cleaned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] != null) {
      cleaned[key] = obj[key];
    }
  }
  
  return cleaned;
};

/**
 * Formata um número como moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata uma data para o padrão brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data e hora para o padrão brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('pt-BR');
};

/**
 * Gera um ID único simples
 * @returns {string}
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Trunca um texto para um tamanho específico
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @param {string} suffix - Sufixo a ser adicionado
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};