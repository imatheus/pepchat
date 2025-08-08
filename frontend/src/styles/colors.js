// ===== SISTEMA DE CORES CENTRALIZADO =====
// Este arquivo contém todas as cores do sistema
// Para alterar as cores do site inteiro, modifique apenas este arquivo

// ===== COR PRINCIPAL DO SISTEMA =====
// Esta é a cor que será usada para sidebar, botões, links e elementos principais
const MAIN_COLOR = '#01a58cff';

export const SYSTEM_COLORS = {
  // ===== CORES PRINCIPAIS =====
  // A cor principal é a mesma do sidebar para manter consistência
  primary: {
    main: MAIN_COLOR,           // Cor principal (sidebar, botões, links)
    light: '#8bc34a',           // Cor clara
    dark: '#558b2f',            // Cor escura
    contrastText: '#ffffff'     // Texto sobre a cor principal
  },
  
  secondary: {
    main: '#f50057',      // Rosa/vermelho secundário
    light: '#f48fb1',     // Rosa claro (modo escuro)
    dark: '#c51162',      // Rosa escuro
    contrastText: '#ffffff'
  },

  // ===== CORES DE STATUS =====
  status: {
    success: '#4caf50',   // Verde sucesso
    error: '#f44336',     // Vermelho erro
    warning: '#ff9800',   // Laranja aviso
    info: '#2196f3',      // Azul informação
    pending: '#ff9800',   // Laranja pendente
    cancelled: '#f44336', // Vermelho cancelado
    completed: '#4caf50', // Verde completado
    inProgress: '#2196f3' // Azul em progresso
  },

  // ===== CORES DE FUNDO =====
  background: {
    light: {
      default: '#ffffff',       // Fundo padrão do sistema
      paper: '#ffffff',         // Fundo de cards/papers
      drawer: MAIN_COLOR,       // Sidebar usa a cor principal
      appBar: '#ffffff',        // Header/AppBar
      card: '#ffffff',          // Cards
      input: '#ffffff',         // Inputs
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: '#f5f5f5',
      overlay: 'rgba(0, 0, 0, 0.5)',
      // Cores específicas encontradas no código
      messageOwn: '#c7ffa7ff',     // Mensagens próprias (verde claro)
      messageOther: '#76a282ff',   // Mensagens de outros (verde médio)
      messageSystem: '#e1f3fb',    // Mensagens do sistema (azul claro)
      messageDaily: '#e1f3fb',     // Timestamp diário
      ticketHeader: '#eee',        // Header dos tickets
      form: '#f8f9fa',            // Formulários
      skeleton: '#eee',           // Skeleton loading
      border: '#e8e8e8',          // Bordas
      divider: '#e0e0e0',         // Divisores
      grey: '#eeeeee',            // Cinza claro
      lightGrey: '#f5f5f5',       // Cinza muito claro
      darkGrey: '#e4e4e4',        // Cinza escuro
      chat: '#ededed',            // Chat background alternado
      chatWhite: '#ffffff',       // Chat background branco
      upgrade: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Gradiente upgrade
      trial: '#fafafa',           // Trial background
      documentation: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', // Documentação
    },
    dark: {
      default: '#121212',
      paper: '#1e1e1e',
      drawer: MAIN_COLOR,       // Sidebar usa a cor principal também no modo escuro
      appBar: '#1e1e1e',
      card: '#1e1e1e',
      input: '#2a2a2a',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.12)',
      disabled: '#333333',
      overlay: 'rgba(0, 0, 0, 0.7)',
      // Cores específicas para modo escuro
      messageOwn: '#4caf50',       // Mensagens próprias (verde)
      messageOther: '#333333',     // Mensagens de outros (cinza escuro)
      messageSystem: '#2a2a2a',    // Mensagens do sistema
      messageDaily: '#2a2a2a',     // Timestamp diário
      ticketHeader: '#333333',     // Header dos tickets
      form: '#2a2a2a',            // Formulários
      skeleton: '#333333',         // Skeleton loading
      border: '#333333',          // Bordas
      divider: '#333333',         // Divisores
      grey: '#424242',            // Cinza claro
      lightGrey: '#2a2a2a',       // Cinza muito claro
      darkGrey: '#333333',        // Cinza escuro
      chat: '#252525',            // Chat background alternado
      chatWhite: '#1e1e1e',       // Chat background "branco"
      upgrade: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)', // Gradiente upgrade
      trial: '#1e1e1e',           // Trial background
      documentation: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)', // Documentação
    }
  },

  // ===== CORES DE TEXTO =====
  text: {
    light: {
      primary: '#151515',        // Texto principal
      secondary: '#666666',      // Texto secundário
      disabled: '#9e9e9e',       // Texto desabilitado
      inverse: '#ffffff',        // Texto inverso (sobre cores escuras)
      hint: '#999999',           // Texto de dica
      // Cores específicas encontradas
      grey: '#7c7c7c',          // Cinza médio
      lightGrey: '#808888',     // Cinza claro
      darkGrey: '#495057',      // Cinza escuro
      blue: '#6bcbef',          // Azul claro
      green: '#35cd96',         // Verde
      whatsapp: '#25D366',      // WhatsApp verde
      error: '#721c24',         // Texto de erro
      warning: '#856404',       // Texto de aviso
      success: '#155724',       // Texto de sucesso
      info: '#0c5460',          // Texto de informação
    },
    dark: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#666666',
      inverse: '#000000',
      hint: '#888888',
      // Cores específicas para modo escuro
      grey: '#cccccc',
      lightGrey: '#b0b0b0',
      darkGrey: '#ffffff',
      blue: '#6bcbef',
      green: '#35cd96',
      whatsapp: '#25D366',
      error: '#ffcdd2',
      warning: '#fff3e0',
      success: '#c8e6c9',
      info: '#e1f5fe',
    }
  },

  // ===== CORES DE BORDA E DIVISORES =====
  border: {
    light: '#e0e0e0',
    dark: '#333333',
    // Cores específicas
    input: '#dadde9',
    card: '#8c8c8c5f',
    form: '#e9ecef',
    formFocus: '#dee2e6',
    table: '#ddd',
    modal: '#ddd',
    button: '#bbbbbb',
  },

  // ===== SOMBRAS =====
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.3)',
    // Sombras específicas
    card: '0 2px 8px rgba(0, 0, 0, 0.1)',
    drawer: '0 4px 12px rgba(0, 0, 0, 0.1)',
    modal: '0 4px 12px rgba(0, 0, 0, 0.08)',
    button: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },

  // ===== CORES ESPECÍFICAS DO WHATSAPP =====
  whatsapp: {
    main: '#25D366',
    dark: '#128C7E',
    light: '#DCF8C6'
  },

  // ===== CORES DE GRADIENTE =====
  gradients: {
    primary: `linear-gradient(135deg, ${MAIN_COLOR} 0%, #558b2f 100%)`,
    success: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    error: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
    warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    info: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
    // Gradientes específicos encontrados
    login: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    upgrade: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    trial: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    urgent: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    warningGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
  },

  // ===== CORES DE SCROLLBAR =====
  scrollbar: {
    light: {
      thumb: '#cccccc',
      thumbHover: '#bbbbbb',
      track: '#f1f1f1'
    },
    dark: {
      thumb: '#555555',
      thumbHover: '#666666',
      track: '#2a2a2a'
    }
  },

  // ===== CORES ESPECÍFICAS DE COMPONENTES =====
  components: {
    // Cores para tags/chips
    tag: {
      default: '#eee',
      text: '#333'
    },
    
    // Cores para formulários
    form: {
      background: '#f8f9fa',
      border: '#e9ecef',
      borderFocus: '#dee2e6'
    },
    
    // Cores para tabelas
    table: {
      headerBg: {
        light: '#f5f5f5',
        dark: '#2a2a2a'
      },
      stripedBg: {
        light: '#fafafa',
        dark: '#252525'
      }
    },
    
    // Cores para campanhas
    campaign: {
      error: {
        bg: '#f8d7da',
        text: '#721c24',
        border: '#f5c6cb'
      },
      scheduled: {
        bg: '#d1ecf1',
        text: '#0c5460',
        border: '#bee5eb'
      },
      inProgress: {
        bg: '#fff3cd',
        text: '#856404',
        border: '#ffeaa7'
      },
      cancelled: {
        bg: '#f8d7da',
        text: '#721c24',
        border: '#f5c6cb'
      },
      completed: {
        bg: '#d4edda',
        text: '#155724',
        border: '#c3e6cb'
      }
    },

    // Cores para avatares
    avatar: {
      default: {
        bg: '#e4e4e4',
        text: '#7c7c7c'
      },
      online: {
        indicator: '#44b700'
      },
      offline: {
        indicator: '#ccc'
      }
    },

    // Cores para botões específicos
    button: {
      newTicket: {
        bg: MAIN_COLOR,
        text: '#ffffff',
        hover: '#558b2f'
      },
      trial: {
        bg: '#4caf50',
        text: '#ffffff',
        hover: '#45a049'
      },
      upgrade: {
        bg: '#ffffff',
        text: '#667eea',
        hover: 'rgba(255, 255, 255, 0.1)'
      },
      urgent: {
        bg: '#ffffff',
        text: '#e74c3c',
        hover: 'rgba(255, 255, 255, 0.1)'
      }
    },

    // Cores para mensagens
    message: {
      own: {
        bg: '#c7ffa7ff',
        text: '#2d4a15ff',
        border: '#cfe9ba'
      },
      other: {
        bg: '#76a282ff',
        text: '#ffffff',
        border: '#b3b3b3'
      },
      system: {
        bg: '#e1f3fb',
        text: '#808888',
        border: '#b3b3b3'
      },
      typing: {
        text: '#666',
        dot: '#666'
      }
    },

    // Cores para tickets
    ticket: {
      queue: '#7C7C7C',
      border: '#8c8c8c5f',
      unread: '#3498db',
      priority: '#7d79f2',
      whatsapp: '#25D366'
    },

    // Cores para status indicators
    status: {
      online: '#44b700',
      offline: '#ccc',
      away: '#ff9800',
      busy: '#f44336'
    },

    // Cores para trial/upgrade
    trial: {
      normal: {
        bg: '#667eea',
        text: '#fff'
      },
      warning: {
        bg: '#ff6b35',
        text: '#fff'
      },
      urgent: {
        bg: '#e74c3c',
        text: '#fff'
      },
      chip: {
        bg: 'rgba(255, 255, 255, 0.2)',
        text: '#fff'
      }
    },

    // Cores para documentação
    documentation: {
      light: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
      dark: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)'
    },

    // Cores para toggle switch
    toggle: {
      track: {
        on: '#000000',
        off: '#c2c2c2'
      },
      thumb: {
        on: '#000000',
        off: '#ffffff'
      },
      border: {
        on: '#ffffff',
        off: '#bbbbbb'
      }
    }
  }
};

