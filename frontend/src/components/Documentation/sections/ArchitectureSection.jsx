import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@material-ui/core';
import {
  Architecture as ArchitectureIcon,
  Layers as LayersIcon,
  CheckCircle as CheckIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import CodeBlock from '../components/CodeBlock';

const useStyles = makeStyles((theme) => ({
  section: {
    padding: theme.spacing(3),
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0'
  },
  title: {
    color: '#4a90e2',
    fontWeight: 700,
    marginBottom: theme.spacing(2)
  },
  subtitle: {
    color: '#ffffff',
    fontWeight: 600,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  card: {
    backgroundColor: '#2d2d2d',
    border: '1px solid #404040',
    borderRadius: theme.spacing(1),
    height: '100%'
  },
  cardContent: {
    color: '#e0e0e0'
  },
  cardTitle: {
    color: '#4a90e2',
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  }
}));

const ArchitectureSection = () => {
  const classes = useStyles();

  const integrations = [
    'WhatsApp: src/libs/wbot.ts',
    'Socket.IO: src/libs/socket.ts',
    'Filas: src/libs/Queue.ts',
    'Database: src/database/',
    'AI Services: src/services/AIServices/'
  ];

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        <ArchitectureIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
        Arquitetura
      </Typography>

      <Typography variant="h5" className={classes.subtitle}>
        Camadas da Aplicação
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                1. API Layer
              </Typography>
              <Typography variant="body2" style={{ marginBottom: 8 }}>
                <code>src/routes/</code> e <code>src/controllers/</code>
              </Typography>
              <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                Receber requisições HTTP, validar dados de entrada e retornar respostas.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                2. Service Layer
              </Typography>
              <Typography variant="body2" style={{ marginBottom: 8 }}>
                <code>src/services/</code>
              </Typography>
              <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                Implementar regras de negócio, orquestrar operações complexas.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                3. Data Layer
              </Typography>
              <Typography variant="body2" style={{ marginBottom: 8 }}>
                <code>src/models/</code> e <code>src/database/</code>
              </Typography>
              <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                Definir estrutura de dados e interagir com o banco.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                4. Integration Layer
              </Typography>
              <Typography variant="body2" style={{ marginBottom: 8 }}>
                <code>src/libs/</code>
              </Typography>
              <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                WhatsApp, Socket.IO, Filas, IA e outras integrações.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        Integrações Principais
      </Typography>

      <List>
        {integrations.map((integration, index) => (
          <ListItem key={index}>
            <ListItemIcon style={{ color: '#4caf50' }}>
              <CheckIcon />
            </ListItemIcon>
            <ListItemText primary={integration} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default ArchitectureSection;