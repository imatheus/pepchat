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
  Alert,
  Divider,
  Button,
  useTheme
} from '@material-ui/core';
import {
  ExpandMore as ExpandMoreIcon,
  School as TrainingIcon,
  SmartToy as RobotIcon,
  Storage as DatabaseIcon,
  Code as CodeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
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
  card: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    height: '100%'
  },
  cardContent: {
    color: theme.palette.text.primary
  },
  cardTitle: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  highlight: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  warningBox: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d1810' : '#fff3e0',
    border: '1px solid #ff9800',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  successBox: {
    backgroundColor: theme.palette.type === 'dark' ? '#1b2e1b' : '#e8f5e8',
    border: '1px solid #4caf50',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },
  stepContent: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(1)
  },
  flowStep: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    textAlign: 'center'
  },
  flowArrow: {
    textAlign: 'center',
    color: theme.palette.primary.main,
    fontSize: '2rem',
    margin: theme.spacing(1, 0)
  },
  accordion: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    backgroundColor: theme.palette.type === 'dark' ? '#333333' : '#e0e0e0',
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  costItem: {
    backgroundColor: theme.palette.type === 'dark' ? '#2d2d2d' : '#f5f5f5',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  costTotal: {
    backgroundColor: theme.palette.type === 'dark' 
      ? 'linear-gradient(135deg, #2d2d2d, #3a3a3a)'
      : 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    textAlign: 'center'
  }
}));

