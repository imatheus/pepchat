import React, { useContext, useEffect, useReducer, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItemCustom";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
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
}));

const sortTickets = (arr) => {
  // Sort by updatedAt desc; keep stable fallback by id
  return [...arr].sort((a, b) => {
    const ta = new Date(a.updatedAt || 0).getTime();
    const tb = new Date(b.updatedAt || 0).getTime();
    if (tb !== ta) return tb - ta;
    return (b.id || 0) - (a.id || 0);
  });
};

const reducer = (state, action) => {
  switch (action.type) {
    case "RESET":
      return [];
    case "LOAD_TICKETS": {
      const incoming = action.payload || [];
      const next = [...state];
      incoming.forEach((ticket) => {
        if (ticket.status !== "open" && ticket.status !== "pending") return;
        const idx = next.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
        if (idx !== -1) {
          next[idx] = ticket;
        } else {
          const exists = next.some((t) => String(t.uuid) === String(ticket.uuid));
          if (!exists) next.push(ticket);
        }
      });
      return sortTickets(next);
    }
    case "UPDATE_TICKET": {
      const ticket = action.payload;
      const next = [...state];
      const idx = next.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
      if (ticket.status !== "open" && ticket.status !== "pending") {
        // remove from unified list if status no longer in open/pending
        if (idx !== -1) next.splice(idx, 1);
        return sortTickets(next);
      }
      if (idx !== -1) {
        next[idx] = ticket;
      } else {
        const exists = next.some((t) => String(t.uuid) === String(ticket.uuid));
        if (!exists) next.unshift(ticket);
      }
      return sortTickets(next);
    }
    case "UPDATE_TICKET_CONTACT": {
      const contact = action.payload;
      const idx = state.findIndex((t) => t.contactId === contact.id);
      if (idx !== -1) {
        const next = [...state];
        next[idx] = { ...next[idx], contact };
        return next;
      }
      return state;
    }
    case "DELETE_TICKET": {
      const ticketId = action.payload;
      const idx = state.findIndex((t) => parseInt(t.id) === parseInt(ticketId));
      if (idx !== -1) {
        const next = [...state];
        next.splice(idx, 1);
        return next;
      }
      return state;
    }
    default:
      return state;
  }
};

const UnifiedTicketsList = ({
  searchParam,
  tags,
  users,
  showAll,
  selectedQueueIds,
  noTopDivider,
}) => {
  const classes = useStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const { user } = useContext(AuthContext);
  const { refreshTickets } = useContext(TicketsContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, showAll, tags, users, selectedQueueIds, refreshTickets]);

  // Fetch both open and pending
  const openQuery = useTickets({
    pageNumber,
    searchParam,
    status: "open",
    showAll,
    tags: JSON.stringify(tags),
    users: JSON.stringify(users),
    queueIds: JSON.stringify(selectedQueueIds),
    updatedAt: refreshTickets,
  });
  const pendingQuery = useTickets({
    pageNumber,
    searchParam,
    status: "pending",
    showAll,
    tags: JSON.stringify(tags),
    users: JSON.stringify(users),
    queueIds: JSON.stringify(selectedQueueIds),
    updatedAt: refreshTickets,
  });

  const loading = openQuery.loading || pendingQuery.loading;
  const hasMore = openQuery.hasMore || pendingQuery.hasMore;

  useEffect(() => {
    const combined = []
      .concat(openQuery.tickets || [])
      .concat(pendingQuery.tickets || []);
    if (combined.length) {
      dispatch({ type: "LOAD_TICKETS", payload: combined });
    }
  }, [openQuery.tickets, pendingQuery.tickets]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const shouldUpdateTicket = (ticket) => {
      // open or pending only
      if (ticket.status !== "open" && ticket.status !== "pending") return false;

      // queues filter
      if (!selectedQueueIds || selectedQueueIds.length === 0) return true;
      if (selectedQueueIds.includes("no-queue") && !ticket.queueId) return true;
      if (ticket.queueId && selectedQueueIds.filter(id => id !== "no-queue").includes(ticket.queueId)) return true;
      return false;
    };

    socket.on("connect", () => {
      socket.emit("joinTickets", "open");
      socket.emit("joinTickets", "pending");
      socket.emit("joinNotification");
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "update") {
        if (shouldUpdateTicket(data.ticket)) {
          dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
        } else {
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
        }
      }

      if (data.action === "create") {
        if (shouldUpdateTicket(data.ticket)) {
          dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
        }
      }

      if (data.action === "delete" || data.action === "removeFromList") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (shouldUpdateTicket(data.ticket) && data.action === "create") {
        dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
      }
    });

    socket.on(`company-${companyId}-contact`, (data) => {
      if (data.action === "update") {
        dispatch({ type: "UPDATE_TICKET_CONTACT", payload: data.contact });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [showAll, user, selectedQueueIds]);

  const loadMore = () => setPageNumber((prev) => prev + 1);

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  // Remoção otimista ao fechar/resolver e ao reabrir
  useEffect(() => {
    const onTicketClosed = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (!ticketId) return;
      // A lista unificada mostra open + pending; ao fechar deve remover
      dispatch({ type: "DELETE_TICKET", payload: ticketId });
    };
    const onTicketReopened = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (!ticketId) return;
      // Quando reabre, deve remover dos arquivados; na unificada não há "closed",
      // então não é necessário aqui. Este listener é no caso de reaproveitamento futuro.
    };
    window.addEventListener('ticket-closed', onTicketClosed);
    window.addEventListener('ticket-reopened', onTicketReopened);
    return () => {
      window.removeEventListener('ticket-closed', onTicketClosed);
      window.removeEventListener('ticket-reopened', onTicketReopened);
    };
  }, []);

  return (
    <Paper className={classes.ticketsListWrapper}>
      <Paper
        square
        name="unified"
        elevation={0}
        className={classes.ticketsList}
        onScroll={handleScroll}
        style={noTopDivider ? { borderTop: 'none' } : undefined}
      >
        <List style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
          {/* Sem cabeçalhos ou mensagens de vazio para a visualização unificada */}
          {ticketsList.map((ticket) => (
            <TicketListItem ticket={ticket} key={ticket.id} />
          ))}
          {loading && <TicketsListSkeleton />}
        </List>
      </Paper>
    </Paper>
  );
};

export default UnifiedTicketsList;
