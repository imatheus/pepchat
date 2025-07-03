import React from 'react';
import { Switch, FormControlLabel, withStyles } from '@material-ui/core';
import { useCustomTheme } from '../../context/Theme/ThemeContext';

// Componente Switch customizado que se adapta ao tema
const CustomSwitch = withStyles((theme) => ({
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

// Componente Switch com estilo específico (para casos especiais)
const SpecialSwitch = withStyles((theme) => ({
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
        backgroundColor: '#000000',
        opacity: 1,
        border: 'none',
      },
    },
    '&$focusVisible $thumb': {
      color: '#000000',
      border: '6px solid #fff',
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
    border: '1px solid #bbbbbb',
    backgroundColor: '#c2c2c2',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
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
      }}
      {...props}
    />
  );
});

/**
 * Componente ToggleSwitch unificado
 * Substitui StandardToggleSwitch e BlackToggleSwitch
 * 
 * @param {string} label - Texto do label
 * @param {boolean} checked - Estado do switch
 * @param {function} onChange - Função chamada quando o estado muda
 * @param {boolean} disabled - Se o switch está desabilitado
 * @param {string} color - Cor do switch ('primary', 'secondary')
 * @param {string} size - Tamanho do switch ('small', 'medium')
 * @param {string} labelPlacement - Posição do label ('start', 'end', 'top', 'bottom')
 * @param {string} variant - Variante do switch ('standard', 'special')
 */
const ToggleSwitch = ({ 
  label, 
  checked, 
  onChange, 
  disabled = false,
  color = 'primary',
  size = 'medium',
  labelPlacement = 'end',
  variant = 'standard',
  ...props 
}) => {
  const { darkMode } = useCustomTheme();
  
  // Escolher o componente Switch baseado na variante
  const SwitchComponent = variant === 'special' ? SpecialSwitch : CustomSwitch;
  
  return (
    <FormControlLabel
      control={
        <SwitchComponent
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
      style={{
        color: darkMode ? '#ffffff' : '#151515',
      }}
    />
  );
};

export default ToggleSwitch;

// Exportar também os componentes antigos para compatibilidade
export const StandardToggleSwitch = (props) => <ToggleSwitch {...props} variant="standard" />;
export const BlackToggleSwitch = (props) => <ToggleSwitch {...props} variant="special" />;