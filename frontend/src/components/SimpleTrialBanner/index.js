import React from 'react';
import { makeStyles } from '@material-ui/core';
import useCompanyStatus from '../../hooks/useCompanyStatus';

const useStyles = makeStyles((theme) => ({
  banner: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    zIndex: theme.zIndex.appBar + 1,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "10px 16px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  warningBanner: {
    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
    boxShadow: "0 2px 8px rgba(255, 107, 53, 0.3)",
  },
  urgentBanner: {
    background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
    boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
    animation: "$pulse 2s infinite",
  },
  icon: {
    fontSize: "16px",
  },
  "@keyframes pulse": {
    "0%": {
      boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
    },
    "50%": {
      boxShadow: "0 4px 16px rgba(231, 76, 60, 0.5)",
    },
    "100%": {
      boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
    },
  },
}));

const SimpleTrialBanner = () => {
  const classes = useStyles();
  const { companyStatus } = useCompanyStatus();

  // Só mostrar se estiver em período de avaliação
  if (!companyStatus.isInTrial || companyStatus.daysRemaining <= 0) {
    return null;
  }

  const daysRemaining = companyStatus.daysRemaining;

  const getBannerClass = () => {
    if (daysRemaining <= 1) return classes.urgentBanner;
    if (daysRemaining <= 3) return classes.warningBanner;
    return '';
  };

  const getIcon = () => {
    if (daysRemaining <= 1) return "🚨";
    if (daysRemaining <= 3) return "⚠️";
    return "🔥";
  };

  return (
    <div className={`${classes.banner} ${getBannerClass()}`}>
      <span className={classes.icon}>{getIcon()}</span>
      <span>
        Avaliação - {daysRemaining} {daysRemaining === 1 ? 'Dia Restante' : 'Dias Restantes'}
      </span>
    </div>
  );
};

export default SimpleTrialBanner;