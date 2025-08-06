import { useCustomTheme } from '../context/Theme/ThemeContext';
import { getThemeColors, getStatusColor, darkenColor, lightenColor, getContrastColor, hexToRgba } from '../styles/colors';

/**
 * Hook personalizado para acessar o sistema de cores
 * Fornece acesso fácil a todas as cores do sistema e funções utilitárias
 */
export const useColors = () => {
  const { darkMode, colors } = useCustomTheme();

  return {
    // Cores atuais baseadas no tema
    colors,
    
    // Estado do tema
    isDark: darkMode,
    
    // Funções utilitárias
    getStatusColor,
    darkenColor,
    lightenColor,
    getContrastColor,
    hexToRgba,
    
    // Acesso direto às cores mais usadas
    primary: colors.primary.main,
    secondary: colors.secondary.main,
    success: colors.status.success,
    error: colors.status.error,
    warning: colors.status.warning,
    info: colors.status.info,
    
    // Cores de texto
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textInverse: colors.text.inverse,
    
    // Cores de fundo
    bgDefault: colors.background.default,
    bgPaper: colors.background.paper,
    bgDrawer: colors.background.drawer,
    
    // Cores específicas
    whatsapp: colors.whatsapp.main,
    border: colors.border,
    shadow: colors.shadow,
    
    // Função para obter cor com opacidade
    withOpacity: (color, opacity) => hexToRgba(color, opacity),
    
    // Função para obter cor de status com estilo
    getStatusStyle: (status) => ({
      backgroundColor: getStatusColor(status),
      color: getContrastColor(getStatusColor(status)),
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase'
    }),
    
    // Função para obter estilo de chip/tag
    getChipStyle: (color, variant = 'filled') => {
      const baseColor = color || colors.components.tag.default;
      
      if (variant === 'outlined') {
        return {
          backgroundColor: 'transparent',
          color: baseColor,
          border: `1px solid ${baseColor}`,
        };
      }
      
      return {
        backgroundColor: baseColor,
        color: getContrastColor(baseColor),
        border: `1px solid ${darkenColor(baseColor, 0.1)}`,
      };
    },
    
    // Função para obter estilo de botão
    getButtonStyle: (color, variant = 'contained') => {
      const baseColor = color || colors.primary.main;
      
      if (variant === 'outlined') {
        return {
          backgroundColor: 'transparent',
          color: baseColor,
          border: `1px solid ${baseColor}`,
          '&:hover': {
            backgroundColor: hexToRgba(baseColor, 0.1),
          },
        };
      }
      
      if (variant === 'text') {
        return {
          backgroundColor: 'transparent',
          color: baseColor,
          '&:hover': {
            backgroundColor: hexToRgba(baseColor, 0.1),
          },
        };
      }
      
      return {
        backgroundColor: baseColor,
        color: getContrastColor(baseColor),
        '&:hover': {
          backgroundColor: darkenColor(baseColor, 0.1),
        },
      };
    },
    
    // Função para obter estilo de card
    getCardStyle: (elevated = false) => ({
      backgroundColor: colors.background.paper,
      color: colors.text.primary,
      boxShadow: elevated ? colors.shadow : 'none',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
    }),
    
    // Função para obter estilo de input
    getInputStyle: () => ({
      backgroundColor: colors.background.input,
      color: colors.text.primary,
      border: `1px solid ${colors.border}`,
      '&:hover': {
        borderColor: colors.primary.main,
      },
      '&:focus': {
        borderColor: colors.primary.main,
        boxShadow: `0 0 0 2px ${hexToRgba(colors.primary.main, 0.2)}`,
      },
    }),
  };
};

export default useColors;