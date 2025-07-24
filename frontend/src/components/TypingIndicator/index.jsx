import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "20px",
    margin: "8px 20px",
    maxWidth: "200px",
  },
  typingText: {
    fontSize: "14px",
    color: "#666",
    fontStyle: "italic",
    marginRight: "8px",
  },
  dots: {
    display: "flex",
    alignItems: "center",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#666",
    margin: "0 1px",
    animation: "$typing 1.4s infinite ease-in-out",
    "&:nth-child(1)": {
      animationDelay: "0s",
    },
    "&:nth-child(2)": {
      animationDelay: "0.2s",
    },
    "&:nth-child(3)": {
      animationDelay: "0.4s",
    },
  },
  "@keyframes typing": {
    "0%, 60%, 100%": {
      transform: "translateY(0)",
      opacity: 0.4,
    },
    "30%": {
      transform: "translateY(-10px)",
      opacity: 1,
    },
  },
}));

const TypingIndicator = ({ contactName }) => {
  const classes = useStyles();

  return (
    <div className={classes.typingIndicator}>
      <Typography className={classes.typingText}>
        {contactName} {i18n.t("chat.typing")}
      </Typography>
      <div className={classes.dots}>
        <div className={classes.dot}></div>
        <div className={classes.dot}></div>
        <div className={classes.dot}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;