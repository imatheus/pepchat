import React, { useState, useEffect } from "react";
import {

  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid
} from "@material-ui/core";
import ToggleSwitch from "../ToggleSwitch";

import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: "flex",
    marginTop: theme.spacing(2),
    "& > button": {
      marginRight: theme.spacing(2),
    },
    "& > button:last-child": {
      marginRight: 0,
    },
  },
  statusCard: {
    marginTop: theme.spacing(2),
  },
  successText: {
    color: theme.palette.success.main,
  },
  errorText: {
    color: theme.palette.error.main,
  },
  infoBox: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
}));

const AsaasManager = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
    
  const [config, setConfig] = useState({
    apiKey: "",
    webhookUrl: "",
     webhookToken: "",
    environment: "sandbox",
    enabled: true,
  });

  const [originalConfig, setOriginalConfig] = useState({});

  useEffect(() => {
    fetchAsaasConfig();
  }, []);

  const fetchAsaasConfig = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/asaas");
      
      // Garantir que os valores booleanos sejam tratados corretamente
      const configData = {
        ...data,
        enabled: Boolean(data.enabled),
        webhookUrl: data.webhookUrl || "",
        webhookToken: data.webhookToken || "",
        apiKey: data.apiKey || "",
        environment: data.environment || "sandbox"
      };
      
      setConfig(configData);
      setOriginalConfig(configData);
    } catch (error) {
      console.error("Erro ao buscar configuração do Asaas:", error);
      toast.error("Erro ao carregar configurações do Asaas");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Preparar payload
      const payload = {
        enabled: Boolean(config.enabled),
        environment: config.environment,
        webhookUrl: config.webhookUrl || "",
        webhookToken: config.webhookToken || ""
      };

      // Só incluir API Key se não for mascarada ou se for uma nova
      const isApiKeyMasked = config.apiKey && config.apiKey.includes('...');
      if (!isApiKeyMasked && config.apiKey) {
        payload.apiKey = config.apiKey;
      } else if (!isApiKeyMasked && !config.apiKey && !originalConfig.apiKey) {
        toast.error("Chave de API é obrigatória");
        return;
      }

      // Determinar método baseado na existência de configuração
      const hasExistingConfig = originalConfig && (originalConfig.apiKey || originalConfig.id);
      const method = hasExistingConfig ? "put" : "post";
      
      console.log("Enviando payload:", payload);
      
      const { data } = await api[method]("/asaas", payload);
      
      // Atualizar estado com resposta do servidor
      const updatedConfig = {
        ...config,
        ...data.config,
        enabled: Boolean(data.config.enabled)
      };
      
      setConfig(updatedConfig);
      setOriginalConfig(updatedConfig);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error(error.response?.data?.error || "Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      await api.post("/asaas/test");
      toast.success("Conexão testada com sucesso!");
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast.error(error.response?.data?.error || "Erro ao testar conexão");
    } finally {
      setTestingConnection(false);
    }
  };

  
  
  if (loading && !config.apiKey) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.paper}>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ToggleSwitch
              checked={config.enabled}
              onChange={(e) => handleInputChange("enabled", e.target.checked)}
              label="Integração Ativa"
            />
          </Grid>

          {config.enabled && (
            <>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Chave de API do Asaas"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => handleInputChange("apiKey", e.target.value)}
                  className={classes.formField}
                  placeholder={config.hasApiKey ? "Digite uma nova API Key para alterar" : "Insira sua chave de API"}
                  helperText={config.apiKey === '***' ? "API Key já configurada. Digite uma nova para alterar ou mantenha as bolinhas para não alterar." : "Sua chave de API do Asaas (encontrada no painel do Asaas)"}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth className={classes.formField}>
                  <InputLabel>Ambiente</InputLabel>
                  <Select
                    value={config.environment}
                    onChange={(e) => handleInputChange("environment", e.target.value)}
                  >
                    <MenuItem value="sandbox">Sandbox (Teste)</MenuItem>
                    <MenuItem value="production">Produção</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="URL do Webhook"
                  value={config.webhookUrl}
                  onChange={(e) => handleInputChange("webhookUrl", e.target.value)}
                  className={classes.formField}
                  helperText="URL que receberá as notificações do Asaas (opcional)"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Token do Webhook"
                  value={config.webhookToken}
                  onChange={(e) => handleInputChange("webhookToken", e.target.value)}
                  className={classes.formField}
                  helperText="Token de segurança para validar webhooks"
                  placeholder="Ex: meu_token_seguro_123"
                />
              </Grid>
            </>
          )}
        </Grid>

        {config.enabled && (
          <Box className={classes.buttonContainer}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Salvar Configurações"}
            </Button>

            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testingConnection || (!config.apiKey && !config.hasApiKey)}
            >
              {testingConnection ? <CircularProgress size={24} /> : "Testar Conexão"}
            </Button>
          </Box>
        )}
      </div>
      
    </div>
  );
};

export default AsaasManager;