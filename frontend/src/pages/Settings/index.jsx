import React, { useState, useEffect } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import Button from "@material-ui/core/Button";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import { toast } from "react-toastify";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";
import notificationSound from "../../utils/notificationSound";
import notificationAudio from "../../assets/notification.mp3";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(4),
  },

  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
  },

  settingOption: {
    marginLeft: "auto",
  },
  margin: {
    margin: theme.spacing(1),
  },
}));

const Settings = () => {
  const classes = useStyles();

  const [settings, setSettings] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/settings");
        setSettings(data);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-settings`, (data) => {
      if (data.action === "update") {
        setSettings((prevState) => {
          const aux = [...prevState];
          const settingIndex = aux.findIndex((s) => s.key === data.setting.key);
          aux[settingIndex].value = data.setting.value;
          return aux;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleChangeSetting = async (e) => {
    const selectedValue = e.target.value;
    const settingKey = e.target.name;

    try {
      await api.put(`/settings/${settingKey}`, {
        value: selectedValue,
      });
      toast.success(i18n.t("settings.success"));
    } catch (err) {
      toastError(err);
    }
  };

  const getSettingValue = (key) => {
    const { value } = settings.find((s) => s.key === key);
    return value;
  };

  const testNotificationSound = async () => {
    try {
      console.log('Iniciando teste de som...');
      
      // Teste direto primeiro
      const paths = [
        notificationAudio, // Arquivo importado
        '/notification.mp3',
        './notification.mp3',
        '/static/media/notification.mp3'
      ];
      
      let success = false;
      
      for (const path of paths) {
        try {
          console.log('Testando caminho:', path);
          const audio = new Audio(path);
          audio.volume = 0.5;
          
          await audio.play();
          console.log('Sucesso com caminho:', path);
          toast.success('Som de notificação reproduzido com sucesso!');
          success = true;
          break;
        } catch (error) {
          console.warn('Falha com caminho:', path, error.message);
          continue;
        }
      }
      
      if (!success) {
        // Tentar com o utilitário
        await notificationSound.test();
        toast.success('Som de notificação reproduzido com sucesso!');
      }
    } catch (error) {
      console.error('Erro no teste de som:', error);
      toast.error('Erro ao reproduzir som: ' + error.message);
    }
  };

  return (
    <div className={classes.root}>
      <Container className={classes.container} maxWidth="sm">
        <Typography variant="body2" gutterBottom>
          {i18n.t("settings.title")}
        </Typography>
        
        <Paper className={classes.paper} style={{ marginBottom: 16 }}>
          <Typography variant="body1">
            Teste de Som de Notificação
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<VolumeUpIcon />}
            onClick={testNotificationSound}
            className={classes.settingOption}
          >
            Testar Som
          </Button>
        </Paper>
        
        <Paper className={classes.paper}>
          <Typography variant="body1">
            {i18n.t("settings.settings.userCreation.name")}
          </Typography>
          <Select
            margin="dense"
            variant="outlined"
            native
            id="userCreation-setting"
            name="userCreation"
            value={
              settings && settings.length > 0 && getSettingValue("userCreation")
            }
            className={classes.settingOption}
            onChange={handleChangeSetting}
          >
            <option value="enabled">
              {i18n.t("settings.settings.userCreation.options.enabled")}
            </option>
            <option value="disabled">
              {i18n.t("settings.settings.userCreation.options.disabled")}
            </option>
          </Select>
        </Paper>
      </Container>
    </div>
  );
};

export default Settings;
