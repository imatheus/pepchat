import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useColors } from '../../hooks/useColors';

const useStyles = makeStyles((theme) => ({
  demoContainer: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing(1),
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.75rem',
  },
  section: {
    marginBottom: theme.spacing(3),
  },
}));

/**
 * Componente de demonstração do sistema de cores
 * Este componente mostra como usar o novo sistema de cores centralizado
 */
const ColorSystemDemo = () => {
  const classes = useStyles();
  const colors = useColors();

  const statusExamples = [
    { status: 'ENVIADO', label: 'Enviado' },
    { status: 'PENDENTE', label: 'Pendente' },
    { status: 'ERRO', label: 'Erro' },
    { status: 'FINALIZADA', label: 'Finalizada' },
    { status: 'CANCELADA', label: 'Cancelada' },
  ];

  return (
    <Paper className={classes.demoContainer}>
      <Typography variant="h4" gutterBottom>
        Sistema de Cores Centralizado
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Este componente demonstra como usar o novo sistema de cores. 
        Todas as cores são centralizadas e se adaptam automaticamente ao tema claro/escuro.
      </Typography>

      <Divider style={{ margin: '24px 0' }} />

      {/* Cores Principais */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Cores Principais
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <div 
              className={classes.colorBox}
              style={{ backgroundColor: colors.primary }}
            >
              Primary
            </div>
            <Typography variant="caption" align="center" display="block">
              {colors.primary}
            </Typography>
          </Grid>
          <Grid item>
            <div 
              className={classes.colorBox}
              style={{ backgroundColor: colors.secondary }}
            >
              Secondary
            </div>
            <Typography variant="caption" align="center" display="block">
              {colors.secondary}
            </Typography>
          </Grid>
          <Grid item>
            <div 
              className={classes.colorBox}
              style={{ backgroundColor: colors.success }}
            >
              Success
            </div>
            <Typography variant="caption" align="center" display="block">
              {colors.success}
            </Typography>
          </Grid>
          <Grid item>
            <div 
              className={classes.colorBox}
              style={{ backgroundColor: colors.error }}
            >
              Error
            </div>
            <Typography variant="caption" align="center" display="block">
              {colors.error}
            </Typography>
          </Grid>
          <Grid item>
            <div 
              className={classes.colorBox}
              style={{ backgroundColor: colors.warning }}
            >
              Warning
            </div>
            <Typography variant="caption" align="center" display="block">
              {colors.warning}
            </Typography>
          </Grid>
          <Grid item>
            <div 
              className={classes.colorBox}
              style={{ backgroundColor: colors.info }}
            >
              Info
            </div>
            <Typography variant="caption" align="center" display="block">
              {colors.info}
            </Typography>
          </Grid>
        </Grid>
      </div>

      {/* Botões com Estilos Automáticos */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Botões com Estilos Automáticos
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button style={colors.getButtonStyle(colors.primary)}>
            Botão Primary
          </Button>
          <Button style={colors.getButtonStyle(colors.secondary)}>
            Botão Secondary
          </Button>
          <Button style={colors.getButtonStyle(colors.success)}>
            Botão Success
          </Button>
          <Button style={colors.getButtonStyle(colors.error)}>
            Botão Error
          </Button>
          <Button style={colors.getButtonStyle(colors.warning)}>
            Botão Warning
          </Button>
          <Button style={colors.getButtonStyle(colors.primary, 'outlined')}>
            Outlined
          </Button>
          <Button style={colors.getButtonStyle(colors.secondary, 'text')}>
            Text Button
          </Button>
        </Box>
      </div>

      {/* Status com Cores Automáticas */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Status com Cores Automáticas
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {statusExamples.map(({ status, label }) => (
            <span key={status} style={colors.getStatusStyle(status)}>
              {label}
            </span>
          ))}
        </Box>
      </div>

      {/* Chips/Tags */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Chips/Tags Personalizados
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            label="Tag Primary" 
            style={colors.getChipStyle(colors.primary)}
          />
          <Chip 
            label="Tag Success" 
            style={colors.getChipStyle(colors.success)}
          />
          <Chip 
            label="Tag Warning" 
            style={colors.getChipStyle(colors.warning)}
          />
          <Chip 
            label="Tag Error" 
            style={colors.getChipStyle(colors.error)}
          />
          <Chip 
            label="Tag Outlined" 
            style={colors.getChipStyle(colors.info, 'outlined')}
          />
        </Box>
      </div>

      {/* Cards */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Cards com Estilos Automáticos
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card style={colors.getCardStyle()}>
              <CardHeader title="Card Normal" />
              <CardContent>
                <Typography variant="body2">
                  Este card usa o estilo padrão do sistema de cores.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card style={colors.getCardStyle(true)}>
              <CardHeader title="Card Elevado" />
              <CardContent>
                <Typography variant="body2">
                  Este card tem sombra elevada aplicada automaticamente.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card style={{
              ...colors.getCardStyle(true),
              borderLeft: `4px solid ${colors.primary}`
            }}>
              <CardHeader title="Card Customizado" />
              <CardContent>
                <Typography variant="body2">
                  Este card combina o estilo base com customizações.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>

      {/* Demonstração de Funções Utilitárias */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Funções Utilitárias
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Manipulação de Cores
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <div 
                className={classes.colorBox}
                style={{ 
                  backgroundColor: colors.primary,
                  width: 40,
                  height: 40 
                }}
              />
              <Typography variant="body2">Original</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <div 
                className={classes.colorBox}
                style={{ 
                  backgroundColor: colors.darkenColor(colors.primary, 0.2),
                  width: 40,
                  height: 40 
                }}
              />
              <Typography variant="body2">Escurecida (20%)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <div 
                className={classes.colorBox}
                style={{ 
                  backgroundColor: colors.lightenColor(colors.primary, 0.2),
                  width: 40,
                  height: 40 
                }}
              />
              <Typography variant="body2">Clareada (20%)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <div 
                className={classes.colorBox}
                style={{ 
                  backgroundColor: colors.withOpacity(colors.primary, 0.3),
                  width: 40,
                  height: 40 
                }}
              />
              <Typography variant="body2">Com Opacidade (30%)</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Informações do Tema
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Tema Atual:</strong> {colors.isDark ? 'Escuro' : 'Claro'}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Cor Primária:</strong> {colors.primary}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Cor de Texto:</strong> {colors.textPrimary}
            </Typography>
            <Typography variant="body2">
              <strong>Cor de Fundo:</strong> {colors.bgPaper}
            </Typography>
          </Grid>
        </Grid>
      </div>

      {/* Exemplo de Código */}
      <div className={classes.section}>
        <Typography variant="h6" gutterBottom>
          Como Usar
        </Typography>
        <Paper style={{ 
          padding: 16, 
          backgroundColor: colors.isDark ? '#2a2a2a' : '#f5f5f5',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0, color: colors.textPrimary }}>
{`import { useColors } from '../hooks/useColors';

const MeuComponente = () => {
  const colors = useColors();
  
  return (
    <div style={{ 
      backgroundColor: colors.primary,
      color: colors.textInverse,
      padding: 16,
      borderRadius: 8
    }}>
      <button style={colors.getButtonStyle(colors.success)}>
        Botão Verde
      </button>
      
      <span style={colors.getStatusStyle('ENVIADO')}>
        Status Enviado
      </span>
    </div>
  );
};`}
          </pre>
        </Paper>
      </div>
    </Paper>
  );
};

export default ColorSystemDemo;