import React from 'react';
import { Box, Typography, Chip, makeStyles } from '@material-ui/core';
import { AccessTime, Star, TrendingUp } from '@material-ui/icons';
import useCompanyStatus from '../../hooks/useCompanyStatus';

const useStyles = makeStyles((theme) => ({
  trialBanner: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    zIndex: theme.zIndex.appBar + 1,
    padding: "12px 16px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
    animation: "$trialPulse 3s ease-in-out infinite",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "50px",
    borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(10px)",
    flexWrap: "wrap",
    [theme.breakpoints.down('sm')]: {
      padding: "8px 12px",
      fontSize: "14px",
      minHeight: "45px",
      gap: "8px",
    },
  },
  urgentBanner: {
    background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
    animation: "$urgentPulse 2s ease-in-out infinite",
  },
  warningBanner: {
    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
  },
  bannerIcon: {
    fontSize: "20px",
    animation: "$bounce 2s infinite",
    [theme.breakpoints.down('sm')]: {
      fontSize: "18px",
    },
  },
  bannerText: {
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      fontSize: "13px",
    },
  },
  daysChip: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "#fff",
    fontWeight: 800,
    border: "1px solid rgba(255, 255, 255, 0.4)",
    fontSize: "13px",
    height: "28px",
    "& .MuiChip-label": {
      padding: "0 8px",
      fontWeight: 800,
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: "12px",
      height: "24px",
    },
  },
  urgentChip: {
    backgroundColor: "#fff",
    color: "#e74c3c",
    animation: "$chipBlink 1.5s infinite",
  },
  statusIcon: {
    fontSize: "18px",
    marginRight: "4px",
    [theme.breakpoints.down('sm')]: {
      fontSize: "16px",
    },
  },
  "@keyframes trialPulse": {
    "0%": {
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
      transform: "scale(1)",
    },
    "50%": {
      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
      transform: "scale(1.01)",
    },
    "100%": {
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
      transform: "scale(1)",
    },
  },
  "@keyframes urgentPulse": {
    "0%": {
      boxShadow: "0 4px 12px rgba(231, 76, 60, 0.4)",
      transform: "scale(1)",
    },
    "50%": {
      boxShadow: "0 8px 24px rgba(231, 76, 60, 0.7)",
      transform: "scale(1.02)",
    },
    "100%": {
      boxShadow: "0 4px 12px rgba(231, 76, 60, 0.4)",
      transform: "scale(1)",
    },
  },
  "@keyframes bounce": {
    "0%, 20%, 50%, 80%, 100%": {
      transform: "translateY(0)",
    },
    "40%": {
      transform: "translateY(-3px)",
    },
    "60%": {
      transform: "translateY(-2px)",
    },
  },
  "@keyframes chipBlink": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.8 },
    "100%": { opacity: 1 },
  },
}));

const TrialBanner = () => {
  const classes = useStyles();
  const { companyStatus } = useCompanyStatus();

  // Não mostrar se não estiver em período de avaliação
  if (!companyStatus.isInTrial || companyStatus.daysRemaining <= 0) {
    return null;
  }

  const daysRemaining = companyStatus.daysRemaining;

  const getBannerClass = () => {
    if (daysRemaining <= 1) return classes.urgentBanner;
    if (daysRemaining <= 3) return classes.warningBanner;
    return '';
  };

  const getChipClass = () => {
    if (daysRemaining <= 1) return classes.urgentChip;
    return classes.daysChip;
  };

  const getIcon = () => {
    if (daysRemaining <= 1) return "🚨";
    if (daysRemaining <= 3) return "⚠️";
    return "🔥";
  };

  const getStatusIcon = () => {
    if (daysRemaining <= 1) return <AccessTime className={classes.statusIcon} />;
    if (daysRemaining <= 3) return <AccessTime className={classes.statusIcon} />;
    return <Star className={classes.statusIcon} />;
  };

  const getMessage = () => {
    if (daysRemaining === 1) {
      return "ÚLTIMO DIA DE AVALIAÇÃO";
    } else if (daysRemaining <= 3) {
      return "PERÍODO DE AVALIAÇÃO";
    } else {
      return "PERÍODO DE AVALIAÇÃO ATIVO";
    }
  };

  const getDaysText = () => {
    if (daysRemaining === 1) {
      return "1 DIA RESTANTE";
    } else {
      return `${daysRemaining} DIAS RESTANTES`;
    }
  };

  return (
    <Box className={`${classes.trialBanner} ${getBannerClass()}`}>
      <span className={classes.bannerIcon} role="img" aria-label="status">
        {getIcon()}
      </span>
      
      <div className={classes.bannerText}>
        {getStatusIcon()}
        <Typography component="span" style={{ fontWeight: 700 }}>
          {getMessage()}
        </Typography>
        
        <Chip
          label={getDaysText()}
          className={getChipClass()}
          size="small"
        />
      </div>
      
          </Box>
  );
};

export default TrialBanner;