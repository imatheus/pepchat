import React, { createContext, useContext, useState, useEffect } from "react";
import { createTheme } from "@material-ui/core/styles";
import { ptBR } from "@material-ui/core/locale";

const ThemeContext = createContext();

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within a ThemeProvider");
  }
  return context;
};

// Configurações de cores centralizadas
const THEME_COLORS = {
  light: {
    primary: '#44b774',
    secondary: '#f50057',
    background: {
      default: 'transparent',
      paper: '#ffffff',
      drawer: '#44b774',
      appBar: '#ffffff',
    },
    text: {
      primary: '#151515',
      secondary: '#666666',
      inverse: '#ffffff',
    },
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#66bb6a',
    secondary: '#f48fb1',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      drawer: '#1a1a1a',
      appBar: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      inverse: '#000000',
    },
    border: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
  }
};

// Configurações de tipografia centralizadas
const TYPOGRAPHY_CONFIG = {
  fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 700 },
  h5: { fontWeight: 700 },
  h6: { fontWeight: 700 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
  button: { fontWeight: 600, textTransform: 'none' },
};

// Configurações de scrollbar centralizadas
const getScrollbarStyles = (isDark) => ({
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: isDark ? '#555555' : '#cccccc',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: isDark ? '#666666' : '#bbbbbb',
    },
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: isDark ? '#2a2a2a' : '#f1f1f1',
    borderRadius: '4px',
  },
});

