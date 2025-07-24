import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent
} from '@material-ui/core';
import {
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Message as MessageIcon,
  SmartToy as RobotIcon,
  Campaign as CampaignIcon,
  WhatsApp as WhatsAppIcon
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

const FeaturesSection = () => {
  const classes = useStyles();

  const features = [
    {
      icon: <BusinessIcon />,
      title: 'Sistema Multi-Tenant',
      description: 'Isolamento por empresa, planos de assinatura, limites configuráveis',
      path: 'src/models/Company.ts, src/middleware/CheckAuth.ts'
    },
    {
      icon: <WhatsAppIcon />,
      title: 'WhatsApp Integration',
      description: 'Múltiplas conexões, gerenciamento de sessões, envio de mídia',
      path: 'src/services/WbotServices/, src/libs/wbot.ts'
    },
    {
      icon: <MessageIcon />,
      title: 'Sistema de Tickets',
      description: 'Criação automática, estados (pendente/aberto/fechado), atribuição de atendentes',
      path: 'src/services/TicketServices/, src/models/Ticket.ts'
    },
    {
      icon: <RobotIcon />,
      title: 'Agente de IA (PEPE)',
      description: 'IA com embeddings vetoriais, busca por similaridade, DeepSeek API',
      path: 'src/services/AIServices/'
    },
    {
      icon: <SettingsIcon />,
      title: 'Chatbot',
      description: 'Opções automáticas, fluxo de conversação, integração com tickets',
      path: 'src/services/WbotServices/wbotMessageListener.ts'
    },
    {
      icon: <CampaignIcon />,
      title: 'Campanhas',
      description: 'Envio em massa, agendamento, processamento em filas',
      path: 'src/services/CampaignServices/, src/jobs/'
    }
  ];

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        <SettingsIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
        Funcionalidades
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box mr={2} style={{ color: '#4a90e2' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" className={classes.cardTitle}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph>
                  {feature.description}
                </Typography>
                <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                  <strong>Onde alterar:</strong> <code>{feature.path}</code>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default FeaturesSection;