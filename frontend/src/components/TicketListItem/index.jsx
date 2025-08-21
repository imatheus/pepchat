import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";

import { i18n } from "../../translate/i18n";
import { getThemeColors, hexToRgba } from "../../styles/colors";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles((theme) => {
  const themeColors = getThemeColors(theme.palette.type === 'dark');
  return ({
  ticket: {
    position: "relative",
  },

  pendingTicket: {
    cursor: "unset",
    backgroundColor: hexToRgba(themeColors.primary.main, 0.18),
    borderLeft: `4px solid ${themeColors.primary.main}`,
  },

  // Destaque visual para não lidos
  unreadHighlight: {
    backgroundColor: hexToRgba(themeColors.primary.main, 0.18),
    borderLeft: `4px solid ${themeColors.primary.main}`,
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  contactNameWrapper: {
    display: "flex",
    justifyContent: "space-between",
  },

  lastMessageTime: {
    justifySelf: "flex-end",
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto",
  },

  contactLastMessage: {
    paddingRight: 20,
  },

  newMessagesCount: {
    alignSelf: "center",
    marginRight: 8,
    marginLeft: "auto",
  },

  badgeStyle: {
    color: "white",
    backgroundColor: green[500],
  },

  acceptButton: {
    position: "absolute",
    left: "50%",
  },

  ticketQueueColor: {
    flex: "none",
    width: "8px",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
  },

  groupAvatar: {
    "& .MuiAvatar-colorDefault": {
      color: "#7c7c7c !important",
      backgroundColor: "#e4e4e4 !important",
    },
    color: "#7c7c7c !important",
    backgroundColor: "#e4e4e4 !important",
  },

  // Badge de mensagens não lidas ao lado do nome do contato
  unreadMessagesBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: themeColors.primary.main,
      color: "white",
      marginTop:"10px",
      fontSize: "10px",
      height: "16px",
      minWidth: "10px",
      borderRadius: "8px",
      padding: "0 4px",
      fontWeight: 600,
      transform: "scale(0.9) translate(50%, -50%)",
      border: `1px solid ${theme.palette.background.paper}`,
    },
  },
  });
});

const TicketListItem = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);
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

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // NOVA FUNCIONALIDADE: Sincronizar contador com dados do ticket
  useEffect(() => {
    // Só sincronizar se o valor do backend for MAIOR que o local
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
  
  // NOVA FUNCIONALIDADE: Escutar eventos de socket para controlar a bolinha
  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    // Escutar eventos de mensagens
    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "update" && data.ticket && data.ticket.id === ticket.id) {
        // Atualizar contador com base no ticket atualizado
        if (data.ticket.unreadMessages !== undefined) {
          setUnreadCount(data.ticket.unreadMessages || 0);
        }
      }
      
      // Zerar contador quando mensagens forem marcadas como lidas
      if (data.action === "updateUnread" && data.ticketId === ticket.id) {
        setUnreadCount(0);
      }
    });
    
    // Incrementar contador quando chegar nova mensagem
    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (
        data.action === "create" &&
        data.ticket.id === ticket.id &&
        !data.message.read &&
        data.message.fromMe === false // Apenas mensagens recebidas, não enviadas
      ) {
        setUnreadCount(prevCount => prevCount + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticket.id]);

  const handleAcepptTicket = async (ticket) => {
    setLoading(true);
    try {
      // Disparo otimista: remover da lista de "Aguardando" e adicionar imediatamente em "Abertos"
      try {
        window.dispatchEvent(
          new CustomEvent('ticket-accepted', {
            detail: {
              ticketId: ticket.id,
              ticketUuid: ticket.uuid,
              // Enviar o objeto completo para permitir inserção otimista na lista de "Abertos"
              ticket: {
                ...ticket,
                status: 'open',
                userId: user?.id,
                user: user || ticket.user,
                unreadMessages: 0, // Remover destaque opaco imediatamente
              },
            },
          })
        );
      } catch (e) { /* noop */ }

      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
      });

      // Limpar contador local de não lidas para este ticket (remove badges residuais)
      try {
        const companyId = localStorage.getItem("companyId");
        const userId = localStorage.getItem("userId");
        if (companyId && userId && ticket?.id) {
          localStorage.removeItem(`unreadCount_${companyId}_${userId}_${ticket.id}`);
        }
      } catch (e) { /* noop */ }
      // Garantir que o badge de não lidas deste item suma imediatamente
      try {
        setUnreadCount(0);
      } catch (e) { /* noop */ }
    } catch (err) {
      setLoading(false);
      // Reverter inserção otimista se a API falhar
      try {
        window.dispatchEvent(new CustomEvent('ticket-accept-failed', { detail: { ticketId: ticket.id, ticketUuid: ticket.uuid } }));
      } catch (e) { /* noop */ }
      // Mostrar mensagem do backend se existir, ou mensagem padrão para aceitar sem fila
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
      if (backendMsg) {
        toastError({ message: backendMsg });
      } else {
        toastError({ message: "Não é possível aceitar um ticket sem fila" });
      }
      return;
    }
    if (isMounted.current) {
      setLoading(false);
    }
    history.push(`/tickets/${ticket.uuid}`);
  };

  const handleSelectTicket = (ticket) => {
    history.push(`/tickets/${ticket.uuid}`);
    
    // NOVA FUNCIONALIDADE: Zerar contador quando ticket for selecionado
    setUnreadCount(0);
  };

  return (
    <React.Fragment key={ticket.id}>
      <ListItem
        dense
        button
        onClick={(e) => {
          if (ticket.status === "pending") return;
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
          title={ticket.queue?.name || "Sem fila"}
        >
          <span
            style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip>
        <ListItemAvatar>
          <Avatar 
            src={ticket?.contact?.profilePicUrl}
            className={ticket?.contact?.isGroup ? classes.groupAvatar : ""}
          />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
                style={{ marginRight: 4 }}
              >
                {ticket?.contact?.name || ticket?.contact?.number || ""}
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
              {ticket.status === "closed" && (
                <Badge
                  className={classes.closedBadge}
                  badgeContent={"closed"}
                  color="primary"
                />
              )}
              {ticket.lastMessage && (
                <Typography
                  className={classes.lastMessageTime}
                  component="span"
                  variant="body2"
                  color="textSecondary"
                >
                  {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                  ) : (
                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                  )}
                </Typography>
              )}
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
              >
                {ticket.lastMessage ? (
                  <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                ) : (
                  <br />
                )}
              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={ticket.unreadMessages}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
            </span>
          }
        />
        {ticket.status === "pending" && (
          <ButtonWithSpinner
            color="primary"
            variant="contained"
            className={classes.acceptButton}
            size="small"
            loading={loading}
            onClick={(e) => handleAcepptTicket(ticket)}
          >
            {i18n.t("ticketsList.buttons.accept")}
          </ButtonWithSpinner>
        )}
      </ListItem>
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItem;