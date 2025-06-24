import React from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText
} from '@material-ui/core';
import {
  Api as ApiIcon
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

const ApiSection = () => {
  const classes = useStyles();

  const apiGroups = [
    {
      title: 'Autenticação',
      path: 'src/routes/authRoutes.ts',
      endpoints: [
        'POST /auth/login',
        'POST /auth/refresh',
        'POST /auth/logout'
      ]
    },
    {
      title: 'Tickets',
      path: 'src/routes/ticketRoutes.ts',
      endpoints: [
        'GET /tickets',
        'POST /tickets',
        'PUT /tickets/:id',
        'DELETE /tickets/:id'
      ]
    },
    {
      title: 'WhatsApp',
      path: 'src/routes/whatsappRoutes.ts',
      endpoints: [
        'GET /whatsapp',
        'POST /whatsapp',
        'PUT /whatsapp/:id',
        'POST /whatsapp/:id/start'
      ]
    },
    {
      title: 'Mensagens',
      path: 'src/routes/messageRoutes.ts',
      endpoints: [
        'GET /messages',
        'POST /messages',
        'PUT /messages/:id'
      ]
    }
  ];

  const authExample = `{
  "email": "user@example.com",
  "password": "password123"
}`;

  const ticketExample = `{
  "contactId": 1,
  "status": "open",
  "userId": 1,
  "queueId": 1
}`;

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        <ApiIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
        APIs e Endpoints
      </Typography>

      <Typography variant="body1" paragraph>
        Base URL: <code>http://localhost:8080</code> (desenvolvimento)
      </Typography>
      
      <Typography variant="body2" paragraph style={{ color: '#b0b0b0' }}>
        Todas as rotas (exceto autenticação) requerem header de autorização:
        <code style={{ marginLeft: 8 }}>Authorization: Bearer &lt;jwt_token&gt;</code>
      </Typography>

      <Typography variant="h5" className={classes.subtitle}>
        Principais Rotas
      </Typography>

      <Grid container spacing={3}>
        {apiGroups.map((group, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Typography variant="h6" className={classes.cardTitle}>
                  {group.title}
                </Typography>
                <Typography variant="caption" style={{ color: '#b0b0b0', marginBottom: 16, display: 'block' }}>
                  <code>{group.path}</code>
                </Typography>
                <List dense>
                  {group.endpoints.map((endpoint, endpointIndex) => (
                    <ListItem key={endpointIndex} style={{ paddingLeft: 0 }}>
                      <ListItemText 
                        primary={endpoint}
                        primaryTypographyProps={{ 
                          style: { fontFamily: 'monospace', fontSize: '0.875rem' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        Exemplos de Uso
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" style={{ color: '#4a90e2', marginBottom: 16 }}>
            POST /auth/login
          </Typography>
          <CodeBlock code={authExample} language="json" title="Request Body" />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" style={{ color: '#4a90e2', marginBottom: 16 }}>
            POST /tickets
          </Typography>
          <CodeBlock code={ticketExample} language="json" title="Request Body" />
        </Grid>
      </Grid>
    </div>
  );
};

export default ApiSection;