import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  makeStyles,
} from '@material-ui/core';
import {
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
} from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import useCompanyStatus from '../../hooks/useCompanyStatus';

const useStyles = makeStyles((theme) => ({
  trialCard: {
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
  trialHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  trialTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontWeight: 700,
    backgroundColor: '#fff',
    color: '#667eea',
    padding: theme.spacing(0.3, 1.5),
    borderRadius: '38px',
    fontSize: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  trialChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    fontWeight: 600,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    marginBottom: theme.spacing(2),
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#fff',
      borderRadius: 4,
    },
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
    fontSize: '0.9rem',
    opacity: 0.9,
  },
  trialInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.95rem',
  },
  actionButton: {
    backgroundColor: '#fff',
    color: '#667eea',
    fontWeight: 600,
    borderRadius: '8px',
    padding: theme.spacing(1, 3),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      transform: 'translateY(-1px)',
    },
    transition: 'all 0.2s ease',
  },
  warningCard: {
    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
    '& $trialTitle': {
      color: '#ff6b35',
    },
  },
  criticalCard: {
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    '& $trialTitle': {
      color: '#e74c3c',
    },
  },
}));

const TrialStatusCard = () => {
  const classes = useStyles();
  const history = useHistory();
  const { companyStatus } = useCompanyStatus();

  if (!companyStatus.isInTrial) {
    return null;
  }

  const daysRemaining = companyStatus.daysRemaining;
  const totalTrialDays = 7; // Assumindo 7 dias de trial
  const daysUsed = totalTrialDays - daysRemaining;
  const progressPercentage = (daysUsed / totalTrialDays) * 100;

  const getCardClass = () => {
    if (daysRemaining <= 1) return classes.criticalCard;
    if (daysRemaining <= 3) return classes.warningCard;
    return '';
  };

  const getStatusIcon = () => {
    if (daysRemaining <= 1) return <WarningIcon />;
    if (daysRemaining <= 3) return <ScheduleIcon />;
    return <CheckCircleIcon />;
  };

  const getStatusText = () => {
    if (daysRemaining <= 1) return 'CRÍTICO';
    if (daysRemaining <= 3) return 'ATENÇÃO';
    return 'ATIVO';
  };

  const handleActivateAccount = () => {
    history.push('/financeiro');
  };

  return (
    <Card className={`${classes.trialCard} ${getCardClass()}`}>
      <CardContent>
        <div className={classes.trialHeader}>
          <div className={classes.trialTitle}>
            <Typography component="div">
              Período de Avaliação
            </Typography>
          </div>
          <Chip
            label={getStatusText()}
            className={classes.trialChip}
            size="small"
          />
        </div>

        <div className={classes.progressContainer}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            className={classes.progressBar}
          />
          <div className={classes.progressText}>
            <span>Dia {daysUsed} de {totalTrialDays}</span>
            <span>{daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}</span>
          </div>
        </div>

        <div className={classes.trialInfo}>
          <div className={classes.infoRow}>
            <ScheduleIcon fontSize="small" />
            <span>
              Expira em: {moment().add(daysRemaining, 'days').format('DD/MM/YYYY')}
            </span>
          </div>
          <div className={classes.infoRow}>
            <CheckCircleIcon fontSize="small" />
            <span>Acesso completo a todas as funcionalidades</span>
          </div>
          <div className={classes.infoRow}>
            <PaymentIcon fontSize="small" />
            <span>Sem compromisso durante o período de teste</span>
          </div>
        </div>

        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            variant="contained rounded"
            className={classes.actionButton}
            onClick={handleActivateAccount}
            startIcon={<PaymentIcon />}
          >
            Ativar minha conta
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrialStatusCard;