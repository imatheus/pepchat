import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green, grey, red, blue } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";

import api from "../../services/api";
import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import AdbIcon from "@material-ui/icons/Adb";
import DoneIcon from '@material-ui/icons/Done';
import ClearOutlinedIcon from '@material-ui/icons/ClearOutlined';
import { socketConnection } from "../../services/socket";
import { getThemeColors, hexToRgba } from "../../styles/colors";

const useStyles = makeStyles((theme) => {
  const themeColors = getThemeColors(theme.palette.type === 'dark');
  return ({
    // Base ticket styles
    ticket: {
      position: "relative",
      width: "100%",
      maxWidth: "99%",
      height: 108,
      padding: "0px 8px 5px 16px", // Combined padding
      margin: "8px 0",
      boxSizing: "border-box",
      borderRadius: "10px",
      border: "1px solid #d6d6d65f !important",
      backgroundColor: theme.palette.type === 'dark' ? '#333333' : theme.palette.background.paper,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        transform: "translateY(-1px)",
      },
      // Mostrar ícones de ação somente no hover do card
      "&:hover $iconOnHover": {
        opacity: 1,
        pointerEvents: "auto",
      },
    },

    // Variant styles
    pendingTicket: {
      cursor: "pointer",
      width: "100%",
      maxWidth: "100%",
      padding: "0 8px 0 16px",
      margin: "5px 0",
      boxSizing: "border-box",
      borderRadius: "12px",
      border: "1px solid #8c8c8c5f !important",
      backgroundColor: hexToRgba(themeColors.primary.main, 0.18),
      boxShadow: `0 0 0 2px ${hexToRgba(themeColors.primary.main, 0.2)} inset`,
      "&:hover": {
        boxShadow: `0 0 0 2px ${hexToRgba(themeColors.primary.main, 0.28)} inset`,
        transform: "translateY(-1px)",
      },
    },

    // Highlight for unread/new tickets
    unreadHighlight: {
      backgroundColor: hexToRgba(themeColors.primary.main, 0.18),
      borderColor: themeColors.primary.main,
      boxShadow: `0 0 0 2px ${hexToRgba(themeColors.primary.main, 0.22)} inset`,
      outline: `2px solid ${hexToRgba(themeColors.primary.main, 0.25)}`,
    },

    // Empty state styles
    noTicketsDiv: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100px",
      margin: 40,
    },

    noTicketsTitle: {
      textAlign: "center",
      fontSize: "16px",
      fontWeight: 600,
      margin: 0,
    },

    noTicketsText: {
      textAlign: "center",
      color: "rgb(104, 121, 146)",
      fontSize: "14px",
      lineHeight: 1.4,
    },

    // Ticket content styles
    ticketQueueColor: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "8px",
      height: "100%",
      flex: "none",
      borderTopLeftRadius: "12px",
      borderBottomLeftRadius: "12px",
    },

    contactNameWrapper: {
      display: "flex",
      justifyContent: "space-between",



    },

    ticketNameRow: {
      display: "inline-flex",
      alignItems: "center",
      gap: 15,
      fontWeight: 600,
      width: "100%",
    },

    ticketNumber: {
      marginLeft: -2,
      top: -55,
      right: -58,
      color: grey[600],
      fontWeight: 600,
      fontSize: 13,
      position: 'inherit',
    },

    contactLastMessage: {
      paddingRight: 80, // Space for buttons
    },

    lastMessageTime: {
      position: "relative",
      top: -35,
      fontSize: 12,
      textAlign: "right",
    },

    ticketInfo: {
      position: "absolute",
      top: 10,
    },

    ticketInfo1: {

      position: "relative",
      top: 40,
      right: 0,
      paddingLeft: 50
    },

    // Badge styles
    closedBadge: {
      alignSelf: "center",
      marginLeft: "auto",
      marginRight: 32,
    },

    newMessagesCount: {
      alignSelf: "center",
      marginLeft: "auto",
      marginRight: 0,
      top: -10,
      right: 10,
    },

    badgeStyle: {
      color: "white",
      backgroundColor: green[500],
      right: 0,
      top: 10,
    },

    Radiusdot: {
      "& .MuiBadge-badge": {
        borderRadius: "50px",
        position: "inherit",
        height: 16,
        margin: 2,
        padding: 3,
        fontSize: 10,
      },
      "& .MuiBadge-anchorOriginTopRightRectangle": {
        transform: "scale(1) translate(0%, -40%)",
      },
    },

    // Button styles
    acceptButton: {
      position: "absolute",
      right: 108,
    },

    // Ícones de ação exibidos somente no hover do card
    iconOnHover: {
      opacity: 0,
      transition: "opacity 0.2s ease",
      pointerEvents: "none",
    },

    groupAvatar: {
      "& .MuiAvatar-colorDefault": {
        color: "#7c7c7c !important",
        backgroundColor: "#e4e4e4 !important",
      },
      color: "#7c7c7c !important",
      backgroundColor: "#e4e4e4 !important",
    },

    // Pequeno avatar do atendente (dono do ticket)
    ownerAvatar: {
      width: 18,
      height: 18,
      fontSize: 10,
      marginRight: -2,
      border: '1px solid rgba(0,0,0,0.1)'
    },
    ownerAvatarFallback: {
      backgroundColor: grey[500],
      color: '#fff',

    },
    // Container dos avatares vinculados
    linkedAvatars: {
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: 4,
    },
    linkedAvatar: {
      width: 18,
      height: 18,
      fontSize: 10,
      border: '1px solid rgba(0,0,0,0.1)',
      marginLeft: -6,
      backgroundColor: theme.palette.background.default,
    },
    linkedAvatarFallback: {
      backgroundColor: grey[500],
      color: '#fff',
    },
    linkedAvatarMore: {
      width: 18,
      height: 18,
      fontSize: 10,
      border: '1px solid rgba(0,0,0,0.1)',
      marginLeft: -6,
      backgroundColor: grey[500],
      color: '#fff',
    },

    // Badge de mensagens não lidas ao lado do nome do contato
    unreadMessagesBadge: {
      "& .MuiBadge-badge": {
        backgroundColor: themeColors.primary.main,
        color: "white",
        fontSize: "10px",
        height: "16px",
        minWidth: "16px",
        borderRadius: "8px",
        padding: "0 14px",
        fontWeight: 600,
        transform: "scale(0.9) translate(50%, -50%)",
        border: `1px solid ${theme.palette.background.paper}`,
      },
    },
  });
});

const TicketListItemCustom = ({ ticket, setUpdate }) => {
  const classes = useStyles();
  const history = useHistory();
  const [, setLoading] = useState(false);
  const [ticketUser, setTicketUser] = useState(null);
  const [ownerImage, setOwnerImage] = useState(null);
  const [whatsAppName, setWhatsAppName] = useState(null);
  const [currentTicketTags, setCurrentTicketTags] = useState(ticket.tags || []);
  // NOVA FUNCIONALIDADE: Estado para controlar a exibição da bolinha de mensagens não lidas
  // Função para obter contador persistente do localStorage
  const getPersistedUnreadCount = () => {
    try {
      const companyId = localStorage.getItem("companyId");
      const userId = localStorage.getItem("userId");
      if (!companyId || !userId) return ticket.unreadMessages || 0;
      
      const storageKey = `unreadCount_${companyId}_${userId}_${ticket.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored !== null) {
        const parsedCount = parseInt(stored, 10);
        // CORREÇÃO: Priorizar localStorage para manter contador local
        // Só usar ticket.unreadMessages se localStorage estiver vazio
        return parsedCount;
      }
      
      return ticket.unreadMessages || 0;
    } catch (error) {
      console.warn('Erro ao acessar localStorage para unreadCount:', error);
      return ticket.unreadMessages || 0;
    }
  };
  
  // Função para persistir contador no localStorage
  const persistUnreadCount = (count) => {
    try {
      const companyId = localStorage.getItem("companyId");
      const userId = localStorage.getItem("userId");
      if (!companyId || !userId) return;
      
      const storageKey = `unreadCount_${companyId}_${userId}_${ticket.id}`;
      if (count > 0) {
        localStorage.setItem(storageKey, count.toString());
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn('Erro ao salvar unreadCount no localStorage:', error);
    }
  };
  
  // Inicializar com dados persistentes
  const [unreadCount, setUnreadCountState] = useState(getPersistedUnreadCount);
  
  // Wrapper para setUnreadCount que também persiste no localStorage
  const setUnreadCount = (count) => {
    const newCount = typeof count === 'function' ? count(unreadCount) : count;
    setUnreadCountState(newCount);
    persistUnreadCount(newCount);
  };
  
  // Função para limpar dados antigos do localStorage (executar periodicamente)
  const cleanupOldUnreadCounts = () => {
    try {
      const companyId = localStorage.getItem("companyId");
      const userId = localStorage.getItem("userId");
      if (!companyId || !userId) return;
      
      const prefix = `unreadCount_${companyId}_${userId}_`;
      const keysToRemove = [];
      
      // Verificar todas as chaves do localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const ticketId = key.replace(prefix, '');
          // Se o valor é 0 ou se é muito antigo, marcar para remoção
          const value = localStorage.getItem(key);
          if (value === '0' || value === null) {
            keysToRemove.push(key);
          }
        }
      }
      
      // Remover chaves marcadas
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }
  };

  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket, triggerRefresh } = useContext(TicketsContext);
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const { profile } = user;

  useEffect(() => {
    // Atualizar tags quando o ticket prop mudar
    setCurrentTicketTags(ticket.tags || []);
  }, [ticket.tags]);
  
  // NOVA FUNCIONALIDADE: Sincronizar contador com dados do ticket (separado para evitar conflitos)
  useEffect(() => {
    // Só sincronizar se o valor do backend for MAIOR que o local
    // Isso evita que o backend "atrase" o contador local
    const ticketCount = ticket.unreadMessages || 0;
    
    // Se o backend tem mais mensagens que o local, atualizar
    if (ticketCount > unreadCount) {
      setUnreadCount(ticketCount);
    }
    // Se o backend zerou (mensagens lidas), zerar o local também
    else if (ticketCount === 0 && unreadCount > 0) {
      setUnreadCount(0);
    }
    // Caso contrário, manter o valor local (que pode estar à frente do backend)
  }, [ticket.unreadMessages]);
  
  // Executar limpeza do localStorage uma vez por sessão
  useEffect(() => {
    const hasCleanedThisSession = sessionStorage.getItem('unreadCountCleaned');
    if (!hasCleanedThisSession) {
      cleanupOldUnreadCounts();
      sessionStorage.setItem('unreadCountCleaned', 'true');
    }
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    // Escutar mudanças nas tags do ticket e eventos de mensagens
    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "update" && data.ticket && data.ticket.id === ticket.id) {
        setCurrentTicketTags(data.ticket.tags || []);
        
        // NOVA FUNCIONALIDADE: Atualizar contador com base no ticket atualizado
        if (data.ticket.unreadMessages !== undefined) {
          setUnreadCount(data.ticket.unreadMessages || 0);
        }
      }
      
      // NOVA FUNCIONALIDADE: Zerar contador quando mensagens forem marcadas como lidas
      if (data.action === "updateUnread" && data.ticketId === ticket.id) {
        setUnreadCount(0);
      }
    });
    
    // NOVA FUNCIONALIDADE: Incrementar contador quando chegar nova mensagem
    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (
        data.action === "create" &&
        data.ticket.id === ticket.id &&
        !data.message.read &&
        data.message.fromMe === false // Apenas mensagens recebidas, não enviadas
      ) {
        console.log(`[DEBUG] Incrementando contador para ticket ${ticket.id}:`, {
          currentCount: unreadCount,
          willBecome: unreadCount + 1
        });
        setUnreadCount(prevCount => {
          const newCount = prevCount + 1;
          console.log(`[DEBUG] Contador atualizado de ${prevCount} para ${newCount}`);
          return newCount;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticket.id]);

  useEffect(() => {
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user.name);
      setOwnerImage(ticket.user.profileImage || null);
    } else {
      setTicketUser(null);
      setOwnerImage(null);
    }

    // Resolver nome da conexão WhatsApp de forma robusta (socket pode não enviar relação populada)
    if (ticket.whatsapp && ticket.whatsapp.name) {
      setWhatsAppName(ticket.whatsapp.name);
    } else if (ticket.whatsappId && Array.isArray(whatsApps)) {
      const found = whatsApps.find(w => parseInt(w.id) === parseInt(ticket.whatsappId));
      setWhatsAppName(found?.name || "");
    } else {
      setWhatsAppName("");
    }

    return () => {
      isMounted.current = false;
    };
  }, [ticket.userId, ticket.user, ticket.whatsappId, ticket.whatsapp, whatsApps]);

  const handleCloseTicket = async (id) => {
    setLoading(true);
    try {
      // CORREÇÃO: Remoção otimista ANTES da chamada da API
      try {
        window.dispatchEvent(new CustomEvent('ticket-closed', { detail: { ticketId: id, ticketUuid: ticket.uuid } }));
      } catch {}

      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: user?.id,
      });

      // CORREÇÃO: NÃO chamar triggerRefresh() - isso traz o ticket de volta!
      // A remoção otimista + socket já cuidam da atualização

      // Navegar para a lista de tickets após fechar
      history.push(`/tickets/`);
    } catch (err) {
      // CORREÇÃO: Em caso de erro, reverter a remoção otimista
      try {
        triggerRefresh();
      } catch {}
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleAcepptTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
      });

      // Não forçar refresh global aqui para evitar apagar a lista temporariamente.
      // O socket de atualização irá inserir o ticket aceito no topo da lista "Abertos"
      // e removê-lo da lista "Aguardando" automaticamente.

      // Remover imediatamente o card da lista "Aguardando" (UI otimista)
      try {
        window.dispatchEvent(new CustomEvent('ticket-accepted', { detail: { ticketId: id, ticketUuid: ticket.uuid } }));
      } catch (e) {
        // ignore
      }

      // Navegar para o ticket após aceitar
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      console.error(`❌ Erro ao aceitar ticket ${id}:`, err);
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
      if (backendMsg) {
        toastError({ message: backendMsg });
      } else {
        toastError({ message: "Não é possível aceitar um ticket sem fila" });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
    
    // NOVA FUNCIONALIDADE: Zerar contador quando ticket for selecionado
    setUnreadCount(0);
  };

  // Função para determinar a cor da barra lateral baseada nas tags
  const getTicketSidebarColor = () => {
    if (currentTicketTags && currentTicketTags.length > 0) {
      // Se há múltiplas tags com cores diferentes, criar faixas divididas
      const tagColors = currentTicketTags
        .filter(tag => tag.color)
        .map(tag => tag.color);

      if (tagColors.length > 1) {
        const percentage = 100 / tagColors.length;
        const colorStops = tagColors.map((color, index) => {
          const start = index * percentage;
          const end = (index + 1) * percentage;
          return `${color} ${start}%, ${color} ${end}%`;
        }).join(', ');

        return `linear-gradient(to bottom, ${colorStops})`;
      } else if (tagColors.length === 1) {
        return tagColors[0];
      }
    }
    // Senão, usar a cor da fila
    return ticket.queue?.color || "#7C7C7C";
  };

  const renderLinkedUsers = () => {
    const allUsers = Array.isArray(ticket.users) ? ticket.users : [];
    const filtered = allUsers.filter(u => u.id !== ticket.user?.id);
    if (filtered.length === 0) return null;
    const maxToShow = 3;
    const toShow = filtered.slice(0, maxToShow);
    const extraCount = filtered.length - toShow.length;

    return (
      <span className={classes.linkedAvatars}>
        {toShow.map(u => (
          <Tooltip title={u.name} key={u.id}>
            <Avatar
              src={u.profileImage || undefined}
              className={clsx(classes.linkedAvatar, !u.profileImage && classes.linkedAvatarFallback)}
              imgProps={{ referrerPolicy: 'no-referrer' }}
            >
              {!u.profileImage && ((u.name?.[0] || '').toUpperCase())}
            </Avatar>
          </Tooltip>
        ))}
        {extraCount > 0 && (
          <Avatar className={classes.linkedAvatarMore}>+{extraCount}</Avatar>
        )}
      </span>
    );
  };

  const renderTicketInfo = () => {
    if (ticketUser) {
      return (
        <>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Tooltip title={ticketUser}>
              <Avatar
                src={ownerImage || undefined}
                className={clsx(classes.ownerAvatar, !ownerImage && classes.ownerAvatarFallback)}
                imgProps={{ referrerPolicy: 'no-referrer' }}
              >
                {!ownerImage && ((ticketUser?.[0] || '').toUpperCase())}
              </Avatar>
            </Tooltip>
            {renderLinkedUsers()}

            {ticket.whatsappId && (
              <Badge
                className={classes.Radiusdot}
                badgeContent={(whatsAppName || (ticket.whatsapp && ticket.whatsapp.name) || (Array.isArray(whatsApps) ? (whatsApps.find(w => parseInt(w.id) === parseInt(ticket.whatsappId))?.name || "") : ""))}
                style={{
                  backgroundColor: "#21ba59ff",
                  height: 18,
                  padding: 6,
                  position: "inherit",
                  borderRadius: "50px",
                  color: "white",
                  top: -6,
                  marginRight: 3,
                  marginLeft: 7
                }}
              />
            )}

            {ticket.queue?.name !== null && (
              <Badge
                className={classes.Radiusdot}
                style={{
                  backgroundColor: ticket.queue?.color || "#7C7C7C",
                  height: 18,
                  padding: 5,
                  position: "inherit",
                  borderRadius: "50px",
                  color: "white",
                  top: -6,
                  marginRight: 3
                }}
                badgeContent={ticket.queue?.name || "Sem fila"}
              //color="primary"
              />
            )}
          </span>
          {ticket.status === "open" && (
            <Tooltip title="Fechar Conversa">
              <ClearOutlinedIcon
                onClick={() => handleCloseTicket(ticket.id)}
                fontSize="small"
                className={classes.iconOnHover}
                style={{
                  color: '#fff',
                  backgroundColor: red[700],
                  cursor: "pointer",
                  //margin: '0 5 0 5',
                  padding: 2,
                  height: 23,
                  width: 23,
                  fontSize: 12,
                  borderRadius: 50,
                  position: 'absolute',
                  right: 8,
                  top: -8
                }}
              />
            </Tooltip>
          )}
          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AdbIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}

        </>
      );
    } else {
      return (
        <>
          {renderLinkedUsers()}

          {ticket.whatsappId && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={(whatsAppName || (ticket.whatsapp && ticket.whatsapp.name) || (Array.isArray(whatsApps) ? (whatsApps.find(w => parseInt(w.id) === parseInt(ticket.whatsappId))?.name || "") : ""))}
              style={{
                backgroundColor: "#21ba59ff",
                height: 18,
                padding: 5,
                position: "inherit",
                borderRadius: "50px",
                color: "white",
                top: -6,
                marginRight: 3,
                marginLeft: 7
              }}
            />
          )}

          {ticket.queue?.name !== null && (
            <Badge
              className={classes.Radiusdot}
              style={{
                //backgroundColor: ticket.queue?.color,
                backgroundColor: ticket.queue?.color || "#7C7C7C",
                height: 18,
                padding: 5,
                paddingHorizontal: 12,
                position: "inherit",
                borderRadius: "50px",
                color: "white",
                top: -6,
                marginRight: 2

              }}
              badgeContent={ticket.queue?.name || "Sem fila"}
            //color=
            />
          )}
          {ticket.status === "pending" && (
            <Tooltip title="Fechar Conversa">
              <ClearOutlinedIcon
                onClick={() => handleCloseTicket(ticket.id)}
                fontSize="small"
                className={classes.iconOnHover}
                style={{
                  color: '#fff',
                  backgroundColor: red[700],
                  cursor: "pointer",
                  margin: '0 5 0 5',
                  padding: 2,
                  height: 23,
                  width: 23,
                  fontSize: 12,
                  borderRadius: 50,
                  top: -12,
                  right: 15,
                  position: 'absolute',
                }}
              />
            </Tooltip>
          )}
          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AdbIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}
          {ticket.status === "open" && (
            <Tooltip title="Fechar Conversa">
              <ClearOutlinedIcon
                onClick={() => handleCloseTicket(ticket.id)}
                fontSize="small"
                className={classes.iconOnHover}
                style={{
                  color: red[700],
                  cursor: "pointer",
                  marginRight: 5,
                  right: 57,
                  top: -8,
                  position: 'absolute',
                }}
              />
            </Tooltip>
          )}
          {ticket.status === "pending" && (
            <Tooltip title="Aceitar Conversa">
              <DoneIcon
                onClick={() => handleAcepptTicket(ticket.id)}
                fontSize="small"
                className={classes.iconOnHover}
                style={{
                  color: '#fff',
                  backgroundColor: green[700],
                  cursor: "pointer",
                  //margin: '0 5 0 5',
                  padding: 2,
                  height: 23,
                  width: 23,
                  fontSize: 12,
                  borderRadius: 50,
                  right: -8,
                  top: -12,
                  position: 'absolute',
                }}
              />
            </Tooltip>
          )}


        </>
      );
    }
  };

  return (
    <React.Fragment key={ticket.id}>
      <ListItem
        dense
        button
        onClick={(e) => {
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
          [classes.unreadHighlight]: ticket.unreadMessages > 0,
        })}
      >
        <Tooltip
          arrow
          placement="right"
          title={
            currentTicketTags && currentTicketTags.length > 0
              ? `Tags: ${currentTicketTags.map(tag => tag.name).join(', ')}`
              : ticket.queue?.name || "Sem fila"
          }
        >
          <span
            style={{
              background: getTicketSidebarColor(),
              backgroundColor: getTicketSidebarColor().includes('gradient') ? 'transparent' : getTicketSidebarColor()
            }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip>

        <ListItemAvatar style={{ position: 'relative' }}>

          <Avatar
            src={ticket?.contact?.profilePicUrl}
            className={ticket?.contact?.isGroup ? classes.groupAvatar : ""}
          />
          {ticket.channel === "whatsapp" && (

            <WhatsAppIcon

              style={{
                position: 'inherit',
                top: -49,
                right: -54,
                fontSize: 20,
                color: '#25D366',
                backgroundColor: 'transparent',
                borderRadius: '50%',
                padding: 2,
              }}
            />

          )}


          <Typography component="span" className={classes.ticketNumber}>
            #{ticket.id}
          </Typography>
        </ListItemAvatar>

        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <span className={classes.ticketNameRow}>
                <Typography
                  noWrap
                  variant="body"
                  color="textPrimary"
                  style={{ marginRight: 4 }}
                >
                  {(ticket?.contact?.name || ticket?.contact?.number || "")}
                </Typography>
                {unreadCount > 0 && (
                  <Badge
                    badgeContent={unreadCount}
                    className={classes.unreadMessagesBadge}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <span style={{ width: 0, height: 0 }} />
                  </Badge>
                )}

              </span>
            </span>
          }
          secondary={
            <span className={classes.contactNameWrapper}>
              <Typography
                className={classes.contactLastMessage}
                noWrap
                component="span"
                variant="body2"
                color="textSecondary"
              > {(
                (typeof ticket?.lastMessage === 'string' ? ticket.lastMessage : '')
              ).includes('data:image/png;base64') ? (
                <MarkdownWrapper> Localização</MarkdownWrapper>
              ) : (
                <MarkdownWrapper>{typeof ticket?.lastMessage === 'string' ? ticket.lastMessage : ''}</MarkdownWrapper>
              )}
                {/* {ticket.lastMessage === "" ? <br /> : <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>} */}
              </Typography>
              <ListItemSecondaryAction style={{ left: 16 }}>
                <Box className={classes.ticketInfo1}>{renderTicketInfo()}</Box>
              </ListItemSecondaryAction>
            </span>
          }
        />
        <ListItemSecondaryAction style={{}}>
          {ticket.status === "closed" && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={"FECHADO"}
              //color="primary"
              style={{
                backgroundColor: ticket.queue?.color || "#b80000ff",
                height: 18,
                padding: "6px 6px 13px",
                paddingHorizontal: 12,
                borderRadius: "50px",
                color: "white",
                top: -35,
                marginRight: 10

              }}
            />
          )}

          {ticket.lastMessage && (
            <>

              <Typography
                className={classes.lastMessageTime}
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {ticket?.updatedAt ? (
                  isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                  ) : (
                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                  )
                ) : null}
              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={ticket.unreadMessages ? ticket.unreadMessages : null}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
              <br />

            </>
          )}

        </ListItemSecondaryAction>

      </ListItem>
    </React.Fragment>
  );
};

export default TicketListItemCustom;