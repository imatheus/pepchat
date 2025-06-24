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
    const browserLocale =
      i18nlocale?.substring(0, 2) + i18nlocale?.substring(3, 5);

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

  // Cores base para o tema
  const colors = {
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

  const currentColors = darkMode ? colors.dark : colors.light;

  const baseTheme = {
    typography: {
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
    },
    scrollbarStyles: {
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: darkMode ? '#555555' : '#cccccc',
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: darkMode ? '#666666' : '#bbbbbb',
        },
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: darkMode ? '#2a2a2a' : '#f1f1f1',
        borderRadius: '4px',
      },
    },
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
  };

  const lightTheme = createTheme(
    {
      ...baseTheme,
      overrides: {
        MuiCssBaseline: {
          '@global': {
            body: {
              backgroundColor: currentColors.background.default,
              color: currentColors.text.primary,
            },
          },
        },
        MuiAppBar: {
          root: {
            backgroundColor: `${currentColors.background.appBar} !important`,
            color: `${currentColors.text.primary} !important`,
            boxShadow: `0 2px 4px ${currentColors.shadow}`,
            '& .MuiIconButton-root': {
              color: `${currentColors.text.primary} !important`,
            },
            '& .MuiTypography-root': {
              color: `${currentColors.text.primary} !important`,
            },
          },
        },
        MuiDrawer: {
          paper: {
            backgroundColor: `${currentColors.background.drawer} !important`,
            color: `${currentColors.text.inverse} !important`,
            '& .MuiListItem-root': {
              color: `${currentColors.text.inverse} !important`,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
              },
            },
            '& .MuiListItemIcon-root': {
              color: `${currentColors.text.inverse} !important`,
            },
            '& .MuiListItemText-primary': {
              color: `${currentColors.text.inverse} !important`,
            },
            '& .MuiDivider-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
            },
            '& .MuiListSubheader-root': {
              backgroundColor: 'transparent !important',
              color: `${currentColors.text.inverse} !important`,
            },
            '& .MuiIconButton-root': {
              color: `${currentColors.text.inverse} !important`,
            },
          },
        },
        MuiPaper: {
          root: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
          },
          outlined: {
            border: `1px solid ${currentColors.border}`,
            boxShadow: `0 2px 8px ${currentColors.shadow}`,
            borderRadius: '12px',
          },
        },
        MuiCard: {
          root: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
            boxShadow: `0 2px 8px ${currentColors.shadow}`,
          },
        },
        MuiTableCell: {
          root: {
            color: currentColors.text.primary,
            borderBottom: `1px solid ${currentColors.border}`,
          },
          head: {
            backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
            fontWeight: 600,
          },
        },
        MuiTextField: {
          root: {
            '& .MuiInputBase-root': {
              color: currentColors.text.primary,
              backgroundColor: currentColors.background.paper,
            },
            '& .MuiInputLabel-root': {
              color: currentColors.text.secondary,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: currentColors.border,
            },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: currentColors.primary,
            },
          },
        },
        MuiButton: {
          root: {
            fontWeight: 600,
            textTransform: 'none',
          },
          contained: {
            boxShadow: `0 2px 4px ${currentColors.shadow}`,
            '&:hover': {
              boxShadow: `0 4px 8px ${currentColors.shadow}`,
            },
          },
        },
        MuiIconButton: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiMenuItem: {
          root: {
            color: currentColors.text.primary,
            backgroundColor: currentColors.background.paper,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
        MuiPopover: {
          paper: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
            boxShadow: `0 4px 16px ${currentColors.shadow}`,
          },
        },
        MuiDialog: {
          paper: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
          },
        },
        MuiDialogTitle: {
          root: {
            color: currentColors.text.primary,
            fontWeight: 700,
          },
        },
        MuiDialogContent: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiChip: {
          root: {
            backgroundColor: darkMode ? '#333333' : '#e0e0e0',
            color: currentColors.text.primary,
          },
        },
        MuiTab: {
          root: {
            color: currentColors.text.secondary,
            fontWeight: 600,
            textTransform: 'none',
            '&.Mui-selected': {
              color: currentColors.primary,
            },
          },
        },
        MuiTabs: {
          indicator: {
            backgroundColor: currentColors.primary,
          },
        },
        MuiFormLabel: {
          root: {
            color: currentColors.text.secondary,
            '&.Mui-focused': {
              color: currentColors.primary,
            },
          },
        },
        MuiInputBase: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiSelect: {
          root: {
            color: currentColors.text.primary,
          },
          icon: {
            color: currentColors.text.secondary,
          },
        },
        MuiListItem: {
          root: {
            color: currentColors.text.primary,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiListItemText: {
          primary: {
            color: currentColors.text.primary,
          },
          secondary: {
            color: currentColors.text.secondary,
          },
        },
        MuiDivider: {
          root: {
            backgroundColor: currentColors.border,
          },
        },
        MuiTypography: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiSvgIcon: {
          root: {
            color: 'inherit',
          },
        },
        MuiBackdrop: {
          root: {
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
    locale
  );

  const darkTheme = createTheme(
    {
      ...baseTheme,
      overrides: {
        MuiCssBaseline: {
          '@global': {
            body: {
              backgroundColor: currentColors.background.default,
              color: currentColors.text.primary,
            },
          },
        },
        MuiAppBar: {
          root: {
            backgroundColor: `${currentColors.background.appBar} !important`,
            color: `${currentColors.text.primary} !important`,
            boxShadow: `0 2px 4px ${currentColors.shadow}`,
            '& .MuiIconButton-root': {
              color: `${currentColors.text.primary} !important`,
            },
            '& .MuiTypography-root': {
              color: `${currentColors.text.primary} !important`,
            },
          },
        },
        MuiDrawer: {
          paper: {
            backgroundColor: `${currentColors.background.drawer} !important`,
            color: `${currentColors.text.primary} !important`,
            '& .MuiListItem-root': {
              color: `${currentColors.text.primary} !important`,
              '&:hover': {
                backgroundColor: 'rgba(102, 187, 106, 0.1) !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(102, 187, 106, 0.2) !important',
              },
            },
            '& .MuiListItemIcon-root': {
              color: `${currentColors.text.primary} !important`,
            },
            '& .MuiListItemText-primary': {
              color: `${currentColors.text.primary} !important`,
            },
            '& .MuiDivider-root': {
              backgroundColor: `${currentColors.border} !important`,
            },
            '& .MuiListSubheader-root': {
              backgroundColor: 'transparent !important',
              color: `${currentColors.text.secondary} !important`,
            },
            '& .MuiIconButton-root': {
              color: `${currentColors.text.primary} !important`,
            },
          },
        },
        MuiPaper: {
          root: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
          },
          outlined: {
            border: `1px solid ${currentColors.border}`,
            boxShadow: `0 2px 8px ${currentColors.shadow}`,
            borderRadius: '12px',
          },
        },
        MuiCard: {
          root: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
            boxShadow: `0 2px 8px ${currentColors.shadow}`,
          },
        },
        MuiTableCell: {
          root: {
            color: `${currentColors.text.primary} !important`,
            borderBottom: `1px solid ${currentColors.border} !important`,
          },
          head: {
            backgroundColor: '#2a2a2a !important',
            fontWeight: 600,
          },
        },
        MuiTextField: {
          root: {
            '& .MuiInputBase-root': {
              color: currentColors.text.primary,
              backgroundColor: currentColors.background.paper,
            },
            '& .MuiInputLabel-root': {
              color: currentColors.text.secondary,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: currentColors.border,
            },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: currentColors.primary,
            },
          },
        },
        MuiButton: {
          root: {
            color: currentColors.text.primary,
            fontWeight: 600,
            textTransform: 'none',
          },
          contained: {
            boxShadow: `0 2px 4px ${currentColors.shadow}`,
            '&:hover': {
              boxShadow: `0 4px 8px ${currentColors.shadow}`,
            },
          },
        },
        MuiIconButton: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiMenuItem: {
          root: {
            color: currentColors.text.primary,
            backgroundColor: currentColors.background.paper,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
        MuiPopover: {
          paper: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
            boxShadow: `0 4px 16px ${currentColors.shadow}`,
          },
        },
        MuiDialog: {
          paper: {
            backgroundColor: currentColors.background.paper,
            color: currentColors.text.primary,
          },
        },
        MuiDialogTitle: {
          root: {
            color: currentColors.text.primary,
            fontWeight: 700,
          },
        },
        MuiDialogContent: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiChip: {
          root: {
            backgroundColor: '#333333',
            color: currentColors.text.primary,
          },
        },
        MuiTab: {
          root: {
            color: currentColors.text.secondary,
            fontWeight: 600,
            textTransform: 'none',
            '&.Mui-selected': {
              color: currentColors.primary,
            },
          },
        },
        MuiTabs: {
          indicator: {
            backgroundColor: currentColors.primary,
          },
        },
        MuiFormLabel: {
          root: {
            color: currentColors.text.secondary,
            '&.Mui-focused': {
              color: currentColors.primary,
            },
          },
        },
        MuiInputBase: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiSelect: {
          root: {
            color: currentColors.text.primary,
          },
          icon: {
            color: currentColors.text.secondary,
          },
        },
        MuiListItem: {
          root: {
            color: currentColors.text.primary,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            },
          },
        },
        MuiListItemText: {
          primary: {
            color: currentColors.text.primary,
          },
          secondary: {
            color: currentColors.text.secondary,
          },
        },
        MuiDivider: {
          root: {
            backgroundColor: currentColors.border,
          },
        },
        MuiTypography: {
          root: {
            color: currentColors.text.primary,
          },
        },
        MuiSvgIcon: {
          root: {
            color: 'inherit',
          },
        },
        MuiBackdrop: {
          root: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        },
      },
    },
    locale
  );

  const theme = darkMode ? darkTheme : lightTheme;

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