// ===== FUNÇÕES UTILITÁRIAS =====

/**
 * Escurece uma cor em uma porcentagem
 */
export const darkenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

/**
 * Clareia uma cor em uma porcentagem
 */
export const lightenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
};

/**
 * Calcula a cor de contraste (preto ou branco) para uma cor de fundo
 */
export const getContrastColor = (hexColor) => {
  // Remove o # se presente
  const color = hexColor.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calcula a luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retorna preto ou branco baseado na luminância
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Converte uma cor hex para rgba
 */
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Obtém a cor de status baseada no tipo
 */
export const getStatusColor = (status) => {
  const statusMap = {
    'success': SYSTEM_COLORS.status.success,
    'error': SYSTEM_COLORS.status.error,
    'warning': SYSTEM_COLORS.status.warning,
    'info': SYSTEM_COLORS.status.info,
    'pending': SYSTEM_COLORS.status.pending,
    'cancelled': SYSTEM_COLORS.status.cancelled,
    'completed': SYSTEM_COLORS.status.completed,
    'inProgress': SYSTEM_COLORS.status.inProgress,
    'ENVIADO': SYSTEM_COLORS.status.success,
    'ERRO': SYSTEM_COLORS.status.error,
    'PENDENTE': SYSTEM_COLORS.status.pending,
    'FINALIZADA': SYSTEM_COLORS.status.completed,
    'CANCELADA': SYSTEM_COLORS.status.cancelled,
    'EM_ANDAMENTO': SYSTEM_COLORS.status.inProgress
  };
  
  return statusMap[status] || SYSTEM_COLORS.status.info;
};

/**
 * Obtém as cores para o tema atual (claro ou escuro) - VERSÃO SIMPLIFICADA
 * A cor principal é sempre a mesma do sidebar
 */
export const getThemeColors = (isDark = false) => {
  return {
    primary: SYSTEM_COLORS.primary,  // Usa diretamente a cor principal
    secondary: SYSTEM_COLORS.secondary,
    status: SYSTEM_COLORS.status,
    background: isDark ? SYSTEM_COLORS.background.dark : SYSTEM_COLORS.background.light,
    text: isDark ? SYSTEM_COLORS.text.dark : SYSTEM_COLORS.text.light,
    border: isDark ? SYSTEM_COLORS.border.dark : SYSTEM_COLORS.border.light,
    shadow: isDark ? SYSTEM_COLORS.shadow.dark : SYSTEM_COLORS.shadow.light,
    whatsapp: SYSTEM_COLORS.whatsapp,
    gradients: SYSTEM_COLORS.gradients,
    scrollbar: isDark ? SYSTEM_COLORS.scrollbar.dark : SYSTEM_COLORS.scrollbar.light,
    components: SYSTEM_COLORS.components
  };
};

/**
 * Função para alterar a cor principal do sistema
 * Basta alterar a constante MAIN_COLOR no topo do arquivo
 */
export const updateMainColor = (newColor) => {
  // Para alterar a cor principal, modifique a constante MAIN_COLOR no topo do arquivo
  console.log(`Para alterar a cor principal, modifique MAIN_COLOR para: ${newColor}`);
  return newColor;
};

export default SYSTEM_COLORS;