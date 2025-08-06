// ===== GUIA DE MIGRAÇÃO DE CORES =====
// Este arquivo documenta todas as cores hardcoded encontradas e suas substituições

import { SYSTEM_COLORS } from '../styles/colors';

// ===== MAPEAMENTO DE CORES HARDCODED PARA SISTEMA CENTRALIZADO =====
export const COLOR_MIGRATION_MAP = {
  // Cores principais que devem usar MAIN_COLOR
  '#44b774': 'SYSTEM_COLORS.primary.main',
  '#4caf50': 'SYSTEM_COLORS.status.success',
  '#25D366': 'SYSTEM_COLORS.whatsapp.main',
  
  // Cores de fundo
  '#ffffff': 'SYSTEM_COLORS.background.light.paper',
  '#fff': 'SYSTEM_COLORS.background.light.paper',
  'white': 'SYSTEM_COLORS.background.light.paper',
  '#eee': 'SYSTEM_COLORS.background.light.grey',
  '#eeeeee': 'SYSTEM_COLORS.background.light.grey',
  '#f5f5f5': 'SYSTEM_COLORS.background.light.lightGrey',
  '#fafafa': 'SYSTEM_COLORS.background.light.trial',
  '#f8f9fa': 'SYSTEM_COLORS.background.light.form',
  '#e4e4e4': 'SYSTEM_COLORS.background.light.darkGrey',
  
  // Cores de texto
  '#666666': 'SYSTEM_COLORS.text.light.secondary',
  '#666': 'SYSTEM_COLORS.text.light.secondary',
  '#7c7c7c': 'SYSTEM_COLORS.text.light.grey',
  '#151515': 'SYSTEM_COLORS.text.light.primary',
  '#333333': 'SYSTEM_COLORS.text.light.darkGrey',
  '#333': 'SYSTEM_COLORS.text.light.darkGrey',
  
  // Cores de status
  '#f44336': 'SYSTEM_COLORS.status.error',
  '#ff9800': 'SYSTEM_COLORS.status.warning',
  '#2196f3': 'SYSTEM_COLORS.status.info',
  
  // Cores de borda
  '#e0e0e0': 'SYSTEM_COLORS.border.light',
  '#ddd': 'SYSTEM_COLORS.border.table',
  '#e8e8e8': 'SYSTEM_COLORS.background.light.border',
  
  // Cores específicas de mensagens
  '#c7ffa7ff': 'SYSTEM_COLORS.components.message.own.bg',
  '#76a282ff': 'SYSTEM_COLORS.components.message.other.bg',
  '#e1f3fb': 'SYSTEM_COLORS.components.message.system.bg',
  
  // Cores de gradientes
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)': 'SYSTEM_COLORS.gradients.upgrade',
  
  // Cores de trial/upgrade
  '#667eea': 'SYSTEM_COLORS.components.trial.normal.bg',
  '#ff6b35': 'SYSTEM_COLORS.components.trial.warning.bg',
  '#e74c3c': 'SYSTEM_COLORS.components.trial.urgent.bg',
};

// ===== ARQUIVOS QUE PRECISAM SER MIGRADOS =====
export const FILES_TO_MIGRATE = [
  // Componentes críticos
  'components/MessagesList/index.jsx',
  'components/MessageInputCustom/index.jsx',
  'components/TicketListItemCustom/index.jsx',
  'components/TicketInfo/index.jsx',
  'components/TrialTag/index.jsx',
  'components/TrialUpgradePrompt/index.jsx',
  'components/TrialStatusCard/index.jsx',
  
  // Páginas principais
  'pages/Login/index.jsx',
  'pages/Signup/index.jsx',
  'pages/Campaigns/index.jsx',
  'pages/Financeiro/index.jsx',
  'pages/Chat/ChatMessages.jsx',
  'pages/Chat/ChatList.jsx',
  
  // Layout
  'layout/index.jsx',
  
  // Estilos
  'styles/variables.css',
  'assets/css/unified-theme.css',
];

// ===== FUNÇÕES DE MIGRAÇÃO =====

/**
 * Substitui uma cor hardcoded pela referência do sistema
 */
export const migrateColor = (hardcodedColor) => {
  return COLOR_MIGRATION_MAP[hardcodedColor] || hardcodedColor;
};

/**
 * Verifica se uma cor é hardcoded e precisa ser migrada
 */
export const isHardcodedColor = (color) => {
  return COLOR_MIGRATION_MAP.hasOwnProperty(color);
};

/**
 * Obtém todas as cores hardcoded encontradas
 */
export const getHardcodedColors = () => {
  return Object.keys(COLOR_MIGRATION_MAP);
};

/**
 * Gera código de substituição para um arquivo
 */
export const generateReplacementCode = (filePath, hardcodedColor) => {
  const systemReference = migrateColor(hardcodedColor);
  
  if (filePath.endsWith('.jsx')) {
    return `
// Antes:
backgroundColor: "${hardcodedColor}",

// Depois:
backgroundColor: theme.palette.primary.main, // ou ${systemReference}
`;
  }
  
  if (filePath.endsWith('.css')) {
    return `
/* Antes */
background-color: ${hardcodedColor};

/* Depois */
background-color: var(--color-primary); /* ou variável CSS apropriada */
`;
  }
  
  return systemReference;
};

// ===== PRIORIDADES DE MIGRAÇÃO =====
export const MIGRATION_PRIORITIES = {
  HIGH: [
    // Cores que afetam a identidade visual
    '#44b774', // Cor principal antiga
    '#4caf50', // Verde que deve ser primary
    '#25D366', // WhatsApp (manter)
  ],
  
  MEDIUM: [
    // Cores de fundo importantes
    '#ffffff', '#fff', 'white',
    '#eee', '#eeeeee',
    '#f5f5f5', '#fafafa',
  ],
  
  LOW: [
    // Cores de texto e bordas
    '#666666', '#666',
    '#7c7c7c', '#333333',
    '#e0e0e0', '#ddd',
  ]
};

export default {
  COLOR_MIGRATION_MAP,
  FILES_TO_MIGRATE,
  migrateColor,
  isHardcodedColor,
  getHardcodedColors,
  generateReplacementCode,
  MIGRATION_PRIORITIES
};