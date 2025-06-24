import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  FileCopy as CopyIcon,
  Code as CodeIcon,
  Visibility as PreviewIcon,
  Settings as SettingsIcon,
} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    minWidth: 600,
    maxWidth: 800,
  },
  tabPanel: {
    padding: theme.spacing(2, 0),
  },
  codeBlock: {
    backgroundColor: "transparent",
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    fontFamily: "monospace",
    fontSize: "12px",
    maxHeight: "300px",
    overflow: "auto",
    position: "relative",
    border: "1px solid #ddd",
  },
  copyButton: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
  },
  previewContainer: {
    border: "1px solid #ddd",
    borderRadius: theme.shape.borderRadius,
    height: "400px",
    position: "relative",
    overflow: "hidden",
  },
  configSection: {
    marginBottom: theme.spacing(3),
  },
  colorPicker: {
    width: "100%",
    height: "40px",
    border: "none",
    borderRadius: theme.shape.borderRadius,
    cursor: "pointer",
  },
  instructionStep: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: "#f8f9fa",
    borderRadius: theme.shape.borderRadius,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webchat-tabpanel-${index}`}
      aria-labelledby={`webchat-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const WebChatModal = ({ open, onClose }) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState({
    name: "Chat Atendimento",
    welcomeMessage: "Olá! Como posso ajudá-lo?",
    primaryColor: "#1976d2",
    position: "bottom-right",
    companyName: "Minha Empresa",
  });
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateChatCode = () => {
    const chatId = `webchat_${Date.now()}`;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
    
    return `<!-- PepChat - Chat Web -->
<div id="${chatId}"></div>
<script>
(function() {
  // Configurações do Chat
  var chatConfig = {
    chatId: "${chatId}",
    apiUrl: "${backendUrl}",
    name: "${config.name}",
    welcomeMessage: "${config.welcomeMessage}",
    primaryColor: "${config.primaryColor}",
    position: "${config.position}",
    companyName: "${config.companyName}"
  };

  // Criar estrutura do chat
  var chatContainer = document.createElement('div');
  chatContainer.id = 'PepChat-chat-container';
  chatContainer.style.cssText = \`
    position: fixed;
    ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
    ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    width: 350px;
    height: 500px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    border-radius: 10px;
    overflow: hidden;
    background: white;
    display: none;
  \`;

  // Botão flutuante
  var chatButton = document.createElement('div');
  chatButton.id = 'PepChat-chat-button';
  chatButton.innerHTML = '💬';
  chatButton.style.cssText = \`
    position: fixed;
    ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
    ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    width: 60px;
    height: 60px;
    background: ${config.primaryColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10000;
    font-size: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  \`;

  // Header do chat
  var chatHeader = document.createElement('div');
  chatHeader.style.cssText = \`
    background: ${config.primaryColor};
    color: white;
    padding: 15px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  \`;
  chatHeader.innerHTML = \`
    <span>${config.companyName}</span>
    <span id="PepChat-chat-close" style="cursor: pointer; font-size: 18px;">&times;</span>
  \`;

  // Área de mensagens
  var chatMessages = document.createElement('div');
  chatMessages.id = 'PepChat-chat-messages';
  chatMessages.style.cssText = \`
    height: 350px;
    overflow-y: auto;
    padding: 15px;
    background: #f8f9fa;
  \`;

  // Mensagem de boas-vindas
  var welcomeMsg = document.createElement('div');
  welcomeMsg.style.cssText = \`
    background: white;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  \`;
  welcomeMsg.innerHTML = \`
    <strong>${config.companyName}</strong><br>
    ${config.welcomeMessage}
  \`;
  chatMessages.appendChild(welcomeMsg);

  // Área de input
  var chatInput = document.createElement('div');
  chatInput.style.cssText = \`
    padding: 15px;
    border-top: 1px solid #eee;
    display: flex;
    gap: 10px;
  \`;

  var messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.placeholder = 'Digite sua mensagem...';
  messageInput.style.cssText = \`
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 20px;
    outline: none;
  \`;

  var sendButton = document.createElement('button');
  sendButton.innerHTML = '➤';
  sendButton.style.cssText = \`
    background: ${config.primaryColor};
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 16px;
  \`;

  chatInput.appendChild(messageInput);
  chatInput.appendChild(sendButton);

  // Montar chat
  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(chatMessages);
  chatContainer.appendChild(chatInput);

  // Adicionar ao DOM
  document.body.appendChild(chatButton);
  document.body.appendChild(chatContainer);

  // Eventos
  chatButton.onclick = function() {
    chatContainer.style.display = 'block';
    chatButton.style.display = 'none';
  };

  document.getElementById('PepChat-chat-close').onclick = function() {
    chatContainer.style.display = 'none';
    chatButton.style.display = 'flex';
  };

  // Função para enviar mensagem
  function sendMessage() {
    var message = messageInput.value.trim();
    if (!message) return;

    // Adicionar mensagem do usuário
    var userMsg = document.createElement('div');
    userMsg.style.cssText = \`
      background: ${config.primaryColor};
      color: white;
      padding: 10px;
      border-radius: 10px;
      margin-bottom: 10px;
      margin-left: 50px;
      text-align: right;
    \`;
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);

    // Limpar input
    messageInput.value = '';

    // Scroll para baixo
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Enviar para API
    fetch(chatConfig.apiUrl + '/webchat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        chatId: chatConfig.chatId,
        companyName: chatConfig.companyName
      })
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      if (data.reply) {
        var botMsg = document.createElement('div');
        botMsg.style.cssText = \`
          background: white;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 10px;
          margin-right: 50px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        \`;
        botMsg.innerHTML = \`<strong>${config.companyName}:</strong><br>\` + data.reply;
        chatMessages.appendChild(botMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }).catch(function(error) {
      console.error('Erro ao enviar mensagem:', error);
    });
  }

  sendButton.onclick = sendMessage;
  messageInput.onkeypress = function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
})();
</script>
<!-- Fim PepChat - Chat Web -->`;
  };

  const handleCopyCode = () => {
    const code = generateChatCode();
    navigator.clipboard.writeText(code).then(() => {
      toast.success("Código copiado para a área de transferência!");
    }).catch(() => {
      toast.error("Erro ao copiar código");
    });
  };

  const handleCreateWebChat = async () => {
    setLoading(true);
    try {
      await api.post("/whatsapp/webchat/", {
        name: config.name,
        welcomeMessage: config.welcomeMessage,
        primaryColor: config.primaryColor,
        position: config.position,
        companyName: config.companyName,
        channel: "webchat",
        status: "CONNECTED"
      });
      
      toast.success("Chat Web criado com sucesso!");
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CodeIcon />
          Configurar Chat Web
        </Box>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<SettingsIcon />} label="Configurações" />
          <Tab icon={<CodeIcon />} label="Código HTML" />
          <Tab icon={<PreviewIcon />} label="Instruções" />
        </Tabs>

        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Box className={classes.configSection}>
            <Typography variant="h6" gutterBottom>
              Personalização do Chat
            </Typography>
            
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Nome do Chat"
                value={config.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                fullWidth
              />
              <TextField
                label="Nome da Empresa"
                value={config.companyName}
                onChange={(e) => handleConfigChange('companyName', e.target.value)}
                fullWidth
              />
            </Box>

            <TextField
              label="Mensagem de Boas-vindas"
              value={config.welcomeMessage}
              onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />

            <Box display="flex" gap={2} mt={2}>
              <Box flex={1}>
                <Typography variant="body2" gutterBottom>
                  Cor Principal
                </Typography>
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                  className={classes.colorPicker}
                />
              </Box>
              
              <FormControl flex={1} fullWidth>
                <InputLabel>Posição na Tela</InputLabel>
                <Select
                  value={config.position}
                  onChange={(e) => handleConfigChange('position', e.target.value)}
                >
                  <MenuItem value="bottom-right">Inferior Direita</MenuItem>
                  <MenuItem value="bottom-left">Inferior Esquerda</MenuItem>
                  <MenuItem value="top-right">Superior Direita</MenuItem>
                  <MenuItem value="top-left">Superior Esquerda</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <Typography variant="h6" gutterBottom>
            Código para Inserir no Site
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Copie o código abaixo e cole no HTML do seu site, preferencialmente antes da tag &lt;/body&gt;
          </Typography>
          
          <Paper className={classes.codeBlock}>
            <IconButton
              className={classes.copyButton}
              onClick={handleCopyCode}
              size="small"
            >
              <CopyIcon />
            </IconButton>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {generateChatCode()}
            </pre>
          </Paper>

          <Box mt={2}>
            <Chip 
              icon={<CopyIcon />} 
              label="Clique para Copiar Código" 
              onClick={handleCopyCode}
              color="primary"
              variant="outlined"
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <Typography variant="h6" gutterBottom>
            Como Instalar o Chat no seu Site
          </Typography>

          <Box className={classes.instructionStep}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Passo 1:</strong> Configure o Chat
            </Typography>
            <Typography variant="body2">
              Na aba "Configurações", personalize o nome, cores e mensagens do seu chat.
            </Typography>
          </Box>

          <Box className={classes.instructionStep}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Passo 2:</strong> Copie o Código
            </Typography>
            <Typography variant="body2">
              Vá na aba "Código HTML" e clique no botão para copiar o código completo.
            </Typography>
          </Box>

          <Box className={classes.instructionStep}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Passo 3:</strong> Cole no seu Site
            </Typography>
            <Typography variant="body2">
              Cole o código no HTML do seu site, preferencialmente antes da tag &lt;/body&gt;.
              O chat aparecerá automaticamente no canto da tela.
            </Typography>
          </Box>

          <Box className={classes.instructionStep}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Passo 4:</strong> Teste o Chat
            </Typography>
            <Typography variant="body2">
              Acesse seu site e teste o chat. As mensagens aparecerão automaticamente 
              na sua lista de tickets no sistema de atendimento.
            </Typography>
          </Box>

          <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
            <strong>Nota:</strong> O chat funciona em qualquer site HTML e é totalmente responsivo.
            Não requer jQuery ou outras dependências.
          </Typography>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleCreateWebChat}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Criando..." : "Criar Chat Web"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebChatModal;