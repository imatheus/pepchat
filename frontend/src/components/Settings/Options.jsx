import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import useSettings from "../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";

//import 'react-toastify/dist/ReactToastify.css';
 
const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    background: "#f2f5f3",
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: "#128c7e"
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }


  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
}));

export default function Options(props) {
  const { settings } = props;
  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [callType, setCallType] = useState("enabled");
  const [chatbotType, setChatbotType] = useState("");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");
  const [chatbotAutoMode, setChatbotAutoMode] = useState("enabled");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingChatbotAutoMode, setLoadingChatbotAutoMode] = useState(false);
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);

  
  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }
      const chatbotType = settings.find((s) => s.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType.value);
      }
      const chatbotAutoMode = settings.find((s) => s.key === "chatbotAutoMode");
      if (chatbotAutoMode) {
        setChatbotAutoMode(chatbotAutoMode.value);
      }

          }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    toast.success("Configuração de avaliações atualizada com sucesso.");
    setLoadingUserRating(false);
  }

  async function handleCallType(value) {
    setCallType(value);
    setLoadingCallType(true);
    await update({
      key: "call",
      value,
    });
    toast.success("Configuração de chamadas atualizada com sucesso.");
    setLoadingCallType(false);
  }

  async function handleChatbotType(value) {
    setChatbotType(value);
    setLoadingChatbotType(true);
    await update({
      key: "chatBotType",
      value,
    });
    toast.success("Tipo de chatbot atualizado com sucesso.");
    setLoadingChatbotType(false);
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    setLoadingGroupMessages(true);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    
    const message = value === "enabled" 
      ? "Mensagens de grupos serão ignoradas a partir de agora." 
      : "Mensagens de grupos serão processadas normalmente.";
    
    toast.success(message);
    setLoadingGroupMessages(false);
  }

  async function handleChatbotAutoMode(value) {
    setChatbotAutoMode(value);
    setLoadingChatbotAutoMode(true);
    await update({
      key: "chatbotAutoMode",
      value,
    });
    toast.success("Modo automático do chatbot atualizado com sucesso.");
    setLoadingChatbotAutoMode(false);
  }

    return (
    <>
      <Grid spacing={3} container>
        {/* <Grid xs={12} item>
                    <Title>Configurações Gerais</Title>
                </Grid> */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="ratings-label">Avaliações de Atendimento</InputLabel>
            <Select
              labelId="ratings-label"
              value={userRating}
              onChange={async (e) => {
                handleChangeUserRating(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitadas</MenuItem>
              <MenuItem value={"enabled"}>Habilitadas</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserRating ? "Atualizando..." : "Permite que clientes avaliem o atendimento"}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="group-type-label">
              Mensagens de Grupos
            </InputLabel>
            <Select
              labelId="group-type-label"
              value={CheckMsgIsGroup}
              onChange={async (e) => {
                handleGroupType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Processar mensagens de grupos</MenuItem>
              <MenuItem value={"enabled"}>Ignorar mensagens de grupos</MenuItem>
            </Select>
            <FormHelperText>
              {loadingGroupMessages ? "Atualizando..." : "Controle se o sistema deve processar mensagens vindas de grupos do WhatsApp"}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="call-type-label">
              Chamadas de Voz
            </InputLabel>
            <Select
              labelId="call-type-label"
              value={callType}
              onChange={async (e) => {
                handleCallType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Não aceitar chamadas</MenuItem>
              <MenuItem value={"enabled"}>Aceitar chamadas</MenuItem>
            </Select>
            <FormHelperText>
              {loadingCallType ? "Atualizando..." : "Define se o sistema deve aceitar chamadas de voz"}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="chatbot-type-label">
              Tipo de Interface do Chatbot
            </InputLabel>
            <Select
              labelId="chatbot-type-label"
              value={chatbotType}
              onChange={async (e) => {
                handleChatbotType(e.target.value);
              }}
            >
              <MenuItem value={"text"}>Texto simples</MenuItem>
              <MenuItem value={"button"}>Botões interativos</MenuItem>
              <MenuItem value={"list"}>Lista de opções</MenuItem>
            </Select>
            <FormHelperText>
              {loadingChatbotType ? "Atualizando..." : "Escolha como as opções do chatbot serão apresentadas"}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="chatbot-auto-mode-label">
              Modo Automático do Chatbot
            </InputLabel>
            <Select
              labelId="chatbot-auto-mode-label"
              value={chatbotAutoMode}
              onChange={async (e) => {
                handleChatbotAutoMode(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingChatbotAutoMode ? "Atualizando..." : "Quando desabilitado, novos contatos não passam pelo chatbot automático"}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
          </>
  );
}