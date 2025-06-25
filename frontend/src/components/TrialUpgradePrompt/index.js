import React, { useContext } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  makeStyles,
  Grid,
} from '@material-ui/core';
import {
  TrendingUp as UpgradeIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
} from '@material-ui/icons';
import moment from 'moment';
import useCompanyStatus from '../../hooks/useCompanyStatus';
import { AuthContext } from '../../context/Auth/AuthContext';

const useStyles = makeStyles((theme) => ({
  upgradeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.spacing(3),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      pointerEvents: 'none',
    },
  },
  urgentCard: {
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    animation: '$urgentPulse 2s infinite',
  },
  warningCard: {
    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontWeight: 700,
    fontSize: '1.3rem',
  },
  statusChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    fontWeight: 600,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  urgentChip: {
    backgroundColor: '#fff',
    color: '#e74c3c',
    fontWeight: 700,
    animation: '$chipBlink 1s infinite',
  },
  content: {
    marginBottom: theme.spacing(3),
  },
  timeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  benefits: {
    marginBottom: theme.spacing(2),
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    fontSize: '0.95rem',
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#fff',
    color: '#667eea',
    fontWeight: 600,
    borderRadius: '8px',
    padding: theme.spacing(1.5, 3),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      transform: 'translateY(-1px)',
    },
    transition: 'all 0.2s ease',
  },
  urgentButton: {
    backgroundColor: '#fff',
    color: '#e74c3c',
    fontWeight: 700,
    animation: '$buttonPulse 1.5s infinite',
  },
  secondaryButton: {
    border: '2px solid rgba(255, 255, 255, 0.5)',
    color: '#fff',
    fontWeight: 600,
    borderRadius: '8px',
    padding: theme.spacing(1.5, 3),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: '#fff',
    },
    transition: 'all 0.2s ease',
  },
  '@keyframes urgentPulse': {
    '0%': {
      boxShadow: '0 8px 32px rgba(231, 76, 60, 0.3)',
    },
    '50%': {
      boxShadow: '0 12px 40px rgba(231, 76, 60, 0.5)',
    },
    '100%': {
      boxShadow: '0 8px 32px rgba(231, 76, 60, 0.3)',
    },
  },
  '@keyframes chipBlink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.7 },
    '100%': { opacity: 1 },
  },
  '@keyframes buttonPulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' },
  },
}));

const TrialUpgradePrompt = () => {
  const classes = useStyles();
  const { companyStatus } = useCompanyStatus();
  const { user } = useContext(AuthContext);

  // Não mostrar avisos de vencimento para usuários de nível "user"
  if (user?.profile === 'user') {
    return null;
  }

  if (!companyStatus.isInTrial) {
    return null;
  }

  const daysRemaining = companyStatus.daysRemaining;
  const expirationDate = moment().add(daysRemaining, 'days').format('DD/MM/YYYY');

  const getCardClass = () => {
    if (daysRemaining <= 1) return classes.urgentCard;
    if (daysRemaining <= 3) return classes.warningCard;
    return '';
  };

  const getStatusChipClass = () => {
    if (daysRemaining <= 1) return classes.urgentChip;
    return classes.statusChip;
  };

  const getStatusText = () => {
    if (daysRemaining <= 1) return 'URGENTE';
    if (daysRemaining <= 3) return 'ATENÇÃO';
    return 'ATIVO';
  };

  const getMainMessage = () => {
    if (daysRemaining <= 1) {
      return 'Seu período de avaliação expira hoje!';
    } else if (daysRemaining <= 3) {
      return `Restam apenas ${daysRemaining} dias do seu período de avaliação.`;
    } else {
      return `Você está no período de avaliação com ${daysRemaining} dias restantes.`;
    }
  };

  const getUrgencyMessage = () => {
    if (daysRemaining <= 1) {
      return 'Ative sua conta agora para não perder o acesso a todas as funcionalidades!';
    } else if (daysRemaining <= 3) {
      return 'Considere ativar sua conta para garantir continuidade no atendimento.';
    } else {
      return 'Aproveite para conhecer todos os recursos e escolher o melhor plano.';
    }
  };

  return (
    <Card className={`${classes.upgradeCard} ${getCardClass()}`}>
      <CardContent>
        <div className={classes.header}>
          <div className={classes.title}>
            <StarIcon />
            <Typography variant="h6" component="div">
              Período de Avaliação
            </Typography>
          </div>
          <Chip
            label={getStatusText()}
            className={getStatusChipClass()}
            size="small"
          />
        </div>

        <div className={classes.content}>
          <div className={classes.timeInfo}>
            <ScheduleIcon />
            <span>Expira em: {expirationDate}</span>
          </div>

          <Typography variant="h6" gutterBottom>
            {getMainMessage()}
          </Typography>

          <Typography variant="body1" style={{ marginBottom: '16px', opacity: 0.9 }}>
            {getUrgencyMessage()}
          </Typography>

          <div className={classes.benefits}>
            <Typography variant="subtitle2" gutterBottom style={{ fontWeight: 600 }}>
              O que você tem acesso durante a avaliação:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <div className={classes.benefitItem}>
                  <CheckCircleIcon fontSize="small" />
                  <span>Atendimento ilimitado</span>
                </div>
                <div className={classes.benefitItem}>
                  <CheckCircleIcon fontSize="small" />
                  <span>Múltiplas conexões WhatsApp</span>
                </div>
                <div className={classes.benefitItem}>
                  <CheckCircleIcon fontSize="small" />
                  <span>Campanhas de marketing</span>
                </div>
              </Grid>
              <Grid item xs={12} sm={6}>
                <div className={classes.benefitItem}>
                  <CheckCircleIcon fontSize="small" />
                  <span>Relatórios completos</span>
                </div>
                <div className={classes.benefitItem}>
                  <CheckCircleIcon fontSize="small" />
                  <span>Suporte técnico</span>
                </div>
                <div className={classes.benefitItem}>
                  <CheckCircleIcon fontSize="small" />
                  <span>Todas as integrações</span>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        <div className={classes.actionButtons}>
          <Button
            variant="contained"
            className={`${classes.primaryButton} ${daysRemaining <= 1 ? classes.urgentButton : ''}`}
            startIcon={<UpgradeIcon />}
            size="large"
          >
            {daysRemaining <= 1 ? 'ATIVAR AGORA' : 'Escolher Plano'}
          </Button>
          
          {daysRemaining > 1 && (
            <Button
              variant="outlined"
              className={classes.secondaryButton}
              size="large"
            >
              Continuar Testando
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialUpgradePrompt;