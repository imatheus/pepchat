import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1300,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.4s ease",
    "&.visible": {
      opacity: 1,
    },
  },
  spotlight: {
    position: "fixed",
    backgroundColor: "transparent",
    borderRadius: "12px",
    pointerEvents: "none",
    zIndex: 1301,
    transition: "all 0.4s ease",
    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.3)`,
  },
}));

const TutorialOverlay = ({ show, targetElement }) => {
  const classes = useStyles();
  const [visible, setVisible] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState({});

  useEffect(() => {
    if (show && targetElement) {
      // Pequeno delay para permitir que o elemento seja renderizado
      const timer = setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        const padding = 12;

        setSpotlightStyle({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + (padding * 2),
          height: rect.height + (padding * 2),
        });
        setVisible(true);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, targetElement]);

  if (!show) {
    return null;
  }

  return (
    <>
      <div className={`${classes.overlay} ${visible ? 'visible' : ''}`} />
      {visible && (
        <div 
          className={classes.spotlight}
          style={spotlightStyle}
        />
      )}
    </>
  );
};

export default TutorialOverlay;