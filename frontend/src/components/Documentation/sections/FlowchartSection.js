import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
  Tab,
  Tabs,
  TabPanel,
  useTheme
} from '@material-ui/core';
import {
  ExpandMore as ExpandMoreIcon,
  AccountTree as FlowchartIcon,
  Settings as SettingsIcon,
  School as TrainingIcon,
  Message as MessageIcon,
  SmartToy as RobotIcon,
  SupervisorAccount as ControlIcon,
  ArrowDownward as ArrowIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Person as PersonIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import CodeBlock from '../components/CodeBlock';
import { useCustomTheme } from '../../../context/Theme/ThemeContext';

const useStyles = makeStyles((theme) => ({
  section: {
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary
  },
  title: {
    color: theme.palette.primary.main,
    fontWeight: 700,
    marginBottom: theme.spacing(2)
  },
  subtitle: {
    color: theme.palette.text.primary,
    fontWeight: 600,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2)
  },
  flowStep: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 12px ${theme.palette.primary.main}33`
    }
  },
  flowArrow: {
    textAlign: 'center',
    color: theme.palette.primary.main,
    fontSize: '2rem',
    margin: theme.spacing(1, 0)
  },
  decisionBox: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: '2px solid #ff9800',
    borderRadius: '50px',
    padding: theme.spacing(2),
    textAlign: 'center',
    margin: theme.spacing(2, 0)
  },
  yesPath: {
    backgroundColor: theme.palette.type === 'dark' ? '#1b2e1b' : '#e8f5e8',
    border: '1px solid #4caf50',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    margin: theme.spacing(1)
  },
  noPath: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d1810' : '#ffeaea',
    border: '1px solid #f44336',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    margin: theme.spacing(1)
  },
  stageCard: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  stageTitle: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  sequenceStep: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center'
  },
  stepNumber: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(2),
    fontSize: '0.875rem',
    fontWeight: 600
  },
  stateItem: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1)
  },
  checklistSection: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2)
  },
  fileStructure: {
    backgroundColor: theme.palette.type === 'dark' ? '#0d1117' : '#f8f9fa',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(1)
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTab-root': {
      color: theme.palette.text.secondary,
      '&.Mui-selected': {
        color: theme.palette.primary.main
      }
    },
    '& .MuiTabs-indicator': {
      backgroundColor: theme.palette.primary.main
    }
  }
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`flowchart-tabpanel-${index}`}
      aria-labelledby={`flowchart-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FlowchartSection = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const mainFlowSteps = [
    {
      title: 'Sistema Smart Atendimento',
      description: 'Ponto de entrada do sistema',
      icon: <SettingsIcon />
    },
    {
      title: 'Verificação de Plano',
      description: 'company.plan.ai_agent_enabled?',
      icon: <CheckIcon />,
      isDecision: true
    },
    {
      title: 'Minhas Conexões',
      description: 'Usuário acessa tela de conexões',
      icon: <MessageIcon />
    },
    {
      title: 'Botão "Treinar IA"',
      description: 'Visível se plano permite',
      icon: <TrainingIcon />
    },
    {
      title: 'Modal de Treinamento',
      description: 'Formulário simples da empresa',
      icon: <RobotIcon />
    },
    {
      title: 'PEPE Ativado',
      description: 'IA pronta para atender',
      icon: <CheckIcon />
    }
  ];

  const trainingSequence = [
    'Usuário → Frontend: Clica "Treinar IA"',
    'Frontend → Usuário: Abre modal',
    'Usuário → Frontend: Preenche dados',
    'Frontend → Backend: POST /ai-training/simple',
    'Backend → Database: Salva dados',
    'Backend → Database: Gera embeddings',
    'Backend → Database: Ativa PEPE',
    'Backend → Frontend: Sucesso',
    'Frontend → Usuário: "PEPE ativado!"'
  ];

  const attendanceSequence = [
    'WhatsApp → Backend: Nova mensagem',
    'Backend → Database: Busca ticket',
    'Backend → Backend: Chatbot básico',
    'WhatsApp → Backend: Cliente escolhe setor',
    'Backend → Database: Verifica PEPE ativo',
    'Backend → Database: PEPE assume ticket',
    'Backend → Database: Busca dados treinamento',
    'Backend → Database: Gera embedding pergunta',
    'Backend → Database: Busca similaridade',
    'Backend → DeepSeek API: Envia prompt',
    'DeepSeek API → Backend: Resposta IA',
    'Backend → WhatsApp: Envia resposta'
  ];

  const systemStates = [
    {
      icon: '🚫',
      title: 'Sem IA',
      description: 'Plano não permite → Fluxo normal sem PEPE'
    },
    {
      icon: '⚙️',
      title: 'Não Treinado',
      description: 'IA permitida mas não configurada → Botão "Treinar IA"'
    },
    {
      icon: '✅',
      title: 'PEPE Ativo',
      description: 'IA treinada e funcionando → Processa mensagens'
    },
    {
      icon: '⏸️',
      title: 'IA Pausada',
      description: 'Operador pausou → Aguarda reativação'
    },
    {
      icon: '👤',
      title: 'Atendimento Humano',
      description: 'Humano assumiu controle → PEPE inativo'
    }
  ];

  const decisionPoints = [
    {
      title: 'Verificação de Plano',
      code: `if (company.plan.ai_agent_enabled) {
  // Mostra botão "Treinar IA"
} else {
  // Esconde botão ou mostra desabilitado
}`
    },
    {
      title: 'Ativação do PEPE',
      code: `if (ticket.queueId && !ticket.userId && whatsapp.ai_enabled) {
  // PEPE assume o ticket
} else {
  // Fluxo normal para "Aguardando"
}`
    },
    {
      title: 'Busca por Similaridade',
      code: `if (similarityScore >= 0.7) {
  // Usa contexto encontrado
} else {
  // Transfere para humano
}`
    },
    {
      title: 'Controle de IA',
      code: `if (aiSession.isPaused) {
  // Não processa com IA
} else {
  // PEPE pode processar
}`
    }
  ];

  const checklistItems = [
    {
      category: 'Configuração',
      items: [
        'Parâmetro ai_agent_enabled nos planos',
        'Usuário PEPE no sistema',
        'Extensão pgvector no PostgreSQL'
      ]
    },
    {
      category: 'Treinamento',
      items: [
        'Modal de treinamento na tela Conexões',
        'API de salvamento de dados',
        'Geração de embeddings locais',
        'Ativação automática do PEPE'
      ]
    },
    {
      category: 'Processamento',
      items: [
        'Integração com DeepSeek API',
        'Busca por similaridade vetorial',
        'Geração de respostas contextuais',
        'Sistema de fallback para humanos'
      ]
    },
    {
      category: 'Interface',
      items: [
        'Nova aba "Pepe AI" nos atendimentos',
        'Controles de pausa/retomada',
        'Indicadores visuais de IA ativa',
        'Alertas para intervenção humana'
      ]
    }
  ];

  const fileStructure = {
    backend: [
      'src/services/AIServices/PepeAIService.ts',
      'src/services/AIServices/EmbeddingService.ts',
      'src/services/AIServices/DeepSeekService.ts',
      'src/models/AITrainingSimple.ts',
      'src/models/AIEmbeddingLocal.ts',
      'src/controllers/AITrainingController.ts',
      'src/routes/aiTrainingRoutes.ts'
    ],
    frontend: [
      'pages/Connections/TrainingModal.tsx',
      'pages/Connections/TrainAIButton.tsx',
      'pages/Tickets/PepeAITab.tsx',
      'pages/Tickets/AIControlPanel.tsx'
    ],
    database: [
      'ai_training_simple - Dados de treinamento',
      'ai_embeddings_local - Embeddings vetoriais',
      'users - Usuário PEPE',
      'plans - Parâmetro ai_agent_enabled'
    ]
  };

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        <FlowchartIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
        Fluxograma Completo - Integração Agente PEPE
      </Typography>

      <Typography variant="body1" paragraph>
        Este fluxograma mostra todo o processo de integração do PEPE, desde a configuração 
        inicial até o atendimento automatizado com controles humanos.
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} className={classes.tabs}>
        <Tab label="Fluxo Principal" />
        <Tab label="Etapas Detalhadas" />
        <Tab label="Fluxo de Dados" />
        <Tab label="Estados do Sistema" />
        <Tab label="Implementação" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h5" className={classes.subtitle}>
          🔄 Fluxo Principal de Integração
        </Typography>

        <Grid container spacing={2}>
          {mainFlowSteps.map((step, index) => (
            <Grid item xs={12} key={index}>
              <div className={step.isDecision ? classes.decisionBox : classes.flowStep}>
                <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                  {step.icon}
                  <Typography variant="h6" style={{ marginLeft: 8 }}>
                    {step.title}
                  </Typography>
                </Box>
                <Typography variant="body2" style={{ color: '#b0b0b0' }}>
                  {step.description}
                </Typography>
              </div>
              
              {index < mainFlowSteps.length - 1 && (
                <div className={classes.flowArrow}>
                  <ArrowIcon />
                </div>
              )}

              {step.isDecision && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <div className={classes.yesPath}>
                      <Typography variant="body2" style={{ color: '#4caf50' }}>
                        ✅ Sim → Continua fluxo
                      </Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className={classes.noPath}>
                      <Typography variant="body2" style={{ color: '#f44336' }}>
                        ❌ Não → Fluxo normal
                      </Typography>
                    </div>
                  </Grid>
                </Grid>
              )}
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" className={classes.subtitle}>
          📋 Etapas Detalhadas do Fluxograma
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <div className={classes.stageCard}>
              <Typography variant="h6" className={classes.stageTitle}>
                1️⃣ Configuração Inicial
              </Typography>
              <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 8 }}>
                Admin do Sistema:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Acessa Configurações > Planos"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Habilita ai_agent_enabled = true"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Empresa ganha acesso ao PEPE"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </div>
          </Grid>

          <Grid item xs={12} md={6}>
            <div className={classes.stageCard}>
              <Typography variant="h6" className={classes.stageTitle}>
                2️⃣ Treinamento do PEPE
              </Typography>
              <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 8 }}>
                Usuário da Empresa:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Acessa 'Minhas Conexões'"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Clica botão 'Treinar IA'"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Preenche formulário da empresa"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="PEPE é automaticamente ativado"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </div>
          </Grid>

          <Grid item xs={12} md={6}>
            <div className={classes.stageCard}>
              <Typography variant="h6" className={classes.stageTitle}>
                3️⃣ Processamento de Mensagens
              </Typography>
              <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 8 }}>
                Fluxo Automático:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Nova mensagem WhatsApp chega"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Chatbot básico apresenta setores"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="PEPE assume o ticket automaticamente"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </div>
          </Grid>

          <Grid item xs={12} md={6}>
            <div className={classes.stageCard}>
              <Typography variant="h6" className={classes.stageTitle}>
                4️⃣ Controles Operacionais
              </Typography>
              <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 8 }}>
                Intervenção Humana:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <PauseIcon style={{ color: '#ff9800', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Atendente pode pausar PEPE"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <PersonIcon style={{ color: '#2196f3', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Atendente pode assumir controle"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <WarningIcon style={{ color: '#f44336', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="PEPE transfere quando não consegue"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </div>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" className={classes.subtitle}>
          🔄 Fluxo de Dados
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card style={{ 
              backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5', 
              border: `1px solid ${theme.palette.primary.main}` 
            }}>
              <CardContent>
                <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
                  Sequência de Treinamento
                </Typography>
                {trainingSequence.map((step, index) => (
                  <div key={index} className={classes.sequenceStep}>
                    <div className={classes.stepNumber}>{index + 1}</div>
                    <Typography variant="body2">{step}</Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card style={{ 
              backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5', 
              border: '1px solid #4caf50' 
            }}>
              <CardContent>
                <Typography variant="h6" style={{ color: '#4caf50', marginBottom: 16 }}>
                  Sequência de Atendimento
                </Typography>
                {attendanceSequence.map((step, index) => (
                  <div key={index} className={classes.sequenceStep}>
                    <div className={classes.stepNumber}>{index + 1}</div>
                    <Typography variant="body2">{step}</Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" className={classes.subtitle}>
          🎯 Pontos de Decisão Críticos
        </Typography>

        <Grid container spacing={2}>
          {decisionPoints.map((point, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card style={{ 
                backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5', 
                border: `1px solid ${theme.palette.divider}` 
              }}>
                <CardContent>
                  <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
                    {point.title}
                  </Typography>
                  <CodeBlock code={point.code} language="javascript" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" className={classes.subtitle}>
          📊 Estados do Sistema
        </Typography>

        <Grid container spacing={2}>
          {systemStates.map((state, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <div className={classes.stateItem}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h4" style={{ marginRight: 16 }}>
                    {state.icon}
                  </Typography>
                  <Typography variant="h6" style={{ color: theme.palette.text.primary }}>
                    {state.title}
                  </Typography>
                </Box>
                <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>
                  {state.description}
                </Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Typography variant="h5" className={classes.subtitle}>
          📋 Checklist de Implementação
        </Typography>

        <Grid container spacing={3}>
          {checklistItems.map((section, index) => (
            <Grid item xs={12} md={6} key={index}>
              <div className={classes.checklistSection}>
                <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
                  ✅ {section.category}
                </Typography>
                <List dense>
                  {section.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex}>
                      <ListItemIcon style={{ minWidth: 32 }}>
                        <CheckIcon style={{ color: '#4caf50', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </div>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" className={classes.subtitle}>
          🗂️ Estrutura de Arquivos
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
              Backend:
            </Typography>
            <div className={classes.fileStructure}>
              {fileStructure.backend.map((file, index) => (
                <Typography key={index} variant="body2" style={{ 
                  fontFamily: 'monospace', 
                  color: theme.palette.text.primary,
                  marginBottom: 4
                }}>
                  {file}
                </Typography>
              ))}
            </div>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
              Frontend:
            </Typography>
            <div className={classes.fileStructure}>
              {fileStructure.frontend.map((file, index) => (
                <Typography key={index} variant="body2" style={{ 
                  fontFamily: 'monospace', 
                  color: theme.palette.text.primary,
                  marginBottom: 4
                }}>
                  {file}
                </Typography>
              ))}
            </div>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
              Database:
            </Typography>
            <div className={classes.fileStructure}>
              {fileStructure.database.map((file, index) => (
                <Typography key={index} variant="body2" style={{ 
                  fontFamily: 'monospace', 
                  color: theme.palette.text.primary,
                  marginBottom: 4
                }}>
                  {file}
                </Typography>
              ))}
            </div>
          </Grid>
        </Grid>
      </TabPanel>
    </div>
  );
};

export default FlowchartSection;