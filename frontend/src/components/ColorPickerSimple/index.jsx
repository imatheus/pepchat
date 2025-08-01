import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Box,
  Typography,
  Tooltip,
  Grid,
  Popover,
  IconButton,
} from '@material-ui/core';
import { getAllVividColors } from '../../utils/colorGenerator';

const useStyles = makeStyles((theme) => ({
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid #ccc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
  },
  popoverContent: {
    padding: theme.spacing(1.5),
    width: 280,
    maxWidth: 'none',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: theme.spacing(0.8),
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
    position: 'relative',
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
  },
  selectedColor: {
    border: '2px solid #333',
    '&::after': {
      content: '"✓"',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
    },
  },
  categoryTitle: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },
}));

const ColorPickerSimple = ({ selectedColor, onColorChange }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const vividColors = getAllVividColors();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    onColorChange(color);
    handleClose();
  };

  const open = Boolean(anchorEl);

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

  return (
    <>
      <Tooltip title="Clique para escolher a cor" arrow>
        <div
          className={classes.colorButton}
          style={{ backgroundColor: selectedColor || '#ccc' }}
          onClick={handleClick}
        />
      </Tooltip>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            marginTop: 8,
            marginRight: -8,
          }
        }}
      >
        <Box className={classes.popoverContent}>
          <Box className={classes.colorGrid}>
            {vividColors.map((colorObj) => (
              <Tooltip key={colorObj.color} title={colorObj.name} arrow>
                <div
                  className={`${classes.colorOption} ${
                    selectedColor === colorObj.color ? classes.selectedColor : ''
                  }`}
                  style={{ backgroundColor: colorObj.color }}
                  onClick={() => handleColorSelect(colorObj.color)}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ColorPickerSimple;