import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Box,
  CircularProgress
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
    margin: theme.spacing(2, 0),
  },
  title: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
  },
  formGroup: {
    marginBottom: theme.spacing(2),
  },
  textField: {
    marginTop: theme.spacing(1),
  },
  saveButton: {
    marginTop: theme.spacing(2),
  },
  alert: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196f3',
    borderRadius: theme.spacing(1),
    color: '#1976d2',
  },
}));

const HistoryConfig = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enableHistorySync: true,
    historyDaysLimit: 7,
    preventMassMessages: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/history-config");
      setConfig(data);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações de histórico");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/history-config", config);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6" className={classes.title}>
        Configurações de Histórico do WhatsApp
      </Typography>

      <Box className={classes.alert}>
        <Typography variant="body2">
          <strong>Importante:</strong> Estas configurações ajudam a prevenir o envio em massa de mensagens 
          quando o servidor é reiniciado após conversas no WhatsApp Web.
        </Typography>
      </Box>

      <Box className={classes.formGroup}>
        <FormControlLabel
          control={
            <Switch
              checked={config.preventMassMessages}
              onChange={handleChange('preventMassMessages')}
              color="primary"
            />
          }
          label="Prevenir envio em massa de mensagens antigas"
        />
        <Typography variant="body2" color="textSecondary">
          Quando ativado, impede que mensagens antigas sejam processadas como novas após reinicialização do servidor.
        </Typography>
      </Box>

      <Box className={classes.formGroup}>
        <FormControlLabel
          control={
            <Switch
              checked={config.enableHistorySync}
              onChange={handleChange('enableHistorySync')}
              color="primary"
            />
          }
          label="Sincronizar histórico do WhatsApp"
        />
        <Typography variant="body2" color="textSecondary">
          Permite a sincronização do histórico de mensagens do WhatsApp.
        </Typography>
      </Box>

      <Box className={classes.formGroup}>
        <TextField
          label="Limite de dias para histórico"
          type="number"
          value={config.historyDaysLimit}
          onChange={handleChange('historyDaysLimit')}
          className={classes.textField}
          fullWidth
          inputProps={{ min: 1, max: 30 }}
          helperText="Mensagens mais antigas que este limite (em dias) serão ignoradas. Máximo: 30 dias."
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
        className={classes.saveButton}
      >
        {saving ? <CircularProgress size={24} /> : "Salvar Configurações"}
      </Button>
    </Paper>
  );
};

export default HistoryConfig;