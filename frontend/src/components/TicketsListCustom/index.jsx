import React, { useState, useEffect, useReducer, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItemCustom";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles((theme) => ({
  ticketsListWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: "5px",
  },

  ticketsList: {
    flex: 1,
    maxHeight: "100%",
    overflowY: "scroll",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
    borderTop: "2px solid rgba(0, 0, 0, 0.12)",
  },

  ticketsListHeader: {
    color: "rgb(67, 83, 105)",
    zIndex: 2,
    backgroundColor: "white",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ticketsCount: {
    fontWeight: "normal",
    color: "rgb(104, 121, 146)",
    marginLeft: "8px",
    fontSize: "14px",
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

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_TICKETS") {
    const newTickets = action.payload;
    let newState = [...state];

    newTickets.forEach((ticket) => {
      const ticketIndex = newState.findIndex(
        (t) => parseInt(t.id) === parseInt(ticket.id)
      );
      if (ticketIndex !== -1) {
        newState[ticketIndex] = ticket;
        if (ticket.unreadMessages > 0) {
          const updatedTicket = newState.splice(ticketIndex, 1)[0];
          newState.unshift(updatedTicket);
        }
      } else {
        newState.push(ticket);
      }
    });

    return newState;
  }

  if (action.type === "RESET_UNREAD") {
    const ticketId = action.payload;
    const ticketIndex = state.findIndex(
      (t) => parseInt(t.id) === parseInt(ticketId)
    );
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState[ticketIndex] = { ...newState[ticketIndex], unreadMessages: 0 };
      return newState;
    }
    return state;
  }

  if (action.type === "ADD_TICKET") {
    const ticket = action.payload;
    // Se o ticket não pertence ao status desta lista, ignore para evitar duplicidade
    if (ticket.status !== action.listStatus) {
      return state;
    }

    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
    
    if (ticketIndex === -1) {
      // Evitar duplicata: se já existe por UUID, não re-adicionar
      const exists = state.some((t) => String(t.uuid) === String(ticket.uuid));
      if (exists) return state;
      // Adiciona novo ticket no topo da lista
      return [ticket, ...state];
    } else {
      // Se o ticket já existe, atualizar com os novos dados
      const newState = [...state];
      newState[ticketIndex] = ticket;
      
      // Se tem mensagens não lidas ou foi recém aceito, mover para o topo
      if (ticket.unreadMessages > 0 || ticket.status === action.listStatus) {
        const updatedTicket = newState.splice(ticketIndex, 1)[0];
        newState.unshift(updatedTicket);
      }
      
      return newState;
    }
  }

  if (action.type === "UPDATE_TICKET") {
    const ticket = action.payload;
    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
    
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState[ticketIndex] = ticket;
      // Se o ticket tem mensagens não lidas, move para o topo
      if (ticket.unreadMessages > 0) {
        const updatedTicket = newState.splice(ticketIndex, 1)[0];
        newState.unshift(updatedTicket);
      }
      return newState;
    } else {
      // Novo ticket sempre vai para o topo da lista
      return [ticket, ...state];
    }
  }

  if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
    const ticket = action.payload;
    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
    
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState[ticketIndex] = ticket;
      // Move ticket to top if it has unread messages
      const updatedTicket = newState.splice(ticketIndex, 1)[0];
      newState.unshift(updatedTicket);
      return newState;
    } else {
      // Evitar duplicata: se já existe por UUID, não re-adicionar
      const exists = state.some((t) => String(t.uuid) === String(ticket.uuid));
      return exists ? state : [ticket, ...state];
    }
  }

  if (action.type === "UPDATE_TICKET_CONTACT") {
    const contact = action.payload;
    const ticketIndex = state.findIndex((t) => t.contactId === contact.id);
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState[ticketIndex] = { ...newState[ticketIndex], contact };
      return newState;
    }
    return state;
  }

  if (action.type === "DELETE_TICKET") {
    const ticketId = action.payload;
    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticketId));
    
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState.splice(ticketIndex, 1);
      return newState;
    }
    return state;
  }

  if (action.type === "RESET") {
    return [];
  }

  return state;
};

