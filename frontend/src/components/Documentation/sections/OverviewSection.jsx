import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme
} from '@material-ui/core';
import {
  CheckCircle as CheckIcon,
  Code as CodeIcon,
  Storage as DatabaseIcon,
  Cloud as CloudIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import CodeBlock from '../components/CodeBlock';
import { useCustomTheme } from '../../../context/Theme/ThemeContext';

const useStyles = makeStyles((theme) => ({
  section: {
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary
  },
  title: {
    color: theme.palette.primary.main,
    fontWeight: 700,
    marginBottom: theme.spacing(2)
  },
  subtitle: {
    color: theme.palette.text.primary,
    fontWeight: 600,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  card: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    height: '100%'
  },
  cardContent: {
    color: theme.palette.text.primary
  },
  cardTitle: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  techChip: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(0.5),
    fontWeight: 600
  },
  listItem: {
    paddingLeft: 0
  },
  listIcon: {
    color: '#4caf50',
    minWidth: 36
  },
  codeContainer: {
    backgroundColor: theme.palette.type === 'dark' ? '#0d1117' : '#f8f9fa',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  highlight: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  }
}));

const OverviewSection = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();

  const techStack = [
    'Node.js + TypeScript',
    'Express.js',
    'Sequelize ORM',
    'PostgreSQL',
    'Socket.IO',
    'Bull + Redis',
    '@whiskeysockets/baileys'
  ];

  const features = [
    'Sistema Multi-Tenant',
    'Integração WhatsApp',
    'Sistema de Tickets',
    'Chatbot Inteligente',
    'Campanhas de Marketing',
    'Agente de IA (PEPE)',
    'Embeddings Vetoriais',
    'API REST Completa'
  ];

  const folderStructure = `backend/
├── src/
│   ├── controllers/     # Controladores das rotas
│   ├── models/         # Modelos Sequelize
│   ├── services/       # Lógica de negócio
│   ├── routes/         # Definição das rotas
│   ├── middleware/     # Middlewares customizados
│   ├── database/       # Migrations e seeders
│   ├── libs/          # Bibliotecas customizadas
│   ├── helpers/       # Funções auxiliares
│   └── utils/         # Utilitários
├── uploads/           # Arquivos enviados
└── public/           # Arquivos estáticos`;

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        Visão Geral
      </Typography>
      
      <Typography variant="body1" paragraph>
        Sistema de atendimento multi-tenant com integração WhatsApp e Agente de IA, 
        desenvolvido em Node.js/TypeScript com arquitetura moderna e escalável.
      </Typography>

      <div className={classes.highlight}>
        <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
          🤖 Novidade: Agente PEPE
        </Typography>
        <Typography variant="body2">
          Sistema integrado de IA com embeddings vetoriais, busca por similaridade e 
          processamento de linguagem natural usando DeepSeek API (100% gratuito).
        </Typography>
      </div>

      <Typography variant="h5" className={classes.subtitle}>
        Stack Principal
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                <CodeIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Tecnologias Core
              </Typography>
              <Box>
                {techStack.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    className={classes.techChip}
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                <SpeedIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Funcionalidades
              </Typography>
              <List dense>
                {features.slice(0, 4).map((feature, index) => (
                  <ListItem key={index} className={classes.listItem}>
                    <ListItemIcon className={classes.listIcon}>
                      <CheckIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        Estrutura de Pastas
      </Typography>
      
      <CodeBlock code={folderStructure} language="bash" />

      <Typography variant="h5" className={classes.subtitle}>
        Arquitetura em Camadas
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                1. API Layer
              </Typography>
              <Typography variant="body2">
                <code>src/routes/</code> e <code>src/controllers/</code>
              </Typography>
              <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
                Receber requisições HTTP e retornar respostas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                2. Service Layer
              </Typography>
              <Typography variant="body2">
                <code>src/services/</code>
              </Typography>
              <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
                Regras de negócio e orquestração
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                3. Data Layer
              </Typography>
              <Typography variant="body2">
                <code>src/models/</code> e <code>src/database/</code>
              </Typography>
              <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
                Estrutura de dados e banco
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                4. Integration Layer
              </Typography>
              <Typography variant="body2">
                <code>src/libs/</code>
              </Typography>
              <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
                WhatsApp, Socket.IO, Filas, IA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        Integrações Principais
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <List>
            <ListItem className={classes.listItem}>
              <ListItemIcon className={classes.listIcon}>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText 
                primary="WhatsApp Integration"
                secondary="src/libs/wbot.ts - @whiskeysockets/baileys"
              />
            </ListItem>
            <ListItem className={classes.listItem}>
              <ListItemIcon className={classes.listIcon}>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Real-time Communication"
                secondary="src/libs/socket.ts - Socket.IO"
              />
            </ListItem>
          </List>
        </Grid>
        <Grid item xs={12} md={6}>
          <List>
            <ListItem className={classes.listItem}>
              <ListItemIcon className={classes.listIcon}>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Queue System"
                secondary="src/libs/Queue.ts - Bull + Redis"
              />
            </ListItem>
            <ListItem className={classes.listItem}>
              <ListItemIcon className={classes.listIcon}>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText 
                primary="AI Agent PEPE"
                secondary="src/services/AIServices/ - DeepSeek + Embeddings"
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>
    </div>
  );
};

export default OverviewSection;