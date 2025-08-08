import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import InputBase from "@material-ui/core/InputBase";
import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import MicIcon from "@material-ui/icons/Mic";
import { Menu, MenuItem, ListItemText, Divider, Popper, Paper, ClickAwayListener } from "@material-ui/core";


import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";

import useQuickMessages from "../../hooks/useQuickMessages";

import Compressor from 'compressorjs';
import LinearWithValueLabel from "./ProgressBarCustom";

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    background: theme.palette.background.default,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: `1px solid ${theme.palette.divider}`,
  },

  newMessageBox: {
    background: theme.palette.background.paper,
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },

  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.background.default : '#e9e9e9',
    display: "flex",
    borderRadius: 50,
    flex: 1,
    border: "1px solid #ffffffff",
    "&:focus-within": {
      outline: "none !important",
      boxShadow: "none !important",
    },
    "& *": {
      outline: "none !important",
      "&:focus": {
        outline: "none !important",
        boxShadow: "none !important",
      },
      "&:focus-visible": {
        outline: "none !important",
        boxShadow: "none !important",
      },
    },
  },

  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
    outline: "none !important",
    "&:focus": {
      outline: "none !important",
      border: "none !important",
      boxShadow: "none !important",
    },
    "&:focus-visible": {
      outline: "none !important",
      border: "none !important",
      boxShadow: "none !important",
    },
    "& input": {
      outline: "none !important",
      "&:focus": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
    },
  },

  sendMessageIcons: {
    color: "grey",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },

  attachFileIcon: {
    color: "grey",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },

  micIcon: {
    color: "#25d366",
    "&:hover": {
      color: "#128c7e",
    },
    cursor: "pointer",
  },

  micIconActive: {
    color: "#ff4444",
    animation: "$pulse 1.5s infinite",
    cursor: "pointer",
  },

  "@keyframes pulse": {
    "0%": {
      transform: "scale(1)",
    },
    "50%": {
      transform: "scale(1.1)",
    },
    "100%": {
      transform: "scale(1)",
    },
  },

  uploadInput: {
    display: "none",
  },

  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.palette.background.default,
    borderTop: `1px solid ${theme.palette.divider}`,
  },

  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
  },

  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },

  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7,
  },

  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  quickMessagesMenu: {
    maxHeight: 300,
    "& .MuiMenuItem-root": {
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
  },

  shortcodeChip: {
    backgroundColor: "transparent",
    borderRadius: "50px",
    padding: "4px 12px",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: theme.palette.text.secondary,
    display: "inline-block",
    marginBottom: "4px",
    border: `1px solid ${theme.palette.divider}`,
  },

  autocompletePopper: {
    zIndex: 1300,
    maxWidth: 350,
  },

  autocompletePaper: {
    maxHeight: 200,
    overflow: "auto",
    "& .MuiMenuItem-root": {
      whiteSpace: "normal",
      wordBreak: "break-word",
      padding: "8px 16px",
    },
  },
}));

const EmojiOptions = (props) => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={(e) => setShowEmoji((prevState) => !prevState)}
      >
        <MoodIcon className={classes.sendMessageIcons} />
      </IconButton>
      {showEmoji ? (
        <div className={classes.emojiBox}>
          <Picker
            perLine={16}
            showPreview={false}
            showSkinTones={false}
            onSelect={handleAddEmoji}
          />
        </div>
      ) : null}
    </>
  );
};

// SignSwitch removido - não utilizado

const QuickMessagesButton = (props) => {
  const { disabled, quickMessages, onSelectMessage } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectMessage = (message) => {
    onSelectMessage(message);
    handleClose();
  };

  return (
    <>
      <IconButton
        aria-label="quickMessages"
        component="span"
        disabled={disabled}
        onClick={handleClick}
      >
        <FlashOnIcon className={classes.sendMessageIcons} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        className={classes.quickMessagesMenu}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: '350px',
          },
        }}
      >
        {quickMessages.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="Nenhuma mensagem rápida cadastrada" />
          </MenuItem>
        ) : (
          quickMessages.map((message, index) => [
            <MenuItem key={`item-${index}`} onClick={() => handleSelectMessage(message)}>
              <ListItemText
                primary={
                  <div>
                    <span className={classes.shortcodeChip}>
                      {message.shortcode}
                    </span>
                  </div>
                }
                secondary={message.message.length > 50 ? `${message.message.substring(0, 50)}...` : message.message}
              />
            </MenuItem>,
            index < quickMessages.length - 1 && <Divider key={`divider-${index}`} />
          ]).flat().filter(Boolean)
        )}
      </Menu>
    </>
  );
};

