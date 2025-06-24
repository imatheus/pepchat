import React from 'react';
import { Switch, FormControlLabel, withStyles } from '@material-ui/core';

const StandardSwitch = withStyles((theme) => ({
  root: {
    width: 42,
    height: 26,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    padding: 1,
    '&$checked': {
      transform: 'translateX(16px)',
      color: theme.palette.common.white,
      '& + $track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 'none',
      },
    },
    '&$focusVisible $thumb': {
      color: theme.palette.primary.main,
      border: '6px solid #fff',
    },
    '&$disabled': {
      '& + $track': {
        backgroundColor: theme.palette.grey[400],
        opacity: 0.5,
      },
      '& $thumb': {
        backgroundColor: theme.palette.grey[300],
      },
    },
  },
  thumb: {
    width: 24,
    height: 24,
    backgroundColor: theme.palette.common.white,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  track: {
    borderRadius: 26 / 2,
    border: `1px solid ${theme.palette.grey[400]}`,
    backgroundColor: theme.palette.grey[300],
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
  disabled: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
        disabled: classes.disabled,
      }}
      {...props}
    />
  );
});

const StandardToggleSwitch = ({ 
  label, 
  checked, 
  onChange, 
  disabled = false,
  color = 'primary',
  size = 'medium',
  labelPlacement = 'end',
  ...props 
}) => {
  return (
    <FormControlLabel
      control={
        <StandardSwitch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          color={color}
          size={size}
          {...props}
        />
      }
      label={label}
      labelPlacement={labelPlacement}
      disabled={disabled}
    />
  );
};

export default StandardToggleSwitch;