import React from "react";
import {
  Popover,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  makeStyles,
  useTheme
} from "@material-ui/core";
import {
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon
} from "@material-ui/icons";
import { useCustomTheme } from "../../context/Theme/ThemeContext";

const useStyles = makeStyles((theme) => ({
  popover: {
    pointerEvents: "none",
    zIndex: 1500,
  },
  paper: {
    padding: theme.spacing(3),
    maxWidth: 320,
    pointerEvents: "auto",
    position: "relative",
    overflow: "visible",
    borderRadius: theme.spacing(1.5),
    border: `2px solid ${theme.palette.primary.main}`,
    background: "#ffffff",
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`,
  },
  paperRight: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: -10,
      transform: "translateY(-50%)",
      width: 0,
      height: 0,
      borderTop: "10px solid transparent",
      borderBottom: "10px solid transparent",
      borderRight: `10px solid ${theme.palette.primary.main}`,
    }
  },
  paperBottom: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: -10,
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      borderLeft: "10px solid transparent",
      borderRight: "10px solid transparent",
      borderBottom: `10px solid ${theme.palette.primary.main}`,
    }
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    color: theme.palette.primary.main,
    fontSize: '1.1rem',
  },
  content: {
    marginBottom: theme.spacing(3),
    lineHeight: 1.6,
    color: "#333333",
  },
  actions: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1, 2),
    boxShadow: `0 2px 8px ${theme.palette.type === 'dark' ? 'rgba(102, 187, 106, 0.3)' : 'rgba(68, 183, 116, 0.3)'}`,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: `0 4px 12px ${theme.palette.type === 'dark' ? 'rgba(102, 187, 106, 0.4)' : 'rgba(68, 183, 116, 0.4)'}`,
    },
  },
  secondaryButton: {
    color: "#666666",
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1, 2),
    "&:hover": {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  closeButton: {
    color: "#666666",
    padding: theme.spacing(0.5),
    "&:hover": {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  icon: {
    color: theme.palette.primary.main,
  },
}));

const TutorialTooltip = ({
  open,
  anchorEl,
  onClose,
  onNext,
  title,
  content,
  showNext = true,
  showClose = true,
  placement = "right"
}) => {
  const classes = useStyles();
  const theme = useTheme();

  const getPaperClassName = () => {
    let className = classes.paper;
    if (placement === "right") {
      className += ` ${classes.paperRight}`;
    } else if (placement === "bottom") {
      className += ` ${classes.paperBottom}`;
    }
    return className;
  };

  const getAnchorOrigin = () => {
    if (placement === "bottom") {
      return { vertical: "bottom", horizontal: "center" };
    }
    return { vertical: "center", horizontal: placement === "right" ? "right" : "left" };
  };

  const getTransformOrigin = () => {
    if (placement === "bottom") {
      return { vertical: "top", horizontal: "center" };
    }
    return { vertical: "center", horizontal: placement === "right" ? "left" : "right" };
  };

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        className={classes.popover}
        anchorOrigin={getAnchorOrigin()}
        transformOrigin={getTransformOrigin()}
        disableRestoreFocus
        disableScrollLock={false}
        PaperProps={{
          className: getPaperClassName()
        }}
        style={{
          zIndex: 1500
        }}
      >
        <Box className={classes.header}>
          <Typography variant="h6" className={classes.title}>
            <InfoIcon fontSize="small" className={classes.icon} />
            {title}
          </Typography>
          {showClose && (
            <IconButton
              size="small"
              onClick={onClose}
              className={classes.closeButton}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        <Typography variant="body2" className={classes.content}>
          {content}
        </Typography>
        
        {showNext && (
          <Box className={classes.actions}>
            <Button
              size="small"
              onClick={onClose}
              className={classes.secondaryButton}
            >
              Agora não
            </Button>
            <Button
              size="small"
              onClick={onNext}
              className={classes.primaryButton}
              endIcon={<ArrowForwardIcon fontSize="small" />}
            >
              Vamos lá!
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default TutorialTooltip;