const TicketsListCustom = (props) => {
  const {
    status,
    searchParam,
    tags,
    users,
    showAll,
    selectedQueueIds,
    updateCount,
    style,
    noTopDivider,
  } = props;
  
  const classes = useStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const [, setUpdate] = useState(0);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const { user } = useContext(AuthContext);
  const { refreshTickets } = useContext(TicketsContext);
  const { profile, queues } = user;

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [status, searchParam, dispatch, showAll, tags, users, selectedQueueIds, refreshTickets]);

  const { tickets, hasMore, loading } = useTickets({
    pageNumber,
    searchParam,
    status,
    showAll,
    tags: JSON.stringify(tags),
    users: JSON.stringify(users),
    queueIds: JSON.stringify(selectedQueueIds),
    updatedAt: refreshTickets,
  });

  useEffect(() => {
    // Filtrar tickets baseado nos setores selecionados
    let filteredTickets;
    
    if (selectedQueueIds.length === 0) {
      filteredTickets = tickets;
    } else {
      filteredTickets = tickets.filter((t) => {
        if (selectedQueueIds.includes("no-queue") && !t.queueId) {
          return true;
        }
        if (t.queueId && selectedQueueIds.filter(id => id !== "no-queue").includes(t.queueId)) {
          return true;
        }
        return false;
      });
    }

    dispatch({ type: "LOAD_TICKETS", payload: filteredTickets });
  }, [tickets, status, searchParam, queues, profile, selectedQueueIds]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const shouldUpdateTicket = (ticket) => {
      // Para tickets pending, todos os usuários devem ver novos tickets (sem userId)
      const linkedToUser = Array.isArray(ticket.users) && ticket.users.some(u => u.id === user?.id);
      const userCheck = status === "pending" ? 
        true : 
        (!ticket.userId || ticket.userId === user?.id || linkedToUser || showAll);
      
      // Verificar se o ticket deve ser mostrado baseado na seleção de filas
      let queueCheck;
      
      if (selectedQueueIds.length === 0) {
        queueCheck = true;
      } else {
        if (selectedQueueIds.includes("no-queue") && !ticket.queueId) {
          queueCheck = true;
        }
        else if (ticket.queueId && selectedQueueIds.filter(id => id !== "no-queue").includes(ticket.queueId)) {
          queueCheck = true;
        }
        else if (status === "pending") {
          const userQueueIds = queues.map((q) => q.id);
          // Para tickets pending, incluir tickets sem fila (queueId null) se o usuário tem filas
          queueCheck = !ticket.queueId ? (userQueueIds.length > 0) : (userQueueIds.indexOf(ticket.queueId) > -1);
        }
        else {
          queueCheck = false;
        }
      }
      
      const profileCheck = profile === "admin" || profile === "user";
      return userCheck && queueCheck && profileCheck;
    };

    socket.on("connect", () => {
      if (status) {
        socket.emit("joinTickets", status);
        socket.emit("joinNotification");
      } else {
        socket.emit("joinNotification");
      }
      // Solicitar sincronização imediata (comentário explicativo, backend ignora se não usar)
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "updateUnread") {
        dispatch({
          type: "RESET_UNREAD",
          payload: data.ticketId,
        });
      }

      if (data.action === "update") {
        // Evitar duplicidade entre listas: sempre manter apenas na lista do status correspondente
        if (data.ticket.status !== status) {
          // Se o ticket foi aceito (pending -> open) e estamos na lista "open", adicionar o ticket
          if (status === "open" && data.ticket.status === "open" && shouldUpdateTicket(data.ticket)) {
            dispatch({
              type: "ADD_TICKET",
              payload: data.ticket,
              listStatus: "open",
            });
          }
          // Em qualquer outro caso, remover da lista atual porque o status diverge
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
          return;
        }
        
        // Se o ticket pertence a esta lista, verifica se deve ser atualizado
        if (shouldUpdateTicket(data.ticket)) {
          dispatch({
            type: "UPDATE_TICKET",
            payload: data.ticket,
          });
        } else {
          // Se não pertence mais ao usuário/fila, remove da lista
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
        }
      }

      if (data.action === "create") {
        if (data.ticket.status === status && shouldUpdateTicket(data.ticket)) {
          dispatch({
            type: "ADD_TICKET",
            payload: data.ticket,
            listStatus: status,
          });
        }
      }

      if (data.action === "delete" || data.action === "removeFromList") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      const queueIds = queues.map((q) => q.id);
      
      if (
        profile === "user" &&
        (queueIds.indexOf(data.ticket.queue?.id) === -1 ||
          data.ticket.queue === null)
      ) {
        return;
      }

      // Evitar duplicidade: só processar mensagens na lista correspondente ao status do ticket
      if (data.action === "create" && shouldUpdateTicket(data.ticket) && data.ticket.status === status) {
        dispatch({
          type: "UPDATE_TICKET_UNREAD_MESSAGES",
          payload: data.ticket,
        });
      }
    });

    socket.on(`company-${companyId}-contact`, (data) => {
      if (data.action === "update") {
        dispatch({
          type: "UPDATE_TICKET_CONTACT",
          payload: data.contact,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [status, showAll, user, selectedQueueIds, tags, users, profile, queues]);

  useEffect(() => {
    if (typeof updateCount === "function") {
      updateCount(ticketsList.length);
    }
  }, [ticketsList, updateCount]);

  // Remoção otimista do ticket da lista quando aceito/fechado
  useEffect(() => {
    const onTicketAccepted = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (!ticketId) return;
      if (status === "pending") {
        dispatch({ type: "DELETE_TICKET", payload: ticketId });
      }
    };
    const onTicketClosed = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (!ticketId) return;
      if (status === "open") {
        dispatch({ type: "DELETE_TICKET", payload: ticketId });
      }
    };
    const onTicketReopened = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (!ticketId) return;
      if (status === "closed") {
        dispatch({ type: "DELETE_TICKET", payload: ticketId });
      }
    };
    window.addEventListener('ticket-accepted', onTicketAccepted);
    window.addEventListener('ticket-closed', onTicketClosed);
    window.addEventListener('ticket-reopened', onTicketReopened);
    return () => {
      window.removeEventListener('ticket-accepted', onTicketAccepted);
      window.removeEventListener('ticket-closed', onTicketClosed);
      window.removeEventListener('ticket-reopened', onTicketReopened);
    };
  }, [status]);


  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <Paper className={classes.ticketsListWrapper} style={style}>
      <Paper
        square
        name="closed"
        elevation={0}
        className={classes.ticketsList}
        onScroll={handleScroll}
        style={noTopDivider ? { borderTop: 'none' } : undefined}
      >
        <List style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
          {ticketsList.length === 0 && !loading ? (
            <div className={classes.noTicketsDiv}>
              <span className={classes.noTicketsTitle}>
                {i18n.t("ticketsList.noTicketsTitle")}
              </span>
              <p className={classes.noTicketsText}>
                {i18n.t("ticketsList.noTicketsMessage")}
              </p>
            </div>
          ) : (
            <>
              {ticketsList.map((ticket) => (
                <TicketListItem ticket={ticket} setUpdate={setUpdate} key={ticket.id} />
              ))}
            </>
          )}
          {loading && <TicketsListSkeleton />}
        </List>
      </Paper>
    </Paper>
  );
};

export default TicketsListCustom;