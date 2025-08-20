import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import useSettings from "../../hooks/useSettings";
import ToggleSwitch from "../ToggleSwitch";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  optionItem: {
    marginBottom: theme.spacing(3),
  },
  optionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  titleText: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: theme.palette.text.primary,
  },
  helpIcon: {
    color: theme.palette.text.secondary,
    fontSize: '1.1rem',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
}));

export default function Options(props) {
  const { settings } = props;
  const classes = useStyles();
  const [userRating, setUserRating] = useState(false);
  const [callType, setCallType] = useState(true);
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState(true);
  const [chatbotAutoMode, setChatbotAutoMode] = useState(true);
  const [ticketsView, setTicketsView] = useState("classic");
  const [signAllMessages, setSignAllMessages] = useState(false);
  const [loadingSignAll, setLoadingSignAll] = useState(false);

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotAutoMode, setLoadingChatbotAutoMode] = useState(false);
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);
  const [loadingTicketsView, setLoadingTicketsView] = useState(false);

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value === "enabled");
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value === "enabled");
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value === "enabled");
      }
      const chatbotAutoMode = settings.find((s) => s.key === "chatbotAutoMode");
      if (chatbotAutoMode) {
        setChatbotAutoMode(chatbotAutoMode.value === "enabled");
      }
      const signSetting = settings.find((s) => s.key === "signAllMessages");
      if (signSetting) {
        const enabled = signSetting.value === "enabled";
        setSignAllMessages(enabled);
        // refletir no localStorage para uso imediato no envio
        localStorage.setItem("signOption", String(enabled));
      }
      const ticketsViewSetting = settings.find((s) => s.key === "ticketsView");
      if (ticketsViewSetting && ticketsViewSetting.value) {
        setTicketsView(ticketsViewSetting.value);
      } else {
        setTicketsView("classic");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(checked) {
    setUserRating(checked);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value: checked ? "enabled" : "disabled",
    });
    toast.success("Configuração de avaliações atualizada com sucesso.");
    setLoadingUserRating(false);
  }

  async function handleCallType(checked) {
    setCallType(checked);
    setLoadingCallType(true);
    await update({
      key: "call",
      value: checked ? "enabled" : "disabled",
    });
    toast.success("Configuração de chamadas atualizada com sucesso.");
    setLoadingCallType(false);
  }

  async function handleGroupType(checked) {
    setCheckMsgIsGroupType(checked);
    setLoadingGroupMessages(true);
    await update({
      key: "CheckMsgIsGroup",
      value: checked ? "enabled" : "disabled",
    });
    
    const message = checked 
      ? "Mensagens de grupos serão processadas normalmente." 
      : "Mensagens de grupos serão ignoradas a partir de agora.";
    
    toast.success(message);
    setLoadingGroupMessages(false);
  }

  async function handleChatbotAutoMode(checked) {
    setChatbotAutoMode(checked);
    setLoadingChatbotAutoMode(true);
    await update({
      key: "chatbotAutoMode",
      value: checked ? "enabled" : "disabled",
    });
    toast.success("Configuração do chatbot atualizada com sucesso.");
    setLoadingChatbotAutoMode(false);
  }

  async function handleSignAll(checked) {
    setSignAllMessages(checked);
    setLoadingSignAll(true);
    await update({ key: "signAllMessages", value: checked ? "enabled" : "disabled" });
    localStorage.setItem("signOption", String(checked));
    toast.success("Assinatura global de atendimentos atualizada com sucesso.");
    setLoadingSignAll(false);
  }

  async function handleTicketsViewChange(value) {
    setTicketsView(value);
    setLoadingTicketsView(true);
    await update({
      key: "ticketsView",
      value,
    });
    toast.success("Visualização de tickets atualizada com sucesso.");
    setLoadingTicketsView(false);
  }

  const optionsConfig = [
    {
      key: 'userRating',
      title: 'Avaliações',
      tooltip: 'Permite que clientes avaliem o atendimento recebido ao final da conversa. As avaliações ajudam a medir a qualidade do suporte.',
      checked: userRating,
      loading: loadingUserRating,
      onChange: handleChangeUserRating,
    },
    {
      key: 'groupMessages',
      title: 'Mensagens de Grupos',
      tooltip: 'Controla se o sistema deve processar mensagens vindas de grupos do WhatsApp. Quando habilitado, o sistema responderá a mensagens de grupos.',
      checked: CheckMsgIsGroup,
      loading: loadingGroupMessages,
      onChange: handleGroupType,
    },
    {
      key: 'callType',
      title: 'Chamadas de Voz',
      tooltip: 'Define se o sistema deve aceitar chamadas de voz. Quando habilitado, chamadas recebidas criarão tickets automaticamente.',
      checked: callType,
      loading: loadingCallType,
      onChange: handleCallType,
    },
    {
      key: 'signAllMessages',
      title: 'Assinar Atendimentos',
      tooltip: 'Quando habilitado, todos os atendentes terão suas mensagens assinadas com o nome do usuário automaticamente.',
      checked: signAllMessages,
      loading: loadingSignAll,
      onChange: handleSignAll,
    },
    {
      key: 'chatbotAutoMode',
      title: 'ChatBot',
      tooltip: 'Quando habilitado, novos contatos passam automaticamente pelo chatbot antes de serem direcionados para atendentes.',
      checked: chatbotAutoMode,
      loading: loadingChatbotAutoMode,
      onChange: handleChatbotAutoMode,
    },
  ];

  return (
    <Box className={classes.container}>
      <Grid container spacing={3}>
        {/* Campo: Visualização de Tickets */}
        <Grid key="ticketsView" xs={12} sm={6} md={6} lg={4} item>
          <Box className={classes.optionItem}>
            <Box className={classes.optionTitle}>
              <Typography className={classes.titleText}>
                Visualização
              </Typography>
              <Tooltip title={"Define a visualização dos tickets."} arrow placement="top">
                <IconButton size="small">
                  <HelpOutlineIcon className={classes.helpIcon} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box className={classes.toggleContainer}>
              <FormControl variant="outlined" size="small" style={{ minWidth: 180 }}>
                <Select
                  value={ticketsView}
                  onChange={(e) => handleTicketsViewChange(e.target.value)}
                  disabled={loadingTicketsView}
                >
                  <MenuItem value="classic">Clássica (padrão atual)</MenuItem>
                  <MenuItem value="new">Nova</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Grid>

        {/* Opções com Toggle */}
        {optionsConfig.map((option) => (
          <Grid key={option.key} xs={12} sm={6} md={6} lg={4} item>
            <Box className={classes.optionItem}>
              <Box className={classes.optionTitle}>
                <Typography className={classes.titleText}>
                  {option.title}
                </Typography>
                <Tooltip title={option.tooltip} arrow placement="top">
                  <IconButton size="small">
                    <HelpOutlineIcon className={classes.helpIcon} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box className={classes.toggleContainer}>
                <ToggleSwitch
                  checked={option.checked}
                  onChange={(e) => option.onChange(e.target.checked)}
                  disabled={option.loading}
                  variant="standard"
                />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}