const TrainingSection = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const [activeStep, setActiveStep] = useState(0);

  const trainingSteps = [
    {
      label: 'Usuário acessa "Minhas Conexões"',
      description: 'Na tela principal, o usuário vê a lista de conexões WhatsApp'
    },
    {
      label: 'Clica no botão "Treinar IA"',
      description: 'Botão aparece ao lado de cada conexão (se plano permite)'
    },
    {
      label: 'Preenche formulário simples',
      description: 'Modal abre com campos básicos da empresa'
    },
    {
      label: 'Clica "Treinar/Concluir"',
      description: 'Sistema processa e ativa PEPE automaticamente'
    },
    {
      label: 'PEPE está ativo',
      description: 'Botão muda para "IA Ativa ✅" e PEPE começa a atender'
    }
  ];

  const formFields = [
    { name: 'Nome da Empresa', required: true, type: 'text' },
    { name: 'Tipo de Negócio', required: true, type: 'dropdown' },
    { name: 'Descrição dos Produtos/Serviços', required: true, type: 'textarea' },
    { name: 'Horário de Funcionamento', required: false, type: 'text' },
    { name: 'Telefone/WhatsApp', required: false, type: 'text' },
    { name: 'Endereço', required: false, type: 'text' },
    { name: 'Site da Empresa', required: false, type: 'url' }
  ];

  const businessTypes = [
    'Loja/Varejo',
    'Restaurante/Food',
    'Oficina/Automotivo',
    'Beleza/Estética',
    'Clínica/Saúde',
    'Serviços Gerais',
    'Outros'
  ];

  const modalCode = `const SimpleTrainingModal = ({ connectionId, connectionName, onClose }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    description: '',
    workingHours: '',
    phone: '',
    address: '',
    websiteUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!formData.companyName || !formData.businessType || !formData.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Salva e ativa PEPE automaticamente
      await api.post(\`/ai-training/simple/\${connectionId}\`, formData);
      
      toast.success('PEPE ativado com sucesso!');
      onClose();
      
      // Atualiza lista de conexões
      window.location.reload();
      
    } catch (error) {
      toast.error('Erro ao ativar PEPE');
    }
  };

  return (
    <Modal open onClose={onClose} maxWidth="md">
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          🎓 Treinar IA - {connectionName}
        </DialogTitle>
        
        <DialogContent>
          <TextField
            label="Nome da Empresa *"
            fullWidth
            margin="normal"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            required
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Tipo de Negócio *</InputLabel>
            <Select
              value={formData.businessType}
              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
            >
              {businessTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Outros campos... */}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Treinar/Concluir
          </Button>
        </DialogActions>
      </form>
    </Modal>
  );
};`;

  const backendCode = `// Rota para treinamento simplificado
router.post('/ai-training/simple/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;
    const trainingData = req.body;

    // Validação
    if (!trainingData.companyName || !trainingData.businessType || !trainingData.description) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    // Salva dados de treinamento
    const training = await AITrainingSimple.create({
      whatsapp_id: connectionId,
      company_id: companyId,
      ...trainingData
    });

    // Gera embeddings automaticamente
    await embeddingService.processTrainingData(training.id);

    // Ativa PEPE para essa conexão
    await WhatsApp.update(
      { ai_enabled: true, ai_training_id: training.id },
      { where: { id: connectionId, companyId } }
    );

    res.json({ 
      success: true, 
      message: 'PEPE ativado com sucesso!',
      trainingId: training.id 
    });

  } catch (error) {
    console.error('Erro no treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});`;

  const databaseSchema = `-- Tabela simplificada para treinamento
CREATE TABLE ai_training_simple (
  id SERIAL PRIMARY KEY,
  whatsapp_id INTEGER REFERENCES whatsapps(id),
  company_id INTEGER REFERENCES companies(id),
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  working_hours VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de embeddings locais
CREATE TABLE ai_embeddings_local (
  id SERIAL PRIMARY KEY,
  training_id INTEGER REFERENCES ai_training_simple(id),
  content_text TEXT NOT NULL,
  embedding VECTOR(384), -- Modelo local
  content_type VARCHAR(50), -- 'company_info', 'description', 'contact'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_training_whatsapp ON ai_training_simple(whatsapp_id);
CREATE INDEX idx_ai_embeddings_vector ON ai_embeddings_local 
USING ivfflat (embedding vector_cosine_ops);`;

  const envVars = `# DeepSeek API (100% Gratuito)
DEEPSEEK_API_KEY=your_free_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# IA Configuration
AI_ENABLED=true
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=150

# Vector Database (PostgreSQL Local)
PGVECTOR_ENABLED=true
EMBEDDING_MODEL=local
EMBEDDING_DIMENSIONS=384`;

  return (
    <div className={classes.section}>
      <Typography variant="h4" className={classes.title}>
        <TrainingIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
        Treinamento do Agente IA
      </Typography>

      <div className={classes.warningBox}>
        <Typography variant="h6" style={{ color: '#ff9800', marginBottom: 16 }}>
          🚨 ESPECIFICAÇÃO SIMPLIFICADA
        </Typography>
        <Typography variant="body2">
          O treinamento foi simplificado para máxima facilidade de uso. O usuário apenas 
          preenche informações básicas da empresa e o PEPE é ativado automaticamente.
        </Typography>
      </div>

      <Typography variant="h5" className={classes.subtitle}>
        📍 Localização: Botão "Treinar IA" em "Minhas Conexões"
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                ✅ Se Plano Permite IA
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon style={{ color: '#4caf50' }}>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Botão 'Treinar IA' visível e ativo" />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ color: '#4caf50' }}>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Abre modal de treinamento ao clicar" />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ color: '#4caf50' }}>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Salva dados específicos por conexão" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                ❌ Se Plano Não Permite IA
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon style={{ color: '#f44336' }}>
                    <WarningIcon />
                  </ListItemIcon>
                  <ListItemText primary="Botão não aparece ou aparece desabilitado" />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ color: '#f44336' }}>
                    <WarningIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tooltip: 'Upgrade seu plano para usar IA'" />
                </ListItem>
                <ListItem>
                  <ListItemIcon style={{ color: '#f44336' }}>
                    <WarningIcon />
                  </ListItemIcon>
                  <ListItemText primary="Redireciona para página de upgrade" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        📋 Formulário Único - Informações da Empresa
      </Typography>

      <Grid container spacing={2}>
        {formFields.map((field, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Typography variant="h6" style={{ fontSize: '1rem' }}>
                  {field.name}
                  {field.required && <span style={{ color: '#f44336' }}> *</span>}
                </Typography>
                <Typography variant="caption" style={{ color: '#b0b0b0' }}>
                  {field.type === 'dropdown' ? 'Seleção' : 
                   field.type === 'textarea' ? 'Texto longo' :
                   field.type === 'url' ? 'URL' : 'Texto'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        🔄 Fluxo Simplificado de Uso
      </Typography>

      <Box>
        <Stepper activeStep={activeStep} orientation="vertical">
          {trainingSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel
                onClick={() => setActiveStep(index)}
                style={{ cursor: 'pointer' }}
              >
                <Typography style={{ color: theme.palette.text.primary }}>
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <div className={classes.stepContent}>
                  <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>
                    {step.description}
                  </Typography>
                </div>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Typography variant="h5" className={classes.subtitle}>
        🎯 Estado do Botão Após Treinamento
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <div className={classes.flowStep}>
            <Typography variant="h6" style={{ color: theme.palette.primary.main }}>
              Antes do Treinamento
            </Typography>
            <Box mt={2}>
              <Button variant="outlined" style={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}>
                🎓 Treinar IA
              </Button>
            </Box>
          </div>
        </Grid>
        <Grid item xs={12} md={6}>
          <div className={classes.flowStep}>
            <Typography variant="h6" style={{ color: '#4caf50' }}>
              Após o Treinamento
            </Typography>
            <Box mt={2}>
              <Button variant="contained" style={{ backgroundColor: '#4caf50', color: '#ffffff' }}>
                ✅ IA Ativa
              </Button>
            </Box>
          </div>
        </Grid>
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        💻 Implementação Técnica
      </Typography>

      <Accordion className={classes.accordion}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon style={{ color: theme.palette.primary.main }} />}
          className={classes.accordionSummary}
        >
          <Typography variant="h6">Frontend - Modal de Treinamento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box width="100%">
            <CodeBlock code={modalCode} language="javascript" title="TrainingModal.jsx" />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon style={{ color: theme.palette.primary.main }} />}
          className={classes.accordionSummary}
        >
          <Typography variant="h6">Backend - API de Treinamento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box width="100%">
            <CodeBlock code={backendCode} language="javascript" title="aiTrainingRoutes.js" />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion className={classes.accordion}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon style={{ color: theme.palette.primary.main }} />}
          className={classes.accordionSummary}
        >
          <Typography variant="h6">Banco de Dados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box width="100%">
            <CodeBlock code={databaseSchema} language="sql" title="Database Schema" />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Typography variant="h5" className={classes.subtitle}>
        🔧 Especificações Técnicas
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                <RobotIcon style={{ marginRight: 8 }} />
                API de IA - DeepSeek
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Modelo: deepseek-chat"
                    secondary="100% gratuito"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Temperature: 0.7"
                    secondary="Configuração fixa"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Max Tokens: 150"
                    secondary="Respostas concisas"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                <DatabaseIcon style={{ marginRight: 8 }} />
                Banco Vetorial Local
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="PostgreSQL + pgvector"
                    secondary="Sem custos externos"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Modelo: all-MiniLM-L6-v2"
                    secondary="384 dimensões"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Embeddings locais"
                    secondary="Processamento interno"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" className={classes.subtitle}>
        📊 Variáveis de Ambiente
      </Typography>

      <CodeBlock code={envVars} language="bash" title=".env" />

      <Typography variant="h5" className={classes.subtitle}>
        💰 Custos (100% Gratuito)
      </Typography>

      <div className={classes.successBox}>
        <Typography variant="h6" style={{ color: '#4caf50', marginBottom: 16 }}>
          💚 Custo Zero Garantido
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>DeepSeek API:</strong> Gratuito
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Embeddings:</strong> Processamento local
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Banco Vetorial:</strong> PostgreSQL existente
            </Typography>
          </Grid>
        </Grid>
      </div>

      <Typography variant="h5" className={classes.subtitle}>
        ❌ O que foi REMOVIDO (Simplificação)
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                🔧 Configurações Básicas
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="❌ Ativar/Desativar PEPE"
                    secondary="→ Ativação automática"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="❌ Seleção de modelo"
                    secondary="→ DeepSeek fixo"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="❌ Configuração de temperatura"
                    secondary="→ Padrão fixo (0.7)"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                📚 Treinamento Avançado
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="❌ Perguntas e respostas customizadas"
                    secondary="→ Apenas info da empresa"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="❌ Extração automática do site"
                    secondary="→ Apenas URL opcional"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Typography variant="h6" className={classes.cardTitle}>
                ⚙️ Controles Avançados
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="❌ Regras de transferência"
                    secondary="→ Regras padrão fixas"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="❌ Teste do agente"
                    secondary="→ Sem teste manual"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="❌ Monitoramento de uso"
                    secondary="→ Sem dashboard"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <div className={classes.highlight}>
        <Typography variant="h6" style={{ color: theme.palette.primary.main, marginBottom: 16 }}>
          🎯 Foco na Simplicidade
        </Typography>
        <Typography variant="body2">
          Esta abordagem torna o sistema <strong>extremamente simples</strong> de usar, 
          com <strong>custo zero</strong> (DeepSeek gratuito + banco próprio) e 
          <strong>ativação automática</strong> do PEPE após o treinamento básico.
        </Typography>
      </div>
    </div>
  );
};

export default TrainingSection;