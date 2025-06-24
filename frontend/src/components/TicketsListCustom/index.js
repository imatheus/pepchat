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
      const ticketIndex = newState.findIndex((t) => t.id === ticket.id);
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

    const ticketIndex = state.findIndex((t) => t.id === ticketId);
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState[ticketIndex] = { ...newState[ticketIndex], unreadMessages: 0 };
      return newState;
    }

    return state;
  }

  if (action.type === "ADD_TICKET") {
    const ticket = action.payload;
    
    console.log(`🎫 ADD_TICKET: Adding ticket ${ticket.id} with status ${ticket.status}`);
    
    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
    if (ticketIndex === -1) {
      // Adiciona novo ticket no topo da lista
      const newState = [ticket, ...state];
      console.log(`✅ ADD_TICKET: Added ticket ${ticket.id}, new state length: ${newState.length}`);
      return newState;
    } else {
      // Se o ticket já existe, atualizar com os novos dados
      console.log(`🔄 ADD_TICKET: Ticket ${ticket.id} already exists, updating it`);
      const newState = [...state];
      newState[ticketIndex] = ticket;
      
      // Se tem mensagens não lidas ou foi recém aceito, mover para o topo
      if (ticket.unreadMessages > 0 || ticket.status === "open") {
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
      const newState = [ticket, ...state];
      return newState;
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
      const newState = [ticket, ...state];
      return newState;
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
    console.log(`TicketsListCustom DELETE_TICKET: ticketId=${ticketId}, found at index=${ticketIndex}, current state length=${state.length}`);
    if (ticketIndex !== -1) {
      const newState = [...state];
      newState.splice(ticketIndex, 1);
      console.log(`TicketsListCustom DELETE_TICKET: Removed ticket, new state length=${newState.length}`);
      return newState;
    }

    return state;
  }

  if (action.type === "RESET") {
    return [];
  }
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
  } = props;
  const classes = useStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const [, setUpdate] = useState(0);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const [,] = useState([]);
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
  });

  useEffect(() => {
    console.log(`📥 TicketsListCustom(${status}): Loading tickets - received ${tickets.length} tickets`);
    
    const queueIds = queues.map((q) => q.id);
    console.log(`📥 TicketsListCustom(${status}): User queue IDs:`, queueIds);
    console.log(`📥 TicketsListCustom(${status}): Selected queue IDs:`, selectedQueueIds);
    
    // Filtrar tickets baseado nos setores selecionados
    let filteredTickets;
    
    if (selectedQueueIds.length === 0) {
      // Se nenhum setor está selecionado, mostrar todos os tickets
      filteredTickets = tickets;
    } else {
      filteredTickets = tickets.filter((t) => {
        // Se "no-queue" está selecionado e o ticket não tem fila
        if (selectedQueueIds.includes("no-queue") && !t.queueId) {
          return true;
        }
        // Se o ticket tem fila e ela está selecionada (excluindo "no-queue")
        if (t.queueId && selectedQueueIds.filter(id => id !== "no-queue").includes(t.queueId)) {
          return true;
        }
        return false;
      });
    }

    console.log(`📥 TicketsListCustom(${status}): Filtered tickets count: ${filteredTickets.length}`);

    // Sempre usar os tickets filtrados, independente do perfil
    console.log(`📥 TicketsListCustom(${status}): Loading filtered tickets for ${profile} profile`);
    dispatch({ type: "LOAD_TICKETS", payload: filteredTickets });
  }, [tickets, status, searchParam, queues, profile, selectedQueueIds]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const shouldUpdateTicket = (ticket) => {
      // Para tickets pending, todos os usuários devem ver novos tickets (sem userId)
      const userCheck = status === "pending" ? 
        (!ticket.userId || showAll) : 
        (!ticket.userId || ticket.userId === user?.id || showAll);
      
      // Verificar se o ticket deve ser mostrado baseado na seleção de filas
      let queueCheck;
      
      if (selectedQueueIds.length === 0) {
        // Se nenhum setor está selecionado, mostrar todos os tickets
        queueCheck = true;
      } else {
        // Se "no-queue" está selecionado e o ticket não tem fila
        if (selectedQueueIds.includes("no-queue") && !ticket.queueId) {
          queueCheck = true;
        }
        // Se o ticket tem fila e ela está selecionada (excluindo "no-queue")
        else if (ticket.queueId && selectedQueueIds.filter(id => id !== "no-queue").includes(ticket.queueId)) {
          queueCheck = true;
        }
        // Para tickets pending, também verificar as filas do usuário
        else if (status === "pending") {
          const userQueueIds = queues.map((q) => q.id);
          queueCheck = userQueueIds.indexOf(ticket.queueId) > -1;
        }
        else {
          queueCheck = false;
        }
      }
      const profileCheck = profile === "admin" || profile === "user";
      
      console.log(`🔍 TicketsListCustom(${status}): shouldUpdateTicket check for ticket ${ticket.id}:`, {
        userCheck,
        queueCheck,
        profileCheck,
        ticketUserId: ticket.userId,
        currentUserId: user?.id,
        ticketQueueId: ticket.queueId,
        selectedQueueIds,
        showAll,
        profile,
        status
      });
      
      return userCheck && queueCheck && profileCheck;
    };

    socket.on("connect", () => {
      console.log(`🔌 TicketsListCustom(${status}): Socket connected`);
      if (status) {
        console.log(`🔌 TicketsListCustom(${status}): Joining tickets room: ${status}`);
        socket.emit("joinTickets", status);
        // Também se conectar às notificações gerais para receber todos os eventos
        socket.emit("joinNotification");
      } else {
        console.log(`🔌 TicketsListCustom(${status}): Joining notification room`);
        socket.emit("joinNotification");
      }
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      console.log(`TicketsListCustom(${status}): Socket event received:`, data);
      
      if (data.action === "updateUnread") {
        dispatch({
          type: "RESET_UNREAD",
          payload: data.ticketId,
        });
      }

      if (data.action === "update") {
        console.log(`🎯 TicketsListCustom(${status}): Update event - ticket status: ${data.ticket.status}, list status: ${status}, ticket ID: ${data.ticket.id}`);
        
        // Se o status do ticket não corresponde ao status da lista atual
        if (data.ticket.status !== status) {
          console.log(`❌ TicketsListCustom(${status}): Ticket status changed from ${status} to ${data.ticket.status}`);
          
          // Se o ticket foi aceito (pending -> open) e estamos na lista "open", adicionar o ticket
          if (status === "open" && data.ticket.status === "open" && shouldUpdateTicket(data.ticket)) {
            console.log(`✅ TicketsListCustom(${status}): Adding accepted ticket to open list`);
            dispatch({
              type: "ADD_TICKET",
              payload: data.ticket,
            });
          } else {
            // Remover da lista atual se não pertence mais
            dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
          }
          return;
        }
        
        // Se o ticket pertence a esta lista, verifica se deve ser atualizado
        if (shouldUpdateTicket(data.ticket)) {
          console.log(`✅ TicketsListCustom(${status}): Updating ticket in list`);
          dispatch({
            type: "UPDATE_TICKET",
            payload: data.ticket,
          });
        } else {
          // Se não pertence mais ao usuário/fila, remove da lista
          console.log(`❌ TicketsListCustom(${status}): Deleting ticket (doesn't belong to user queues)`);
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
        }
      }

      if (data.action === "create") {
        console.log(`🎯 TicketsListCustom(${status}): Create event - ticket status: ${data.ticket.status}, list status: ${status}`);
        console.log(`🎯 TicketsListCustom(${status}): Full ticket data:`, data.ticket);
        
        if (data.ticket.status === status) {
          if (shouldUpdateTicket(data.ticket)) {
            console.log(`✅ TicketsListCustom(${status}): Adding new ticket to list`);
            dispatch({
              type: "ADD_TICKET",
              payload: data.ticket,
            });
          } else {
            console.log(`❌ TicketsListCustom(${status}): Ticket doesn't pass shouldUpdateTicket check`);
          }
        } else {
          console.log(`❌ TicketsListCustom(${status}): Ticket status ${data.ticket.status} doesn't match list status ${status}`);
        }
      }

      if (data.action === "delete") {
        console.log(`TicketsListCustom(${status}): Delete event for ticket ${data.ticketId}`);
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }

      if (data.action === "removeFromList") {
        console.log(`TicketsListCustom(${status}): RemoveFromList event for ticket ${data.ticketId}`);
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      console.log(`💬 TicketsListCustom(${status}): AppMessage event:`, data);
      
      const queueIds = queues.map((q) => q.id);
      console.log(`💬 TicketsListCustom(${status}): User queue IDs:`, queueIds);
      console.log(`💬 TicketsListCustom(${status}): Ticket queue ID:`, data.ticket.queue?.id);
      
      if (
        profile === "user" &&
        (queueIds.indexOf(data.ticket.queue?.id) === -1 ||
          data.ticket.queue === null)
      ) {
        console.log(`❌ TicketsListCustom(${status}): Message ignored - ticket not in user queues`);
        return;
      }

      if (data.action === "create" && shouldUpdateTicket(data.ticket)) {
        console.log(`✅ TicketsListCustom(${status}): Updating ticket with unread messages`);
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
    console.log(`🔢 TicketsListCustom(${status}): Updating count - ticketsList.length = ${ticketsList.length}`);
    console.log(`🔢 TicketsListCustom(${status}): Current tickets:`, ticketsList.map(t => ({ id: t.id, status: t.status, unreadMessages: t.unreadMessages })));
    
    if (typeof updateCount === "function") {
      updateCount(ticketsList.length);
      console.log(`🔢 TicketsListCustom(${status}): Called updateCount with ${ticketsList.length}`);
    } else {
      console.log(`⚠️ TicketsListCustom(${status}): updateCount is not a function:`, typeof updateCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketsList]);


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
