/**
 * Configuração centralizada de temas
 * Substitui múltiplos arquivos CSS e configurações espalhadas
 */

export const THEME_CONFIG = {
  // Cores principais do sistema
  colors: {
    primary: {
      light: '#1976d2',
      dark: '#90caf9'
    },
    secondary: {
      light: '#dc004e',
      dark: '#f48fb1'
    },
    background: {
      light: '#ffffff',
      dark: '#121212'
    },
    surface: {
      light: '#f5f5f5',
      dark: '#1e1e1e'
    },
    text: {
      light: '#000000',
      dark: '#ffffff'
    }
  },

  // Configurações de transição
  transitions: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Configurações de componentes
  components: {
    toggleSwitch: {
      size: {
        small: '24px',
        medium: '32px',
        large: '40px'
      }
    }
  }
};

export default THEME_CONFIG;