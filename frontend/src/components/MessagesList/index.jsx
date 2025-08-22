import React, { useState, useEffect, useReducer, useRef } from "react";

import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";

import { green } from "@material-ui/core/colors";
import {
  Avatar,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";

import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
} from "@material-ui/icons";

import MarkdownWrapper from "../MarkdownWrapper";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import TypingIndicator from "../TypingIndicator";
import whatsBackground from "../../assets/wa-background.png";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";
import { getCompanyId } from "../../utils/authUtils";


// Exibe apenas o player nativo, mas garante que o Chrome consiga ler metadados (duração)
const guessMimeFromUrl = (u) => {
  try {
    const clean = u.split('?')[0].toLowerCase();
    if (clean.endsWith('.webm')) return 'audio/webm; codecs=opus';
    if (clean.endsWith('.ogg') || clean.endsWith('.oga')) return 'audio/ogg; codecs=opus';
    if (clean.endsWith('.mp3')) return 'audio/mpeg';
    if (clean.endsWith('.wav')) return 'audio/wav';
    if (clean.endsWith('.mp4') || clean.endsWith('.m4a')) return 'audio/mp4';
  } catch {}
  return undefined;
};

const AudioMessage = ({ url, classes }) => {
  const type = guessMimeFromUrl(url);
  return (
    <audio
      className={classes.messageMedia}
      controls
      preload="metadata"
      style={{ width: "250px", height: "40px" }}
      onError={(e) => {
        console.error('Erro ao carregar áudio:', e);
        console.error('URL do áudio:', url);
      }}
    >
      {/* Usar <source> com type ajuda o Chrome a obter duração sem precisar dar play */}
      <source src={url} {...(type ? { type } : {})} />
      {/* Fallbacks genéricos caso a extensão não informe o tipo corretamente */}
      {!type && <source src={url} type="audio/webm; codecs=opus" />}
      {!type && <source src={url} type="audio/ogg; codecs=opus" />}
      Seu navegador não suporta a reprodução de áudio.
    </audio>
  );
};

const useStyles = makeStyles((theme) => ({
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },

  messagesList: {
    background: theme.palette.type === 'dark'
      ? theme.palette.background.default
      : 'rgba(207, 233, 186, 0.7)',
    display: "flex",
    width:"20",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },

  circleLoading: {
    color: green[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.palette.type === 'dark' ? "0 1px 1px rgba(255,255,255,0.1)" : "0 1px 1px #b3b3b3",
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[700] : "#c7ffa7ff",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.type === 'dark' ? "#4caf50" : "#4caf50",
    color: theme.palette.type === 'dark' ? "#ffffff" : "#ffffffff",
    fontSize:15,
    alignSelf: "flex-end",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 0,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    boxShadow: theme.palette.type === 'dark' ? "0 1px 1px rgba(255, 255, 255, 0.1)" : "0 1px 1px #cfe9ba",
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: theme.palette.type === 'dark' ? "#1e3a26" : "#2d4a15ff",
    borderRadius: "10.5px",
    display: "flex",
    position: "relative",
    fontSize:15,
  },

  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#fff",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#fff",
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[700] : "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: theme.palette.type === 'dark' ? "0 1px 1px rgba(255,255,255,0.1)" : "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: theme.palette.type === 'dark' ? theme.palette.text.secondary : "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
  },
  imageLocation: {
    position: 'relative',
    width: '100%',
    height: 80,
    borderRadius: 5
  },

  documentPreview: {
    width: 250,
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 12,
    margin: "4px 0",
    border: `1px solid ${theme.palette.divider}`,
  },

  documentHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
  },

  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  documentInfo: {
    flex: 1,
  },

  documentName: {
    fontWeight: 500,
    marginBottom: 2,
  },

  documentActions: {
    display: "flex",
    justifyContent: "flex-end",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = Array.isArray(action.payload) ? action.payload : [];
    const newMessages = [];

    messages.forEach((message) => {
      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      // Mensagem já existe, apenas atualizar sem duplicar
      const updatedState = [...state];
      updatedState[messageIndex] = newMessage;
      return updatedState;
    } else {
      // Adicionar nova mensagem no final da lista
      const newState = [...state, newMessage];
      // Ordenar mensagens por data de criação para garantir ordem correta
      return newState.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      const updatedState = [...state];
      updatedState[messageIndex] = messageToUpdate;
      return updatedState;
    }

    return state;
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({ ticket, ticketId, isGroup }) => {
  const classes = useStyles();

  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastMessageRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Progressive rendering: render last N messages first
  const INITIAL_VISIBLE = 30;
  const STEP_VISIBLE = 30;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const initialReadyRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const scrollingUpRef = useRef(false);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    setVisibleCount(INITIAL_VISIBLE);
    initialReadyRef.current = false;
    currentTicketId.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === undefined) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber },
          });

          if (currentTicketId.current === ticketId) {
            // Ensure data.messages is an array
            const messages = Array.isArray(data.messages) ? data.messages : [];
            dispatch({ type: "LOAD_MESSAGES", payload: messages });
            setHasMore(data.hasMore);
            setLoading(false);
          }

          if (pageNumber === 1 && data.messages.length > 0) {
            scrollToBottom();
            // mark as ready to allow infinite scroll only after first load & scroll
            initialReadyRef.current = true;
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchMessages();
    }, 200);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId]);

