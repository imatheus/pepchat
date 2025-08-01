import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Box,
  Typography,
  Tooltip,
  Grid,
  Paper,
  FormControl,
  FormLabel,
} from '@material-ui/core';
import { getAllVividColors, getContrastColor } from '../../utils/colorGenerator';

const useStyles = makeStyles((theme) => ({
  colorPickerContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  colorGrid: {
    marginTop: theme.spacing(1),
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    cursor: 'pointer',
    border: '3px solid transparent',
    transition: 'all 0.2s ease',
    margin: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
  },
  selectedColor: {
    border: '3px solid #333',
    transform: 'scale(1.15)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    '&::after': {
      content: '"✓"',
      position: 'absolute',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
    },
  },
  categorySection: {
    marginBottom: theme.spacing(2),
  },
  categoryTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  selectedColorPreview: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.grey[100],
  },
  selectedColorCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    marginRight: theme.spacing(1),
    border: '2px solid #ccc',
  },
  selectedColorText: {
    fontSize: '0.9rem',
    color: theme.palette.text.primary,
  },
}));

const ColorPicker = ({ selectedColor, onColorChange, label = "Cor do Setor" }) => {
  const classes = useStyles();
  const vividColors = getAllVividColors();

  // Agrupar cores por categoria
  const colorsByCategory = vividColors.reduce((acc, colorObj) => {
    if (!acc[colorObj.category]) {
      acc[colorObj.category] = [];
    }
    acc[colorObj.category].push(colorObj);
    return acc;
  }, {});

  const categoryNames = {
    red: 'Vermelhos',
    blue: 'Azuis',
    green: 'Verdes',
    orange: 'Laranjas',
    yellow: 'Amarelos',
    purple: 'Roxos',
    cyan: 'Turquesas',
    gray: 'Cinzas',
  };

  const handleColorSelect = (color) => {
    onColorChange(color);
  };

  const getSelectedColorInfo = () => {
    return vividColors.find(colorObj => colorObj.color === selectedColor);
  };

  const selectedColorInfo = getSelectedColorInfo();

  return (
    <FormControl className={classes.colorPickerContainer} fullWidth>
      <FormLabel component="legend">{label}</FormLabel>
      
      {/* Preview da cor selecionada */}
      {selectedColor && (
        <Box className={classes.selectedColorPreview}>
          <div
            className={classes.selectedColorCircle}
            style={{ backgroundColor: selectedColor }}
          />
          <Typography className={classes.selectedColorText}>
            {selectedColorInfo ? selectedColorInfo.name : selectedColor}
          </Typography>
        </Box>
      )}

      {/* Grid de cores organizadas por categoria */}
      <Box className={classes.colorGrid}>
        {Object.entries(colorsByCategory).map(([category, colors]) => (
          <Box key={category} className={classes.categorySection}>
            <Typography className={classes.categoryTitle}>
              {categoryNames[category] || category}
            </Typography>
            <Grid container spacing={0}>
              {colors.map((colorObj) => (
                <Grid item key={colorObj.color}>
                  <Tooltip title={colorObj.name} arrow>
                    <div
                      className={`${classes.colorOption} ${
                        selectedColor === colorObj.color ? classes.selectedColor : ''
                      }`}
                      style={{ backgroundColor: colorObj.color }}
                      onClick={() => handleColorSelect(colorObj.color)}
                    />
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>
    </FormControl>
  );
};

export default ColorPicker;