// Função para criar overrides do tema
const createThemeOverrides = (colors, isDark) => ({
  MuiCssBaseline: {
    '@global': {
      body: {
        backgroundColor: colors.background.default,
        color: colors.text.primary,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      },
    },
  },
  MuiAppBar: {
    root: {
      backgroundColor: `${colors.background.appBar} !important`,
      color: `${colors.text.primary} !important`,
      boxShadow: `0 2px 4px ${colors.shadow}`,
      '& .MuiIconButton-root': {
        color: `${colors.text.primary} !important`,
      },
      '& .MuiTypography-root': {
        color: `${colors.text.primary} !important`,
      },
    },
  },
  MuiDrawer: {
    paper: {
      backgroundColor: `${colors.background.drawer} !important`,
      color: `${colors.text.inverse} !important`,
      '& .MuiListItem-root': {
        color: `${colors.text.inverse} !important`,
        '&:hover': {
          backgroundColor: isDark ? 'rgba(102, 187, 106, 0.1) !important' : 'rgba(255, 255, 255, 0.1) !important',
        },
        '&.Mui-selected': {
          backgroundColor: isDark ? 'rgba(102, 187, 106, 0.2) !important' : 'rgba(255, 255, 255, 0.2) !important',
        },
      },
      '& .MuiListItemIcon-root': {
        color: `${colors.text.inverse} !important`,
      },
      '& .MuiListItemText-primary': {
        color: `${colors.text.inverse} !important`,
      },
      '& .MuiDivider-root': {
        backgroundColor: isDark ? `${colors.border} !important` : 'rgba(255, 255, 255, 0.2) !important',
      },
      '& .MuiListSubheader-root': {
        backgroundColor: 'transparent !important',
        color: isDark ? `${colors.text.secondary} !important` : `${colors.text.inverse} !important`,
      },
      '& .MuiIconButton-root': {
        color: `${colors.text.inverse} !important`,
      },
    },
  },
  MuiPaper: {
    root: {
      backgroundColor: colors.background.paper,
      color: colors.text.primary,
      ...getScrollbarStyles(isDark),
    },
    outlined: {
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 8px ${colors.shadow}`,
      borderRadius: '12px',
    },
  },
  MuiCard: {
    root: {
      backgroundColor: colors.background.paper,
      color: colors.text.primary,
      boxShadow: `0 2px 8px ${colors.shadow}`,
    },
  },
  MuiTableCell: {
    root: {
      color: `${colors.text.primary} !important`,
      borderBottom: `1px solid ${colors.border} !important`,
    },
    head: {
      backgroundColor: `${isDark ? '#2a2a2a' : '#f5f5f5'} !important`,
      fontWeight: 600,
    },
  },
  MuiTextField: {
    root: {
      '& .MuiInputBase-root': {
        color: colors.text.primary,
        backgroundColor: colors.background.paper,
      },
      '& .MuiInputLabel-root': {
        color: colors.text.secondary,
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.border,
      },
      '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.primary,
      },
    },
  },
  MuiButton: {
    root: {
      fontWeight: 600,
      textTransform: 'none',
      color: colors.text.primary,
    },
    contained: {
      boxShadow: `0 2px 4px ${colors.shadow}`,
      '&:hover': {
        boxShadow: `0 4px 8px ${colors.shadow}`,
      },
    },
  },
  MuiIconButton: {
    root: {
      color: colors.text.primary,
    },
  },
  MuiMenuItem: {
    root: {
      color: colors.text.primary,
      backgroundColor: colors.background.paper,
      '&:hover': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      },
    },
  },
  MuiPopover: {
    paper: {
      backgroundColor: colors.background.paper,
      color: colors.text.primary,
      boxShadow: `0 4px 16px ${colors.shadow}`,
    },
  },
  MuiDialog: {
    paper: {
      backgroundColor: colors.background.paper,
      color: colors.text.primary,
    },
  },
  MuiDialogTitle: {
    root: {
      color: colors.text.primary,
      fontWeight: 700,
    },
  },
  MuiDialogContent: {
    root: {
      color: colors.text.primary,
    },
  },
  MuiChip: {
    root: {
      backgroundColor: isDark ? '#333333' : '#e0e0e0',
      color: colors.text.primary,
    },
  },
  MuiTab: {
    root: {
      color: colors.text.secondary,
      fontWeight: 600,
      textTransform: 'none',
      '&.Mui-selected': {
        color: colors.primary,
      },
    },
  },
  MuiTabs: {
    indicator: {
      backgroundColor: colors.primary,
    },
  },
  MuiFormLabel: {
    root: {
      color: colors.text.secondary,
      '&.Mui-focused': {
        color: colors.primary,
      },
    },
  },
  MuiInputBase: {
    root: {
      color: colors.text.primary,
    },
  },
  MuiSelect: {
    root: {
      color: colors.text.primary,
    },
    icon: {
      color: colors.text.secondary,
    },
  },
  MuiListItem: {
    root: {
      color: colors.text.primary,
      '&:hover': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      },
      '&.Mui-selected': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiListItemText: {
    primary: {
      color: colors.text.primary,
    },
    secondary: {
      color: colors.text.secondary,
    },
  },
  MuiDivider: {
    root: {
      backgroundColor: colors.border,
    },
  },
  MuiTypography: {
    root: {
      color: colors.text.primary,
    },
  },
  MuiSvgIcon: {
    root: {
      color: 'inherit',
    },
  },
  MuiBackdrop: {
    root: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
  },
});

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [locale, setLocale] = useState();

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
    
    const savedDrawerState = localStorage.getItem("drawerCollapsed");
    if (savedDrawerState) {
      setDrawerCollapsed(JSON.parse(savedDrawerState));
    }
  }, []);

  // Aplicar tema ao body dinamicamente
  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.body.classList.add('theme-dark');
    } else {
      document.body.removeAttribute('data-theme');
      document.body.classList.remove('theme-dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const i18nlocale = localStorage.getItem("i18nextLng");
    const browserLocale = i18nlocale?.substring(0, 2) + i18nlocale?.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
  };

  const toggleDrawerCollapse = () => {
    const newDrawerCollapsed = !drawerCollapsed;
    setDrawerCollapsed(newDrawerCollapsed);
    localStorage.setItem("drawerCollapsed", JSON.stringify(newDrawerCollapsed));
  };

  const currentColors = darkMode ? THEME_COLORS.dark : THEME_COLORS.light;

  const theme = createTheme(
    {
      typography: TYPOGRAPHY_CONFIG,
      scrollbarStyles: getScrollbarStyles(darkMode),
      palette: {
        type: darkMode ? 'dark' : 'light',
        primary: {
          main: currentColors.primary,
          contrastText: currentColors.text.inverse,
        },
        secondary: {
          main: currentColors.secondary,
          contrastText: currentColors.text.inverse,
        },
        background: {
          default: currentColors.background.default,
          paper: currentColors.background.paper,
        },
        text: {
          primary: currentColors.text.primary,
          secondary: currentColors.text.secondary,
        },
        divider: currentColors.border,
      },
      overrides: createThemeOverrides(currentColors, darkMode),
    },
    locale
  );

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      theme, 
      drawerCollapsed, 
      toggleDrawerCollapse,
      colors: currentColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};