const FileInput = (props) => {
  const { handleChangeMedias, disableOption } = props;
  const classes = useStyles();
  return (
    <>
      <input
        multiple
        type="file"
        id="upload-button"
        disabled={disableOption()}
        className={classes.uploadInput}
        onChange={handleChangeMedias}
        accept="*/*"
        title="Anexar qualquer tipo de arquivo"
      />
      <label htmlFor="upload-button">
        <IconButton
          aria-label="upload"
          component="span"
          disabled={disableOption()}
          title="Anexar arquivo"
        >
          <AttachFileIcon className={classes.sendMessageIcons} />
        </IconButton>
      </label>
    </>
  );
};

const ActionButtons = (props) => {
  const {
    inputMessage,
    loading,
    handleSendMessage,
    handleMicClick,
    isRecording,
    ticketStatus,
  } = props;
  const classes = useStyles();
  
  return (
    <>
      <IconButton
        aria-label="recordAudio"
        component="span"
        onClick={handleMicClick}
        disabled={loading || ticketStatus !== "open"}
      >
        <MicIcon 
          className={isRecording ? classes.micIconActive : classes.micIcon} 
        />
      </IconButton>
      {inputMessage && (
        <IconButton
          aria-label="sendMessage"
          component="span"
          onClick={handleSendMessage}
          disabled={loading}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      )}
    </>
  );
};

