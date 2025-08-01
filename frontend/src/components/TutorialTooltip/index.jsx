import React from "react";
import {
  Popover,
  Typography,
  Button,
  Box,
  IconButton,
  makeStyles
} from "@material-ui/core";
import {
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon
} from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  popover: {
    zIndex: 1500,
  },
  paper: {
    padding: theme.spacing(2),
    maxWidth: 300,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.primary.main}`,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  title: {
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  content: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  actions: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  closeButton: {
    padding: theme.spacing(0.5),
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
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      className={classes.popover}
      anchorOrigin={getAnchorOrigin()}
      transformOrigin={getTransformOrigin()}
      PaperProps={{
        className: classes.paper
      }}
    >
      <Box className={classes.header}>
        <Typography variant="h6" className={classes.title}>
          <InfoIcon fontSize="small" />
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
          <Button size="small" onClick={onClose}>
            Agora não
          </Button>
          <Button
            size="small"
            onClick={onNext}
            className={classes.primaryButton}
            variant="contained"
            endIcon={<ArrowForwardIcon fontSize="small" />}
          >
            Vamos lá!
          </Button>
        </Box>
      )}
    </Popover>
  );
};

export default TutorialTooltip;