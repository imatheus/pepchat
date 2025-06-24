import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  makeStyles,
  Divider 
} from '@material-ui/core';
import TrialBanner from '../TrialBanner';
import { testScenarios } from '../../utils/testTrialBanner';

const useStyles = makeStyles((theme) => ({
  testContainer: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  testButton: {
    margin: theme.spacing(1),
    minWidth: '120px',
  },
  statusDisplay: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  bannerPreview: {
    position: 'relative',
    marginTop: theme.spacing(2),
    border: `2px dashed ${theme.palette.grey[300]}`,
    borderRadius: theme.spacing(1),
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const TrialBannerTest = () => {
  const classes = useStyles();
  const [testStatus, setTestStatus] = useState(null);

  const runTest = (scenarioName) => {
    const scenario = testScenarios[scenarioName];
    if (scenario) {
      const { mockCompanyStatus } = scenario();
      setTestStatus({
        scenario: scenarioName,
        status: mockCompanyStatus,
      });
    }
  };

  const clearTest = () => {
    setTestStatus(null);
  };

  return (
    <Paper className={classes.testContainer}>
      <Typography variant="h5" gutterBottom>
        🧪 Teste da Tarja de Período de Avaliação
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Use os botões abaixo para simular diferentes cenários de período de avaliação:
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            color="primary"
            className={classes.testButton}
            onClick={() => runTest('newUser')}
            fullWidth
          >
            Novo Usuário (7 dias)
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            color="primary"
            className={classes.testButton}
            onClick={() => runTest('midTrial')}
            fullWidth
          >
            Meio do Trial (4 dias)
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            color="secondary"
            className={classes.testButton}
            onClick={() => runTest('warning')}
            fullWidth
          >
            Aviso (3 dias)
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            style={{ backgroundColor: '#ff6b35', color: 'white' }}
            className={classes.testButton}
            onClick={() => runTest('urgent')}
            fullWidth
          >
            Urgente (1 dia)
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            style={{ backgroundColor: '#e74c3c', color: 'white' }}
            className={classes.testButton}
            onClick={() => runTest('lastDay')}
            fullWidth
          >
            Último Dia
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="outlined"
            className={classes.testButton}
            onClick={clearTest}
            fullWidth
          >
            Limpar Teste
          </Button>
        </Grid>
      </Grid>

      {testStatus && (
        <>
          <Divider style={{ margin: '20px 0' }} />
          
          <Box className={classes.statusDisplay}>
            <Typography variant="h6" gutterBottom>
              📊 Status Atual do Teste: {testStatus.scenario}
            </Typography>
            
            <Typography variant="body2">
              <strong>Em Trial:</strong> {testStatus.status.isInTrial ? 'Sim' : 'Não'}
            </Typography>
            
            <Typography variant="body2">
              <strong>Dias Restantes:</strong> {testStatus.status.daysRemaining}
            </Typography>
            
            <Typography variant="body2">
              <strong>Mensagem:</strong> {testStatus.status.message}
            </Typography>
            
            <Typography variant="body2">
              <strong>Deve Mostrar Tarja:</strong> {testStatus.status.isInTrial && testStatus.status.daysRemaining > 0 ? 'Sim' : 'Não'}
            </Typography>
          </Box>

          <Box className={classes.bannerPreview}>
            <Typography variant="body2" color="textSecondary">
              Preview da Tarja (simulação - a tarja real aparece no topo da página)
            </Typography>
          </Box>
        </>
      )}

      <Divider style={{ margin: '20px 0' }} />
      
      <Typography variant="body2" color="textSecondary">
        <strong>Instruções:</strong>
        <br />
        1. Clique em um dos botões para simular um cenário
        <br />
        2. Verifique se a tarja aparece no topo da página
        <br />
        3. A tarja deve mostrar o número correto de dias restantes
        <br />
        4. As cores devem mudar conforme a urgência (azul → laranja → vermelho)
      </Typography>
    </Paper>
  );
};

export default TrialBannerTest;