const CustomInput = (props) => {
  const {
    loading,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    disableOption,
    quickMessages,
  } = props;
  const classes = useStyles();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (inputMessage.startsWith('/') && inputMessage.length > 1) {
      const searchTerm = inputMessage.substring(1).toLowerCase();
      const filtered = quickMessages.filter(msg => 
        msg.shortcode.toLowerCase().includes(searchTerm)
      );
      setFilteredMessages(filtered);
      setShowAutocomplete(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setShowAutocomplete(false);
      setFilteredMessages([]);
      setSelectedIndex(-1);
    }
  }, [inputMessage, quickMessages]);

  const onKeyPress = (e) => {
    if (loading || e.shiftKey) return;
    
    if (showAutocomplete && filteredMessages.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredMessages.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredMessages.length - 1
        );
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectAutocomplete(filteredMessages[selectedIndex]);
        } else if (filteredMessages.length > 0) {
          handleSelectAutocomplete(filteredMessages[0]);
        }
        return;
      }
      if (e.key === "Escape") {
        setShowAutocomplete(false);
        return;
      }
    }
    
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const onPaste = (e) => {
    if (ticketStatus === "open") {
      handleInputPaste(e);
    }
  };

  const renderPlaceholder = () => {
    if (ticketStatus === "open") {
      return i18n.t("messagesInput.placeholderOpen");
    }
    return i18n.t("messagesInput.placeholderClosed");
  };

  const setInputRef = (input) => {
    if (input) {      inputRef.current = input;
      setAnchorEl(input);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSelectAutocomplete = (message) => {
    setInputMessage(message.message);
    setShowAutocomplete(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClickAway = () => {
    setShowAutocomplete(false);
  };

  return (
    <div className={classes.messageInputWrapper}>
      <InputBase
        disabled={disableOption()}
        inputRef={setInputRef}
        placeholder={renderPlaceholder()}
        multiline
        className={classes.messageInput}
        maxRows={5}
        value={inputMessage}
        onChange={handleInputChange}
        onKeyDown={onKeyPress}
        onPaste={onPaste}
      />
      
      {showAutocomplete && (
        <Popper
          open={showAutocomplete}
          anchorEl={anchorEl}
          placement="top-start"
          className={classes.autocompletePopper}
        >
          <ClickAwayListener onClickAway={handleClickAway}>
            <Paper className={classes.autocompletePaper}>
              {filteredMessages.map((message, index) => (
                <MenuItem
                  key={index}
                  selected={index === selectedIndex}
                  onClick={() => handleSelectAutocomplete(message)}
                >
                  <ListItemText
                    primary={
                      <div>
                        <span className={classes.shortcodeChip}>
                          {message.shortcode}
                        </span>
                      </div>
                    }
                    secondary={message.message.length > 50 ? `${message.message.substring(0, 50)}...` : message.message}
                  />
                </MenuItem>
              ))}
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}
    </div>
  );
};

const MessageInputCustom = (props) => {
  const { ticketStatus, ticketId } = props;
  const classes = useStyles();

  const [medias, setMedias] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [percentLoading, setPercentLoading] = useState(0);
  const [quickMessages, setQuickMessages] = useState([]);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null); // Separar a referência do stream

  const inputRef = useRef();
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { user } = useContext(AuthContext);

  // signMessage hook removed; reading signOption from localStorage instead
  const { list: listQuickMessages } = useQuickMessages();

  useEffect(() => {
    if (replyingMessage && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [replyingMessage]);

  useEffect(() => {
    // Apenas limpar estado quando mudar de ticket
    return () => {
      setInputMessage("");
      setShowEmoji(false);
      setMedias([]);
      setReplyingMessage(null);
    };
  }, [ticketId, setReplyingMessage]);

  useEffect(() => {
    const loadQuickMessages = async () => {
      try {
        const companyId = localStorage.getItem("companyId");
        const messages = await listQuickMessages({ companyId, userId: user.id });
        
        // Ensure messages is an array
        const messagesArray = Array.isArray(messages) ? messages : [];
        
        const formattedMessages = messagesArray.map((m) => ({
          id: m.id,
          shortcode: m.shortcode,
          message: m.message,
          value: m.message,
        }));
        
        setQuickMessages(formattedMessages);
      } catch (error) {
        console.error("Erro ao carregar mensagens rápidas:", error);
        setQuickMessages([]); // Set empty array on error
      }
    };

    if (user?.id) {
      loadQuickMessages();
    }
  }, [user.id, listQuickMessages]);

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
    // Focar imediatamente após adicionar emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectQuickMessage = async (message) => {
    
    
    // Se a mensagem tem ID, usar o novo sistema de envio
    if (message.id) {
      
      setLoading(true);
      try {
        const response = await api.post('/quick-messages/send', {
          quickMessageId: message.id,
          ticketId: ticketId
        });
        
        
        // Limpar input após envio bem-sucedido
        setInputMessage("");
        setShowEmoji(false);
        setReplyingMessage(null);
        
      } catch (err) {
        console.error("Error sending quick message:", err);
        toastError(err);
      }
      setLoading(false);
    } else {
      
      // Fallback para o sistema antigo (apenas texto)
      setInputMessage(message);
    }
    
    // Focar imediatamente após selecionar mensagem rápida
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChangeMedias = (e) => {
    if (!e.target.files) {
      return;
    }

    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      setMedias([e.clipboardData.files[0]]);
    }
  };

  const handleUploadMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);

    // Process all medias
    const processedMedias = [];
    
    for (const media of medias) {
      if (!media) continue;

      if (media?.type.split('/')[0] === 'image') {
        // Compress image
        try {
          const compressedMedia = await new Promise((resolve, reject) => {
            new Compressor(media, {
              quality: 0.7,
              success: resolve,
              error: reject,
            });
          });
          processedMedias.push(compressedMedia);
        } catch (err) {
          console.error('Erro ao comprimir imagem:', err);
          processedMedias.push(media); // Use original if compression fails
        }
      } else {
        processedMedias.push(media);
      }
    }

    // Add all processed medias to FormData
    processedMedias.forEach(media => {
      formData.append("medias", media);
      formData.append("body", media.name || 'file');
    });

    try {
      await api.post(`/messages/${ticketId}`, formData, {
        onUploadProgress: (event) => {
          let progress = Math.round(
            (event.loaded * 100) / event.total
          );
          setPercentLoading(progress);
          },
      });
      
      setLoading(false);
      setMedias([]);
      setPercentLoading(0);
    } catch (err) {
      console.error('Erro no upload:', err);
      toastError(err);
      setLoading(false);
      setPercentLoading(0);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    
    const shouldSign = localStorage.getItem("signOption") === "true";
    const messageBody = shouldSign
      ? `*${user?.name}:*\n${inputMessage.trim()}`
      : inputMessage.trim();

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: messageBody,
      quotedMsg: replyingMessage,
    };

    // Salvar mensagem atual para caso de erro
    const currentMessage = inputMessage.trim();
    
    // Limpar input e focar IMEDIATAMENTE para UX instantânea
    setInputMessage("");
    setShowEmoji(false);
    setReplyingMessage(null);
    
    // Usar requestAnimationFrame para garantir que o DOM seja atualizado antes do foco
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });

    // Definir loading após focar para não interferir
    setLoading(true);

    try {
      await api.post(`/messages/${ticketId}`, message);
    } catch (err) {
      console.error("Error sending message:", err);
      // Se der erro, restaurar a mensagem no input
      setInputMessage(currentMessage);
      toastError(err);
      // Focar novamente após restaurar a mensagem
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    }

    setLoading(false);
    
    // Garantir foco após loading terminar
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  };

  const startRecording = async () => {
    console.log('🎤 startRecording called');
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone access granted, creating MediaRecorder...');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream; // Armazenar stream separadamente
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        setAudioBlob(audioBlob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      console.log('🎤 Starting recording...');
      mediaRecorder.start();
      
      console.log('🎤 Setting isRecording to true');
      setIsRecording(true);
      setIsPaused(false);
      
      console.log('🎤 Recording state updated, isRecording should be true now');
    } catch (err) {
      console.error('❌ Error accessing microphone:', err);
      if (err.name === 'NotAllowedError') {
        toastError({ message: 'Permissão do microfone negada. Permita o acesso ao microfone e tente novamente.' });
      } else if (err.name === 'NotFoundError') {
        toastError({ message: 'Nenhum microfone encontrado no dispositivo.' });
      } else {
        toastError({ message: 'Erro ao acessar o microfone: ' + err.message });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Configurar para enviar automaticamente após parar
      const originalOnStop = mediaRecorderRef.current.onstop;
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        // Enviar imediatamente
        sendAudioBlob(audioBlob);
        // Limpar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const sendAudioBlob = async (blob) => {
    setLoading(true);
    const formData = new FormData();
    
    // Criar arquivo de áudio com tipo MIME correto
    const audioFile = new File([blob], `audio_${Date.now()}.ogg`, { 
      type: 'audio/ogg; codecs=opus' 
    });
    
    formData.append("fromMe", true);
    formData.append("medias", audioFile);
    formData.append("body", "🎵 Áudio");

    try {
      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
      toastError(err);
    }

    setLoading(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    
    setLoading(true);
    const formData = new FormData();
    
    // Criar arquivo de áudio com tipo MIME correto
    const audioFile = new File([audioBlob], `audio_${Date.now()}.ogg`, { 
      type: 'audio/ogg; codecs=opus' 
    });
    
    formData.append("fromMe", true);
    formData.append("medias", audioFile);
    formData.append("body", "🎵 Áudio");

    try {
      await api.post(`/messages/${ticketId}`, formData);
      setAudioBlob(null);
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
      toastError(err);
    }

    setLoading(false);
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleMicClick = () => {
    console.log('🎤 handleMicClick called', { 
      isRecording, 
      audioBlob: !!audioBlob, 
      isPaused,
      ticketStatus 
    });
    
    if (!isRecording && !audioBlob) {
      console.log('🎤 Condition met: starting recording');
      startRecording();
    } else if (isRecording && !isPaused) {
      console.log('🎤 Condition met: stopping recording');
      stopRecording();
    } else {
      console.log('🎤 No condition met, current state:', { isRecording, audioBlob: !!audioBlob, isPaused });
    }
  };

  const disableOption = () => {
    return ticketStatus !== "open";
  };

  const renderReplyingMessage = (message) => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe,
            })}
          ></span>
          <div className={classes.replyginMsgBody}>
            {!message.fromMe && (
              <span className={classes.messageContactName}>
                {message.contact?.name}
              </span>
            )}
            {message.body}
          </div>
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          disabled={loading || ticketStatus !== "open"}
          onClick={() => setReplyingMessage(null)}
        >
          <ClearIcon className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  // Debug: verificar estados antes da renderização
  console.log('🎨 Render states:', { 
    isRecording, 
    audioBlob: !!audioBlob, 
    mediasLength: medias.length,
    loading 
  });
  
  // Verificar se deve mostrar interface de gravação
  if (isRecording || audioBlob) {
    console.log('🎨 Rendering recording interface');
    return (
      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
        <IconButton
          aria-label="cancel-audio"
          component="span"
          onClick={cancelAudio}
        >
          <CancelIcon className={classes.sendMessageIcons} />
        </IconButton>

        {loading ? (
          <div>
            <LinearWithValueLabel progress={percentLoading} />
          </div>
        ) : (
          <span>
            {isRecording ? "🎤 Gravando..." : "🎵 Áudio gravado"}
          </span>
        )}

        <IconButton
          aria-label={isRecording ? "stop-and-send-audio" : "send-audio"}
          component="span"
          onClick={isRecording ? stopAndSendRecording : sendAudio}
          disabled={loading}
          title={isRecording ? "Parar e enviar áudio" : "Enviar áudio"}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
  }
  
  // Interface de upload de arquivos
  if (medias.length > 0) {
    return (
      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
        <IconButton
          aria-label="cancel-upload"
          component="span"
          onClick={(e) => setMedias([])}
        >
          <CancelIcon className={classes.sendMessageIcons} />
        </IconButton>

        {loading ? (
          <div>
            <LinearWithValueLabel progress={percentLoading} />
          </div>
        ) : (
          <span>
            {medias.length === 1 
              ? medias[0]?.name 
              : `${medias.length} arquivos selecionados`
            }
          </span>
        )}
        <IconButton
          aria-label="send-upload"
          component="span"
          onClick={handleUploadMedia}
          disabled={loading}
          title={`Enviar ${medias.length === 1 ? 'arquivo' : `${medias.length} arquivos`}`}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
  }
  else {
    return (
      <Paper square elevation={0} className={classes.mainWrapper}>
        {replyingMessage && renderReplyingMessage(replyingMessage)}
        <div className={classes.newMessageBox}>
          <EmojiOptions
            disabled={disableOption()}
            handleAddEmoji={handleAddEmoji}
            showEmoji={showEmoji}
            setShowEmoji={setShowEmoji}
          />

          <FileInput
            disableOption={disableOption}
            handleChangeMedias={handleChangeMedias}
          />

          <QuickMessagesButton
            disabled={disableOption()}
            quickMessages={quickMessages}
            onSelectMessage={handleSelectQuickMessage}
          />

          <CustomInput
            loading={loading}
            inputRef={inputRef}
            ticketStatus={ticketStatus}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            handleInputPaste={handleInputPaste}
            disableOption={disableOption}
            quickMessages={quickMessages}
          />

          <ActionButtons
            inputMessage={inputMessage}
            loading={loading}
            handleSendMessage={handleSendMessage}
            handleMicClick={handleMicClick}
            isRecording={isRecording}
            ticketStatus={ticketStatus}
          />
          
          {/* Debug: mostrar estados atuais */}
          <div style={{ fontSize: '10px', color: 'red', padding: '2px' }}>
            Debug: isRecording={isRecording.toString()}, audioBlob={!!audioBlob ? 'true' : 'false'}, status={ticketStatus}
          </div>
        </div>
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);
