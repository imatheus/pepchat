import React, { useState, useEffect, useReducer, useContext, useRef } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItem";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { ListSubheader } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { socketConnection } from "../../services/socket";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

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
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    borderTop: "2px solid rgba(0, 0, 0, 0.12)",
  },

  ticketsListHeader: {
    color: theme.palette.text.secondary,
    zIndex: 2,
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
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
    const incoming = action.payload || [];
    const listStatus = action.listStatus;
    const newState = [...state];

    incoming.forEach((ticket) => {
      // Não adicionar tickets que não pertencem ao status da lista
      if (listStatus && ticket.status !== listStatus) {
        return;
      }
      
      const idx = newState.findIndex(
        (t) => parseInt(t.id) === parseInt(ticket.id)
      );
      if (idx !== -1) {
        // Merge preservando campos críticos quando update vier parcial/nulo
        const merged = { ...newState[idx], ...ticket };
        if ((ticket.contact === null || ticket.contact === undefined) && newState[idx].contact) {
          merged.contact = newState[idx].contact;
        } else if (ticket.contact && newState[idx].contact) {
          merged.contact = { ...newState[idx].contact, ...ticket.contact };
        }
        if ((ticket.queue === null || ticket.queue === undefined) && newState[idx].queue) {
          merged.queue = newState[idx].queue;
        } else if (ticket.queue && newState[idx].queue) {
          merged.queue = { ...newState[idx].queue, ...ticket.queue };
        }
        if ((ticket.whatsapp === null || ticket.whatsapp === undefined) && newState[idx].whatsapp) {
          merged.whatsapp = newState[idx].whatsapp;
        } else if (ticket.whatsapp && newState[idx].whatsapp) {
          merged.whatsapp = { ...newState[idx].whatsapp, ...ticket.whatsapp };
        }
        newState[idx] = merged;
        if (ticket.unreadMessages > 0) {
          newState.unshift(newState.splice(idx, 1)[0]);
        }
      } else {
        // Evitar duplicata por UUID
        const exists = newState.some((t) => String(t.uuid) === String(ticket.uuid));
        if (!exists) newState.push(ticket);
      }
    });

    return newState;
  }

  if (action.type === "RESET_UNREAD") {
    const ticketId = action.payload;

    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticketId));
    if (ticketIndex !== -1) {
      state[ticketIndex].unreadMessages = 0;
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET") {
    const ticket = action.payload;

    // Verificar se o ticket ainda pertence a esta lista baseado no status
    if (action.listStatus && ticket.status !== action.listStatus) {
      const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
      if (ticketIndex !== -1) {
        state.splice(ticketIndex, 1);
      }
      return [...state];
    }

    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
    if (ticketIndex !== -1) {
      // Merge preservando contact, whatsapp, queue ao receber parciais
      const prev = state[ticketIndex];
      const merged = { ...prev, ...ticket };
      if ((ticket.contact === null || ticket.contact === undefined) && prev.contact) {
        merged.contact = prev.contact;
      } else if (ticket.contact && prev.contact) {
        merged.contact = { ...prev.contact, ...ticket.contact };
      }
      if ((ticket.queue === null || ticket.queue === undefined) && prev.queue) {
        merged.queue = prev.queue;
      } else if (ticket.queue && prev.queue) {
        merged.queue = { ...prev.queue, ...ticket.queue };
      }
      if ((ticket.whatsapp === null || ticket.whatsapp === undefined) && prev.whatsapp) {
        merged.whatsapp = prev.whatsapp;
      } else if (ticket.whatsapp && prev.whatsapp) {
        merged.whatsapp = { ...prev.whatsapp, ...ticket.whatsapp };
      }
      state[ticketIndex] = merged;
    } else {
      // Só adicionar se o status corresponder à lista ou se não foi especificado
      if (!action.listStatus || ticket.status === action.listStatus) {
        const exists = state.some((t) => String(t.uuid) === String(ticket.uuid));
        if (!exists) state.unshift(ticket);
      }
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
    const ticket = action.payload;

    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticket.id));
    if (ticketIndex !== -1) {
      const prev = state[ticketIndex];
      const merged = { ...prev, ...ticket };
      if ((ticket.contact === null || ticket.contact === undefined) && prev.contact) {
        merged.contact = prev.contact;
      } else if (ticket.contact && prev.contact) {
        merged.contact = { ...prev.contact, ...ticket.contact };
      }
      if ((ticket.queue === null || ticket.queue === undefined) && prev.queue) {
        merged.queue = prev.queue;
      } else if (ticket.queue && prev.queue) {
        merged.queue = { ...prev.queue, ...ticket.queue };
      }
      if ((ticket.whatsapp === null || ticket.whatsapp === undefined) && prev.whatsapp) {
        merged.whatsapp = prev.whatsapp;
      } else if (ticket.whatsapp && prev.whatsapp) {
        merged.whatsapp = { ...prev.whatsapp, ...ticket.whatsapp };
      }
      state[ticketIndex] = merged;
      state.unshift(state.splice(ticketIndex, 1)[0]);
    } else {
      const exists = state.some((t) => String(t.uuid) === String(ticket.uuid));
      if (!exists) state.unshift(ticket);
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_CONTACT") {
    const contact = action.payload;
    const ticketIndex = state.findIndex((t) => t.contactId === contact.id);
    if (ticketIndex !== -1) {
      state[ticketIndex].contact = contact;
    }
    return [...state];
  }

  if (action.type === "DELETE_TICKET") {
    const ticketId = action.payload;
    const ticketIndex = state.findIndex((t) => parseInt(t.id) === parseInt(ticketId));
    if (ticketIndex !== -1) {
      state.splice(ticketIndex, 1);
      }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const TicketsList = ({
  status,
  searchParam,
  tags,
  showAll,
  selectedQueueIds,
  noTopDivider,
}) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { refreshTickets, triggerRefresh, getCachedList, setCachedList, updateCacheMeta } = useContext(TicketsContext);

  // Build cache key before state init
  const cacheKey = JSON.stringify({
    view: 'ticketsList',
    status,
    searchParam: searchParam || '',
    showAll: !!showAll,
    queueIds: selectedQueueIds || []
  });
  const cached = getCachedList(cacheKey);

  // Progressive rendering to optimize initial paint on slow networks
  const initialChunk = 12;
  const stepChunk = 12;
  const initialTickets = Array.isArray(cached?.list) ? cached.list : [];
  const initialPage = cached?.pageNumber || 1;
  const [ticketsList, dispatch] = useReducer(reducer, initialTickets);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [visibleCount, setVisibleCount] = useState(Math.min(initialChunk, initialTickets.length) || initialChunk);


  useEffect(() => {
    // when filters change, if no cache for new key, reset and fetch
    const cachedNow = getCachedList(cacheKey);
    if (!(cachedNow && Array.isArray(cachedNow.list) && cachedNow.list.length > 0)) {
      dispatch({ type: 'RESET' });
      setPageNumber(1);
      setVisibleCount(initialChunk);
    }
  }, [cacheKey]);

  const { tickets, hasMore, loading } = useTickets({
    pageNumber,
    searchParam,
    tags: JSON.stringify(tags),
    status,
    showAll,
    queueIds: JSON.stringify(selectedQueueIds),
    updatedAt: refreshTickets,
  });

  useEffect(() => {
    if (!status && !searchParam) return;
    if (Array.isArray(tickets) && tickets.length > 0) {
      dispatch({ type: 'LOAD_TICKETS', payload: tickets, listStatus: status });
      // update cache with merged list from reducer on next tick
      setTimeout(() => {
        // Merge unique by id using latest ticketsList snapshot
        const merged = [];
        const seen = new Set();
        [...ticketsList, ...tickets].forEach(t => {
          const id = String(t.id);
          if (!seen.has(id)) {
            seen.add(id);
            merged.push(t);
          }
        });
        setCachedList(cacheKey, merged, { pageNumber, hasMore });
      }, 0);
    }
  }, [tickets, status, searchParam]);

  // Increase visible items progressively without blocking main thread
  useEffect(() => {
    if (ticketsList.length > visibleCount) {
      const schedule = () => setVisibleCount((prev) => Math.min(prev + stepChunk, ticketsList.length));
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = window.requestIdleCallback(schedule, { timeout: 300 });
        return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
      } else {
        const t = setTimeout(schedule, 50);
        return () => clearTimeout(t);
      }
    }
  }, [ticketsList.length, visibleCount]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const shouldUpdateTicket = (ticket) =>
      (
        !ticket.userId || 
        ticket.userId === user?.id || 
        (Array.isArray(ticket.users) && ticket.users.some(u => u.id === user?.id)) || 
        showAll
      ) &&
      (!ticket.queueId || selectedQueueIds.indexOf(ticket.queueId) > -1);

    // Rastrear tickets aceitos de forma otimista para evitar piscar/remover antes do backend confirmar
    const acceptedOptimistic = new Set();

    const handleAccepted = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (ticketId) {
        acceptedOptimistic.add(parseInt(ticketId));
        // Limpeza após 6s para evitar manter para sempre
        setTimeout(() => acceptedOptimistic.delete(parseInt(ticketId)), 6000);
      }
    };
    window.addEventListener('ticket-accepted', handleAccepted);

    socket.on("connect", () => {
      if (status) {
        socket.emit("joinTickets", status);
      } else {
        socket.emit("joinNotification");
      }
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "updateUnread") {
        dispatch({
          type: "RESET_UNREAD",
          payload: data.ticketId,
        });
      }

      // Novo: tratar criação de ticket (ex.: reaberto pelo backend)
      if (data.action === "create") {
        if (data.ticket && data.ticket.status === status && shouldUpdateTicket(data.ticket)) {
          // UPDATE_TICKET já insere se não existir
          dispatch({
            type: "UPDATE_TICKET",
            payload: data.ticket,
            listStatus: status,
          });
        }
      }

      if (data.action === "update") {
        // Se o backend enviar uma atualização intermediária ainda como "pending"
        // NÃO remover da lista "Abertos" se acabamos de aceitar esse ticket
        const isOptimisticallyAccepted = acceptedOptimistic.has(parseInt(data.ticket.id));

        // Remover se foi fechado e estamos em listas abertas/pendentes
        if (data.ticket.status === "closed" && (status === "open" || status === "pending")) {
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
          return;
        }
        
        if (shouldUpdateTicket(data.ticket)) {
          if (data.ticket.status === status) {
            dispatch({
              type: "UPDATE_TICKET",
              payload: data.ticket,
              listStatus: status,
            });
          } else {
            // Exceção: se estamos na lista "Abertos" e este ticket foi aceito otimisticamente,
            // ignore a remoção até o backend confirmar o status "open" para evitar piscar
            if (!(status === "open" && isOptimisticallyAccepted)) {
              dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
            }
          }
        } else {
          if (!(status === "open" && isOptimisticallyAccepted)) {
            dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
          }
        }
      }

      if (data.action === "delete") {
        const isOptimisticallyAccepted = acceptedOptimistic.has(parseInt(data.ticketId));
        if (!(status === "open" && isOptimisticallyAccepted)) {
          dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
        }
      }

      if (data.action === "removeFromList") {
        const isOptimisticallyAccepted = acceptedOptimistic.has(parseInt(data.ticketId));
        if (!(status === "open" && isOptimisticallyAccepted)) {
          dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
        }
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      const isFromMe = data?.message?.fromMe === true;
      if (isFromMe) return;
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
      window.removeEventListener('ticket-accepted', handleAccepted);
      socket.disconnect();
    };
  }, [status, showAll, user, selectedQueueIds]);

  const loadMore = () => {
    const next = (pageNumber || 1) + 1;
    setPageNumber(next);
    updateCacheMeta(cacheKey, { pageNumber: next });
  };


  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Reveal more already-fetched items as the user scrolls
    const nearEndReveal = 300;
    if (scrollHeight - (scrollTop + nearEndReveal) < clientHeight) {
      if (visibleCount < ticketsList.length) {
        setVisibleCount((v) => Math.min(v + stepChunk, ticketsList.length));
      } else if (hasMore && !loading) {
        loadMore();
      }
    }
  };

  useEffect(() => {
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
    const onTicketAccepted = (e) => {
      const { ticketId, ticket } = (e && e.detail) || {};
      if (!ticketId) return;
      if (status === "pending") {
        dispatch({ type: "DELETE_TICKET", payload: ticketId });
      }
      if (status === "open" && ticket) {
        let queueOk = true;
        if (Array.isArray(selectedQueueIds) && selectedQueueIds.length > 0) {
          const includesNoQueue = selectedQueueIds.includes("no-queue");
          if (!ticket.queueId) {
            queueOk = includesNoQueue || selectedQueueIds.length === 0;
          } else {
            queueOk = selectedQueueIds.filter(id => id !== "no-queue").includes(ticket.queueId);
          }
        }
        if (queueOk) {
          const normalized = { ...ticket, unreadMessages: 0 };
          dispatch({ type: "UPDATE_TICKET", payload: normalized, listStatus: "open" });
        }
      }
    };
    const onTicketAcceptFailed = (e) => {
      const { ticketId } = (e && e.detail) || {};
      if (!ticketId) return;
      if (status === "open") {
        dispatch({ type: "DELETE_TICKET", payload: ticketId });
      }
    };
    const onTicketOwnerUpdated = (e) => {
      const { ticketId, user } = (e && e.detail) || {};
      if (!ticketId || !user) return;
      // Atualização pontual do dono do ticket na lista
      dispatch({ type: "UPDATE_TICKET", payload: { id: ticketId, userId: user.id, user }, listStatus: status });
    };
    window.addEventListener('ticket-closed', onTicketClosed);
    window.addEventListener('ticket-reopened', onTicketReopened);
    window.addEventListener('ticket-accepted', onTicketAccepted);
    window.addEventListener('ticket-accept-failed', onTicketAcceptFailed);
    window.addEventListener('ticket-owner-updated', onTicketOwnerUpdated);
    return () => {
      window.removeEventListener('ticket-closed', onTicketClosed);
      window.removeEventListener('ticket-reopened', onTicketReopened);
      window.removeEventListener('ticket-accepted', onTicketAccepted);
      window.removeEventListener('ticket-accept-failed', onTicketAcceptFailed);
      window.removeEventListener('ticket-owner-updated', onTicketOwnerUpdated);
    };
  }, [status, selectedQueueIds]);

  return (
    <div className={classes.ticketsListWrapper}>
      <Paper
        square
        name="closed"
        elevation={0}
        className={classes.ticketsList}
        onScroll={handleScroll}
        style={noTopDivider ? { borderTop: 'none' } : undefined}
      >
        <List style={{ paddingTop: 0 }}>
          {status === "open" && (
            <ListSubheader className={classes.ticketsListHeader}>
              <div>
                {i18n.t("ticketsList.assignedHeader")}
                <span className={classes.ticketsCount}>
                  {ticketsList.length}
                </span>
              </div>
            </ListSubheader>
          )}
          {status === "pending" && (
            <ListSubheader className={classes.ticketsListHeader}>
              <div>
                {i18n.t("ticketsList.pendingHeader")}
                <span className={classes.ticketsCount}>
                  {ticketsList.length}
                </span>
              </div>
            </ListSubheader>
          )}
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
              {ticketsList.slice(0, visibleCount).map((ticket) => (
                <TicketListItem ticket={ticket} key={ticket.id} />
              ))}
            </>
          )}
          {loading && <TicketsListSkeleton />}
        </List>
      </Paper>
    </div>
  );
};

export default TicketsList;
