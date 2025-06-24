import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
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
import { FormControlLabel, Switch, Menu, MenuItem, ListItemText, Divider, Popper, Paper, ClickAwayListener } from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";

import useQuickMessages from "../../hooks/useQuickMessages";

import Compressor from 'compressorjs';
import LinearWithValueLabel from "./ProgressBarCustom";


const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },

  newMessageBox: {
    background: "#eee",
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },

  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    background: "#fff",
    display: "flex",
    borderRadius: 20,
    flex: 1,
  },

  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
  },

  sendMessageIcons: {
    color: "grey",
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
    backgroundColor: "#eee",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
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

const SignSwitch = (props) => {
  const { width, setSignMessage, signMessage } = props;
  if (isWidthUp("md", width)) {
    return (
      <FormControlLabel
        style={{ marginRight: 7, color: "gray" }}
        label={i18n.t("messagesInput.signMessage")}
        labelPlacement="start"
        control={
          <Switch
            size="small"
            checked={signMessage}
            onChange={(e) => {
              setSignMessage(e.target.checked);
            }}
            name="showAllTickets"
            color="primary"
          />
        }
      />
    );
  }
  return null;
};

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
            <MenuItem key={`item-${index}`} onClick={() => handleSelectMessage(message.value)}>
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
      />
      <label htmlFor="upload-button">
        <IconButton
          aria-label="upload"
          component="span"
          disabled={disableOption()}
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
  } = props;
  const classes = useStyles();
  if (inputMessage) {
    return (
      <IconButton
        aria-label="sendMessage"
        component="span"
        onClick={handleSendMessage}
        disabled={loading}
      >
        <SendIcon className={classes.sendMessageIcons} />
      </IconButton>
    );
  } else {
    return null;
  }
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

  const inputRef = useRef();
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { user } = useContext(AuthContext);

  const [signMessage, setSignMessage] = useLocalStorage("signOption", true);
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
        const formattedMessages = messages.map((m) => ({
          shortcode: m.shortcode,
          message: m.message,
          value: m.message,
        }));
        setQuickMessages(formattedMessages);
      } catch (error) {
        console.error("Erro ao carregar mensagens rápidas:", error);
      }
    };

    if (user?.id) {
      loadQuickMessages();
    }
  }, [user.id, listQuickMessages]);

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const handleSelectQuickMessage = (message) => {
    setInputMessage(message);
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
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
          console.log(`Upload está ${progress}% completo...`);
        },
      });
      
      console.log('Upload concluído com sucesso!');
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
    setLoading(true);

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: signMessage
        ? `*${user?.name}:*\n${inputMessage.trim()}`
        : inputMessage.trim(),
      quotedMsg: replyingMessage,
    };
    try {
      await api.post(`/messages/${ticketId}`, message);
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
  };

  
  const disableOption = () => {
    return loading || ticketStatus !== "open";
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

  if (medias.length > 0)
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
            {medias[0]?.name}
          </span>
        )}
        <IconButton
          aria-label="send-upload"
          component="span"
          onClick={handleUploadMedia}
          disabled={loading}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
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

          <SignSwitch
            width={props.width}
            setSignMessage={setSignMessage}
            signMessage={signMessage}
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
          />
        </div>
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);