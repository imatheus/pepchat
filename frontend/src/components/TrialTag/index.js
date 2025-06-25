import React from 'react';
import { Chip, Button, makeStyles } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import useCompanyStatus from '../../hooks/useCompanyStatus';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  trialTag: {
    backgroundColor: '#667eea',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    height: '24px',
    borderRadius: '12px',
    animation: '$pulse 2s ease-in-out infinite',
    '& .MuiChip-label': {
      padding: '5px 12px 7px',
      fontWeight: 600,
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '10px',
      height: '20px',
      '& .MuiChip-label': {
        padding: '0 6px',
      },
    },
  },
  warningTag: {
    backgroundColor: '#ff6b35',
    animation: '$fastPulse 1.5s ease-in-out infinite',
  },
  urgentTag: {
    backgroundColor: '#e74c3c',
    animation: '$urgentPulse 1s ease-in-out infinite',
  },
  activateButton: {
    backgroundColor: '#4caf50',
    color: '#fff',
    fontSize: '14px',
    height: '24px',
    minWidth: '60px',
    padding: '5px 12px 7px',
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#45a049',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '14px',
      height: '20px',
      minWidth: '50px',
      padding: '0 6px',
    },
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(102, 126, 234, 0.4)',
    },
    '50%': {
      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(102, 126, 234, 0)',
    },
  },
  '@keyframes fastPulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(255, 107, 53, 0.4)',
    },
    '50%': {
      boxShadow: '0 0 0 4px rgba(255, 107, 53, 0.2)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(255, 107, 53, 0)',
    },
  },
  '@keyframes urgentPulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(231, 76, 60, 0.4)',
    },
    '50%': {
      boxShadow: '0 0 0 6px rgba(231, 76, 60, 0.3)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(231, 76, 60, 0)',
    },
  },
}));

const TrialTag = () => {
  const classes = useStyles();
  const { companyStatus } = useCompanyStatus();
  const history = useHistory();

  // Só mostrar se estiver em período de avaliação
  if (!companyStatus.isInTrial || companyStatus.daysRemaining <= 0) {
    return null;
  }

  const daysRemaining = companyStatus.daysRemaining;

  const getTagClass = () => {
    if (daysRemaining <= 1) return classes.urgentTag;
    if (daysRemaining <= 3) return classes.warningTag;
    return '';
  };

  const getLabel = () => {
    if (daysRemaining === 1) {
      return `Avaliação - Último Dia!`;
    } else {
      return `Avaliação - ${daysRemaining} Dias`;
    }
  };

  const handleActivateClick = () => {
    history.push('/financeiro');
  };

  const showActivateButton = daysRemaining < 3;

  return (
    <div className={classes.container}>
      <Chip
        label={getLabel()}
        className={`${classes.trialTag} ${getTagClass()}`}
        size="small"
      />
      {showActivateButton && (
        <Button
          className={classes.activateButton}
          onClick={handleActivateClick}
          size="small"
        >
          Ativar Agora
        </Button>
      )}
    </div>
  );
};

export default TrialTag;