useEffect(() => {
  if (!ticketId || ticketId === "undefined") {
    return;
  }
  
  // Usar getCompanyId() que tem fallback para localStorage
  const companyId = getCompanyId() || "1";
  const socket = socketConnection({ companyId });

  // Conectar ao room específico do ticket
  const handleConnect = () => {
    socket.emit("joinChatBox", `${ticketId}`);
  };

  socket.on("connect", handleConnect);
  
  // Se já está conectado, entrar no room imediatamente
  if (socket.connected) {
    handleConnect();
  }

  const messageListener = (data) => {
    // Garantir que a comparação funcione com string e number
    const currentTicketId = parseInt(ticketId);
    const messageTicketId = parseInt(data.ticket?.id || data.message?.ticketId);
    
    if (data.action === "create" && messageTicketId === currentTicketId) {
      // Hide typing indicator when message is received
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // O reducer já verifica se a mensagem existe, então podemos enviar diretamente
      dispatch({ type: "ADD_MESSAGE", payload: data.message });
      // Usar requestAnimationFrame para scroll mais rápido e suave
      requestAnimationFrame(() => scrollToBottom());
    }
    if (data.action === "update" && parseInt(data.message?.ticketId) === currentTicketId) {
      dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
    }
  };

  // Typing indicator listener
  const typingListener = (data) => {
    const currentTicketId = parseInt(ticketId);
    if (parseInt(data.ticketId) === currentTicketId && !data.fromMe) {
      if (data.typing) {
        setIsTyping(true);
        // Clear existing timeout and set new one
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      } else {
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };

  socket.on(`company-${companyId}-appMessage`, messageListener);
  socket.on(`company-${companyId}-typing`, typingListener);

  return () => {
    socket.off(`company-${companyId}-appMessage`, messageListener);
    socket.off(`company-${companyId}-typing`, typingListener);
    socket.off("connect", handleConnect);
    socket.disconnect();
  };
}, [ticketId]);


  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  // reveal more already-fetched messages progressively (without refetch)
  useEffect(() => {
    const total = messagesList.length;
    if (total > visibleCount) {
      const schedule = () => setVisibleCount((v) => Math.min(v + STEP_VISIBLE, total));
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = window.requestIdleCallback(schedule, { timeout: 300 });
        return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
      } else {
        const t = setTimeout(schedule, 40);
        return () => clearTimeout(t);
      }
    }
  }, [messagesList.length, visibleCount]);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;

    // determine scroll direction
    scrollingUpRef.current = scrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    if (!initialReadyRef.current) return; // avoid eager loads before first render is ready
    if (loading) return;
    if (!hasMore) return;

    // Only load more when user is scrolling up and near top
    if (scrollTop < 50 && scrollingUpRef.current) {
      loadMore();
    }
  };

  const handleOpenMessageOptionsMenu = (e, message) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const checkMessageMedia = (message) => {
    if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.mediaUrl} />;
    }
    
    if (message.mediaType === "video") {
      // Construir URL completa se necessário
      let videoUrl = message.mediaUrl;
      if (videoUrl && !videoUrl.startsWith('http')) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
        videoUrl = `${backendUrl}/uploads/${videoUrl}`;
      }
      
      return (
        <div style={{ position: 'relative' }}>
          <video
            className={classes.messageMedia}
            src={videoUrl}
            controls
            preload="metadata"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Erro ao carregar vídeo:', e);
              console.error('URL do vídeo:', videoUrl);
              console.error('Erro detalhado:', e.target.error);
              
              // Mostrar erro visual
              e.target.style.display = 'none';
              const errorDiv = e.target.nextSibling;
              if (errorDiv && errorDiv.classList.contains('video-error')) {
                errorDiv.style.display = 'flex';
              }
            }}
          >
            Seu navegador não suporta a reprodução de vídeo.
          </video>
          <div 
            className="video-error"
            style={{
              display: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '250px',
              height: '200px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#666'
            }}
          >
            <div>❌ Erro ao carregar vídeo</div>
            <button 
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => window.open(videoUrl, '_blank')}
            >
              Abrir em nova aba
            </button>
          </div>
        </div>
      );
    }
    
    if (message.mediaType === "audio") {
      // Construir URL completa se necessário
      let audioUrl = message.mediaUrl;
      if (audioUrl && !audioUrl.startsWith('http')) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
        audioUrl = `${backendUrl}/uploads/${audioUrl}`;
      }
      
      return (
        <AudioMessage url={audioUrl} classes={classes} />
      );
    }
    
    // Handle document previews (PDF, DOC, etc.)
    if (message.mediaType === "application") {
      const fileName = message.body || "Document";
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      // PDF preview
      if (fileExtension === 'pdf') {
        return (
          <div className={classes.documentPreview}>
            <div className={classes.documentHeader}>
              <div className={classes.documentIcon}>
                <span role="img" aria-label="PDF document">📄</span>
              </div>
              <div className={classes.documentInfo}>
                <Typography variant="body2" className={classes.documentName}>
                  {fileName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  PDF Document
                </Typography>
              </div>
            </div>
            <div className={classes.documentActions}>
              <Button
                startIcon={<GetApp />}
                color="primary"
                variant="outlined"
                size="small"
                target="_blank"
                href={message.mediaUrl}
                style={{ marginRight: 8 }}
              >
                Download
              </Button>
              <Button
                color="primary"
                variant="contained"
                size="small"
                target="_blank"
                href={message.mediaUrl}
              >
                View
              </Button>
            </div>
          </div>
        );
      }
      
      // Other document types
      const documentIcons = {
        doc: '📝', docx: '📝',
        xls: '📊', xlsx: '📊',
        ppt: '📊', pptx: '📊',
        txt: '📄',
        zip: '🗜️', rar: '🗜️',
      };
      
      return (
        <div className={classes.documentPreview}>
          <div className={classes.documentHeader}>
            <div className={classes.documentIcon}>
              {documentIcons[fileExtension] || '📎'}
            </div>
            <div className={classes.documentInfo}>
              <Typography variant="body2" className={classes.documentName}>
                {fileName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {fileExtension?.toUpperCase()} Document
              </Typography>
            </div>
          </div>
          <div className={classes.documentActions}>
            <Button
              startIcon={<GetApp />}
              color="primary"
              variant="outlined"
              size="small"
              target="_blank"
              href={message.mediaUrl}
            >
              Download
            </Button>
          </div>
        </div>
      );
    }
    
    // Fallback for other media types
    return (
      <>
        <div className={classes.downloadMedia}>
          <Button
            startIcon={<GetApp />}
            color="primary"
            variant="outlined"
            target="_blank"
            href={message.mediaUrl}
          >
            Download
          </Button>
        </div>
        <Divider />
      </>
    );
  };

  const renderMessageAck = (message) => {
    if (message.ack === 0) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 1) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 2) {
      return <DoneAll fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 3 || message.ack === 4) {
      return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />;
    }
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length - 1) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
    if (index === messagesList.length - 1) {
      return (
        <div
          key={`ref-${message.createdAt}`}
          ref={lastMessageRef}
          style={{ float: "left", clear: "both" }}
        />
      );
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const renderQuotedMessage = (message) => {
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}
          {message.quotedMsg?.body}
        </div>
      </div>
    );
  };

  const isVCard = (message) => {
    return message.includes('BEGIN:VCARD');
  };

  const vCard = (message) => {
    const name = message?.substring(message.indexOf("N:;") + 3, message.indexOf(";;;"))
    const description = message?.substring(message.indexOf("TION:") + 5, message.indexOf("TEL"))
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
          <Avatar style={{ marginRight: 10, marginLeft: 20, width: 60, height: 60 }} />
          <div style={{ width: 350 }}>
            <div>
              <Typography
                noWrap
                component="h4"
                variant="body2"
                color="textPrimary"
                style={{ fontWeight: '700' }}
              >
                {name}
              </Typography>
            </div>

            <div style={{ width: 350 }}>
              <Typography
                component="span"
                variant="body2"
                color="textPrimary"
                style={{ display: 'flex' }}
              >
                {description}
              </Typography>
            </div>
          </div>

        </div>
        <div style={{
          width: '100%', display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
          borderWidth: '1px 0 0 0',
          borderTopColor: '#bdbdbd',
          borderStyle: 'solid',
          padding: 8
        }}>
          <Typography
            noWrap
            component="h4"
            variant="body2"
            color="textPrimary"
            style={{ fontWeight: '700', color: '#2c9ce7' }}
          >
            Conversar
          </Typography>
        </div>
      </div>
    )
  };

  const messageLocation = (message, createdAt) => {
    return (
      <div className={[classes.textContentItem, { display: 'flex', padding: 5 }]}>
        <img src={message.split('|')[0]} className={classes.imageLocation} alt="Localização" />
        <a
          style={{ fontWeight: '700', color: 'gray' }}
          target="_blank"
          rel="noopener noreferrer"
          href={message.split('|')[1]}> Clique para ver localização</a>
        <span className={classes.timestamp}>
          {format(parseISO(createdAt), "HH:mm")}
        </span>
      </div>
    )
  };


  const renderMessages = () => {
    if (Array.isArray(messagesList) && messagesList.length > 0) {
      // render only the last 'visibleCount' messages
      const startIndex = Math.max(0, messagesList.length - visibleCount);
      const slice = messagesList.slice(startIndex);
      const viewMessagesList = slice.map((message, idx) => {
        const index = startIndex + idx;
        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={classes.messageLeft}
                title={message.queueId && message.queue?.name}
              >
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}

                {message.mediaUrl && checkMessageMedia(message)}

                {message.body.includes('data:image') ? messageLocation(message.body, message.createdAt)
                  :
                  isVCard(message.body) ?
                    <div className={[classes.textContentItem, { marginRight: 0 }]}>
                      {vCard(message.body)}
                    </div>

                    :


                    (<div className={classes.textContentItem}>
                      {message.quotedMsg && renderQuotedMessage(message)}
                      <MarkdownWrapper>{message.body}</MarkdownWrapper>
                      <span className={classes.timestamp}>
                        {format(parseISO(message.createdAt), "HH:mm")}
                      </span>
                    </div>)}
              </div>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={classes.messageRight}
                title={message.queueId && message.queue?.name}
              >
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {message.mediaUrl && checkMessageMedia(message)}
                <div
                  className={clsx(classes.textContentItem, {
                    [classes.textContentItemDeleted]: message.isDeleted,
                  })}
                >
                  {message.isDeleted && (
                    <Block
                      color="disabled"
                      fontSize="small"
                      className={classes.deletedIcon}
                    />
                  )}
                  {message.body.includes('data:image') ? messageLocation(message.body, message.createdAt)
                  :
                  isVCard(message.body) ?
                    <div className={[classes.textContentItem]}>
                      {vCard(message.body)}
                    </div>

                    :
                  message.quotedMsg && renderQuotedMessage(message)}
                  <MarkdownWrapper>{message.body}</MarkdownWrapper>
                  <span className={classes.timestamp}>
                    {format(parseISO(message.createdAt), "HH:mm")}
                    {renderMessageAck(message)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        }
      });
      return viewMessagesList;
    } else {
      return <div>Say hello to your new contact!</div>;
    }
  };

  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
      >
        {messagesList.length > 0 ? renderMessages() : []}
        {isTyping && (
          <TypingIndicator contactName={ticket?.contact?.name || "Contato"} />
        )}
      </div>
            {loading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
    </div>
  );
};

export default MessagesList;