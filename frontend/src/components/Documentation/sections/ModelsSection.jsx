import React from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent
} from '@material-ui/core';
import {
  Storage as StorageIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

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

const ModelsSection = () => {
  const classes = useStyles();

  const models = [
    { name: 'Company', description: 'Empresas do sistema', path: 'src/models/Company.ts' },
    { name: 'User', description: 'Usuários/atendentes', path: 'src/models/User.ts' },
    { name: 'Contact', description: 'Contatos/clientes', path: 'src/models/Contact.ts' },
    { name: 'Ticket', description: 'Tickets de atendimento', path: 'src/models/Ticket.ts' },
    { name: 'Message', description: 'Mensagens trocadas', path: 'src/models/Message.ts' },
    { name: 'Whatsapp', description: 'Conexões WhatsApp', path: 'src/models/Whatsapp.ts' },
    { name: 'Queue', description: 'Filas de atendimento', path: 'src/models/Queue.ts' },
    { name: 'Campaign', description: 'Campanhas de marketing', path: 'src/models/Campaign.ts' }
  ];

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        <StorageIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
        Modelos de Dados
      </Typography>

      <Grid container spacing={3}>
        {models.map((model, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Typography variant="h6" className={classes.cardTitle}>
                  {model.name}
                </Typography>
                <Typography variant="body2" paragraph>
                  {model.description}
                </Typography>
                <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                  <code>{model.path}</code>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ModelsSection;