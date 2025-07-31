import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";

import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@material-ui/core";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import MenuIcon from "@material-ui/icons/Menu";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import { useCustomTheme } from "../context/Theme/ThemeContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import logo from "../assets/logo.png"; 
import { socketManager } from "../services/socketManager";
import { tokenManager } from "../utils/tokenManager";
// moment removido - não utilizado
import TrialNotifications from "../components/TrialNotifications";

const drawerWidth = 300;
const drawerCollapsedWidth = 100;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
    [theme.breakpoints.between("sm", "md")]: {
      height: "100vh",
    },
  },

  toolbar: {
    paddingRight: 24,
    paddingLeft: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    [theme.breakpoints.between("sm", "md")]: {
      paddingRight: 16,
      paddingLeft: 12,
    },
    [theme.breakpoints.down("sm")]: {
      paddingRight: 8,
      paddingLeft: 8,
    },
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: theme.palette.background.paper + " !important",
    color: theme.palette.text.primary + " !important",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background-color 0.3s ease, color 0.3s ease",
    "& .MuiIconButton-root": {
      color: theme.palette.text.primary + " !important",
    },
    "& .MuiTypography-root": {
      color: theme.palette.text.primary + " !important",
    },
  },
  menuButton: {
    marginRight: 16,
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
    [theme.breakpoints.down("md")]: {
      display: "block",
    },
  },
  title: {
    flexGrow: 1,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 500,
  },
  userNameTag: {
    backgroundColor: theme.palette.type === 'dark' ? '#333333' : '#eeeeee',
    color: theme.palette.type === 'dark' ? '#66bb6a' : '#4caf50',
    padding: '1px 15px',
    borderRadius: '50px',
    display: 'inline-block',
    fontWeight: 'normal',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  profileAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    cursor: 'pointer',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: drawerCollapsedWidth,
  },
  drawerCollapsed: {
    width: drawerCollapsedWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    backgroundColor: "#44b774 !important",
    borderRadius: "0 !important",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08) !important",
    border: "none !important",
    margin: "0",
    height: "calc(100vh - 50px)",
    marginTop: "50px",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    "& .MuiListItem-root": {
      color: "#fff !important",
      margin: "4px 16px",
      borderRadius: "25px !important",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.1) !important",
      },
      "&.Mui-selected": {
        backgroundColor: "rgba(255,255,255,0.2) !important",
      },
    },
    "& .MuiListItemIcon-root": {
      color: "#fff !important",
      minWidth: "40px",
    },
    "& .MuiListItemText-primary": {
      color: "#fff !important",
    },
    "& .MuiDivider-root": {
      backgroundColor: "rgba(255,255,255,0.2) !important",
      margin: "8px 16px",
    },
    "& .MuiListSubheader-root": {
      backgroundColor: "transparent !important",
      color: "#fff !important",
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      opacity: 0.8,
    },
    "& .MuiIconButton-root": {
      color: "#fff !important",
    },
  },
  drawerPaperClose: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerCollapsedWidth,
    backgroundColor: "#44b774 !important",
    borderRadius: "30px !important",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08) !important",
    border: "none !important",
    margin: "16px",
    height: "calc(100vh - 96px)",
    marginTop: "70px",
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    "& .MuiListItem-root": {
      color: "#fff !important",
      margin: "4px 0",
      borderRadius: "25px !important",
      display: "flex !important",
      justifyContent: "center !important",
      alignItems: "center !important",
      minHeight: "48px",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.1) !important",
      },
      "&.Mui-selected": {
        backgroundColor: "rgba(255,255,255,0.2) !important",
      },
    },
    "& .MuiListItemIcon-root": {
      color: "#fff !important",
      minWidth: "auto !important",
      margin: "0 !important",
      justifyContent: "center",
      alignItems: "center",
      display: "flex",
    },
    "& .MuiDivider-root": {
      backgroundColor: "rgba(255,255,255,0.2) !important",
      margin: "8px 16px",
    },
    "& .MuiIconButton-root": {
      color: "#fff !important",
    },
  },
  drawerPaperCollapsed: {
    position: "relative",
    whiteSpace: "nowrap",
    width: 72,
    backgroundColor: "#44b774 !important",
    borderRadius: "0 !important",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08) !important",
    border: "none !important",
    margin: "0",
    height: "calc(100vh - 64px)",
    marginTop: "50px",
    overflowX: "hidden",
    overflowY: "auto",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    "& .MuiListItem-root": {
      color: "#fff !important",
      margin: "4px 0",
      borderRadius: "25px !important",
      display: "flex !important",
      justifyContent: "center !important",
      alignItems: "center !important",
      minHeight: "48px",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.1) !important",
      },
      "&.Mui-selected": {
        backgroundColor: "rgba(255,255,255,0.2) !important",
      },
    },
    "& .MuiListItemIcon-root": {
      color: "#fff !important",
      minWidth: "auto !important",
      margin: "0 !important",
      justifyContent: "center",
      alignItems: "center",
      display: "flex",
    },
    "& .MuiDivider-root": {
      backgroundColor: "rgba(255,255,255,0.2) !important",
      margin: "8px 16px",
    },
    "& .MuiIconButton-root": {
      color: "#fff !important",
    },
  },
  appBarSpacer: {
    minHeight: "48px",
  },
  content: {
    flexGrow: 1,
    padding: 0,
    overflow: "auto",
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    transition: 'background-color 0.3s ease, color 0.3s ease',
    ...theme.scrollbarStyles,
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "hidden",
    // Esconder scrollbar completamente
    "&::-webkit-scrollbar": {
      display: "none",
    },
    "&::-webkit-scrollbar-track": {
      display: "none",
    },
    "&::-webkit-scrollbar-thumb": {
      display: "none",
    },
    // Para Firefox
    scrollbarWidth: "none",
    // Para IE e Edge
    msOverflowStyle: "none",
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
    minHeight: "48px !important",
  },
  expandButton: {
    color: "#fff !important",
    margin: "8px",
  },
}));

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user } = useContext(AuthContext);
  const { drawerCollapsed, toggleDrawerCollapse, darkMode, toggleDarkMode } = useCustomTheme();

  const theme = useTheme();
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
      setDrawerVariant("temporary");
    } else if (isTablet) {
      setDrawerOpen(false);
      setDrawerVariant("temporary");
    } else {
      setDrawerOpen(true);
      setDrawerVariant("permanent");
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        // Mobile
        setDrawerOpen(false);
        setDrawerVariant("temporary");
      } else if (width >= 600 && width < 960) {
        // Tablet
        setDrawerOpen(false);
        setDrawerVariant("temporary");
      } else {
        // Desktop
        setDrawerOpen(true);
        setDrawerVariant("permanent");
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executar na inicialização

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Get companyId and userId from tokenManager first, fallback to localStorage
    const companyId = tokenManager.getCompanyId() || localStorage.getItem("companyId");
    const userId = tokenManager.getUserId() || localStorage.getItem("userId");

    if (!companyId || !userId || companyId === "null" || userId === "null" || companyId === "undefined" || userId === "undefined") {
      console.warn("Layout: Missing companyId or userId", { companyId, userId });
      return;
    }

    // Conectar usando o socketManager (singleton)
    const connectSocket = async () => {
      try {
        await socketManager.connect(companyId);
        
        // Configurar listener para auth
        socketManager.on(`company-${companyId}-auth`, (data) => {
          if (data.user.id === +userId) {
            toastError("Sua conta foi acessada em outro computador.");
            setTimeout(() => {
              tokenManager.clearAll();
              localStorage.clear();
              window.location.reload();
            }, 1000);
          }
        });

        // Emitir status do usuário
        socketManager.emit("userStatus");
        
      } catch (error) {
        console.error("Layout: Failed to connect socket", error);
      }
    };

    connectSocket();

    // Intervalo para manter status do usuário ativo
    const interval = setInterval(() => {
      if (socketManager.isConnected()) {
        socketManager.emit("userStatus");
      }
    }, 1000 * 60 * 5);

    return () => {
      // Remover apenas o listener específico, não desconectar o socket
      socketManager.off(`company-${companyId}-auth`);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]); // Add user.id as dependency to re-run when user changes

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (window.innerWidth < 960) {
      setDrawerOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 4 && hour < 12) {
      return "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  
  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      {/* Componente de Notificações do Trial */}
      <TrialNotifications />
      
      <AppBar
        position="fixed"
        className={classes.appBar}
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          
          <div className={classes.logoContainer}>
            <img 
              src={logo} 
              style={{ 
                height: '50px', 
                width: '50px',
              }} 
              alt="logo"
            />
          </div>
          
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            {greaterThenSm ? (
              <>
                {getGreeting()}, <span className={classes.userNameTag}>{user.name}</span>!
              </>
            ) : (
              <span className={classes.userNameTag}>{user.name}</span>
            )}
          </Typography>

          <div className={classes.rightSection}>
            {user.id && <NotificationsPopOver />}
            
            <IconButton
              color="inherit"
              onClick={toggleDarkMode}
              aria-label="toggle dark mode"
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            
            {user.profileImage ? (
              <Avatar
                className={classes.profileAvatar}
                src={user.profileImage}
                onClick={handleMenu}
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
              />
            ) : (
              <Avatar
                className={classes.profileAvatar}
                onClick={handleMenu}
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
              >
                {user.name && getInitials(user.name)}
              </Avatar>
            )}
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={drawerVariant}
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: !drawerCollapsed,
          [classes.drawerClose]: drawerCollapsed,
        })}
        classes={{
          paper: clsx({
            [classes.drawerPaper]: !drawerCollapsed,
            [classes.drawerPaperCollapsed]: drawerCollapsed,
          }),
        }}
        PaperProps={{
          style: {
            height: "calc(100vh - 50px)",
            marginTop: "50px",
          }
        }}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton 
            onClick={toggleDrawerCollapse}
            className={classes.expandButton}
          >
            {drawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </div>
        <Divider />
        <List className={classes.containerWithScroll}>
          <MainListItems drawerClose={drawerClose} drawerCollapsed={drawerCollapsed} />
        </List>
      </Drawer>
      
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      
      <main className={classes.content} style={{ 
        paddingTop: '48px' 
      }}>
        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;