import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Divider
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Architecture as ArchitectureIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  SmartToy as RobotIcon,
  School as TrainingIcon,
  AccountTree as FlowchartIcon,
  ExpandLess,
  ExpandMore,
  Code as CodeIcon,
  Description as DocsIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { useCustomTheme } from '../../context/Theme/ThemeContext';

import OverviewSection from './sections/OverviewSection';
import ArchitectureSection from './sections/ArchitectureSection';
import FeaturesSection from './sections/FeaturesSection';
import ModelsSection from './sections/ModelsSection';
import ApiSection from './sections/ApiSection';
import AIAgentSection from './sections/AIAgentSection';
import TrainingSection from './sections/TrainingSection';
import FlowchartSection from './sections/FlowchartSection';
import ConfigSection from './sections/ConfigSection';

const drawerWidth = 280;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  drawer: {
    [theme.breakpoints.up('md')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    [theme.breakpoints.up('md')]: {
      marginLeft: 0,
    },
  },
  sidebarHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.type === 'dark' 
      ? 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)'
      : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'
  },
  sidebarTitle: {
    fontWeight: 700,
    color: theme.palette.primary.main,
    fontSize: '1.2rem'
  },
  sidebarSubtitle: {
    color: theme.palette.text.secondary,
    fontSize: '0.85rem'
  },
  listItem: {
    borderRadius: theme.spacing(1),
    margin: theme.spacing(0.5, 1),
    '&:hover': {
      backgroundColor: theme.palette.type === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)',
    },
    '&.active': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.contrastText,
      }
    }
  },
  listItemIcon: {
    color: theme.palette.primary.main,
    minWidth: 40
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  section: {
    marginBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`
  },
  versionChip: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600
  }
}));

const menuItems = [
  {
    id: 'overview',
    title: 'Visão Geral',
    icon: HomeIcon,
    component: OverviewSection
  },
  {
    id: 'architecture',
    title: 'Arquitetura',
    icon: ArchitectureIcon,
    component: ArchitectureSection
  },
  {
    id: 'features',
    title: 'Funcionalidades',
    icon: SettingsIcon,
    component: FeaturesSection
  },
  {
    id: 'models',
    title: 'Modelos',
    icon: StorageIcon,
    component: ModelsSection
  },
  {
    id: 'apis',
    title: 'APIs',
    icon: ApiIcon,
    component: ApiSection
  },
  {
    id: 'ai-agent',
    title: 'Agente de IA',
    icon: RobotIcon,
    component: AIAgentSection,
    subItems: [
      { id: 'ai-overview', title: 'Visão Geral' },
      { id: 'ai-pepe', title: 'Agente PEPE' },
      { id: 'ai-plans', title: 'Integração com Planos' },
      { id: 'ai-interface', title: 'Interface' },
      { id: 'ai-technical', title: 'Especificações Técnicas' }
    ]
  },
  {
    id: 'training',
    title: 'Treinamento',
    icon: TrainingIcon,
    component: TrainingSection
  },
  {
    id: 'flowchart',
    title: 'Fluxograma',
    icon: FlowchartIcon,
    component: FlowchartSection
  },
  {
    id: 'config',
    title: 'Configuração',
    icon: CodeIcon,
    component: ConfigSection
  }
];

const Documentation = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedItems, setExpandedItems] = useState({});

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleExpandClick = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const renderMenuItem = (item) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.id];
    const isActive = activeSection === item.id;

    return (
      <React.Fragment key={item.id}>
        <ListItem
          button
          className={`${classes.listItem} ${isActive ? 'active' : ''}`}
          onClick={() => {
            if (hasSubItems) {
              handleExpandClick(item.id);
            } else {
              handleSectionChange(item.id);
            }
          }}
        >
          <ListItemIcon className={classes.listItemIcon}>
            <item.icon />
          </ListItemIcon>
          <ListItemText primary={item.title} />
          {hasSubItems && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        
        {hasSubItems && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map((subItem) => (
                <ListItem
                  key={subItem.id}
                  button
                  className={`${classes.listItem} ${classes.nested} ${activeSection === subItem.id ? 'active' : ''}`}
                  onClick={() => handleSectionChange(subItem.id)}
                >
                  <ListItemText primary={subItem.title} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <div>
      <div className={classes.sidebarHeader}>
        <Typography variant="h6" className={classes.sidebarTitle}>
          Smart Atendimento
        </Typography>
        <Typography variant="body2" className={classes.sidebarSubtitle}>
          Backend Documentation
        </Typography>
        <Box mt={1}>
          <Chip 
            label="v2.0" 
            size="small" 
            className={classes.versionChip}
          />
        </Box>
      </div>
      
      <List>
        {menuItems.map(renderMenuItem)}
      </List>
      
      <Divider style={{ backgroundColor: theme.palette.divider, margin: '16px 0' }} />
      
      <Box p={2}>
        <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
          Documentação técnica completa do sistema Smart Atendimento com integração de IA.
        </Typography>
      </Box>
    </div>
  );

  const ActiveComponent = menuItems.find(item => 
    item.id === activeSection || 
    (item.subItems && item.subItems.some(sub => sub.id === activeSection))
  )?.component || OverviewSection;

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Smart Atendimento - Documentação Backend
          </Typography>
        </Toolbar>
      </AppBar>

      <nav className={classes.drawer}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true,
          }}
        >
          {drawer}
        </Drawer>
      </nav>

      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Container maxWidth="lg">
          <Paper className={classes.section}>
            <ActiveComponent activeSubSection={activeSection} />
          </Paper>
        </Container>
      </main>
    </div>
  );
};

export default Documentation;