import React, { useState, useEffect, createContext } from "react";
import { useHistory } from "react-router-dom";

const TicketsContext = createContext();

const TicketsContextProvider = ({ children }) => {
	const [currentTicket, setCurrentTicket] = useState({ id: null, code: null });
	const [refreshTickets, setRefreshTickets] = useState(0);
  const [ticketsCache, setTicketsCache] = useState({}); // key -> { list, pageNumber, hasMore, updatedAt }
  const history = useHistory();

  // Simple TTL for session cache: 10 minutes
  const CACHE_PREFIX = 'ticketsCache:';
  const TTL_MS = 10 * 60 * 1000;

  const storageKey = (key) => `${CACHE_PREFIX}${key}`;

  const isEntryValid = (entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const ts = Number(entry.updatedAt || 0);
    if (!ts) return false;
    return Date.now() - ts <= TTL_MS;
  };

  const readFromSession = (key) => {
    try {
      const raw = sessionStorage.getItem(storageKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (isEntryValid(parsed)) return parsed;
      // expired -> cleanup
      sessionStorage.removeItem(storageKey(key));
      return null;
    } catch {
      return null;
    }
  };

  const writeToSession = (key, entry) => {
    try {
      const toWrite = {
        list: Array.isArray(entry.list) ? entry.list : [],
        pageNumber: entry.pageNumber || 1,
        hasMore: !!entry.hasMore,
        updatedAt: entry.updatedAt || Date.now(),
      };
      sessionStorage.setItem(storageKey(key), JSON.stringify(toWrite));
    } catch {
      // ignore storage errors
    }
  };

  // Cleanup expired cache entries once per session
  useEffect(() => {
    try {
      const now = Date.now();
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          try {
            const raw = sessionStorage.getItem(k);
            const parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || !parsed.updatedAt || (now - Number(parsed.updatedAt)) > TTL_MS) {
              sessionStorage.removeItem(k);
            }
          } catch {
            sessionStorage.removeItem(k);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (currentTicket.id !== null) {
      history.push(`/tickets/${currentTicket.uuid}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicket])

  const triggerRefresh = () => {
    setRefreshTickets(prev => prev + 1);
  };

  const getCachedList = (key) => {
    try {
      // Memory first
      const mem = ticketsCache[key];
      if (isEntryValid(mem)) return mem;
      // Try session
      const sess = readFromSession(key);
      if (sess) {
        // hydrate memory cache for faster next access
        setTicketsCache(prev => ({ ...prev, [key]: sess }));
        return sess;
      }
      return null;
    } catch {
      return null;
    }
  };

  const setCachedList = (key, list, meta = {}) => {
    const entry = {
      ...(ticketsCache[key] || {}),
      list: Array.isArray(list) ? list : [],
      pageNumber: meta.pageNumber ?? (ticketsCache[key]?.pageNumber || 1),
      hasMore: meta.hasMore ?? (ticketsCache[key]?.hasMore ?? false),
      updatedAt: Date.now(),
    };
    setTicketsCache(prev => ({
      ...prev,
      [key]: entry
    }));
    writeToSession(key, entry);
  };

  const updateCacheMeta = (key, meta = {}) => {
    const entry = {
      ...(ticketsCache[key] || {}),
      pageNumber: meta.pageNumber ?? (ticketsCache[key]?.pageNumber || 1),
      hasMore: meta.hasMore ?? (ticketsCache[key]?.hasMore ?? false),
      updatedAt: Date.now(),
    };
    setTicketsCache(prev => ({
      ...prev,
      [key]: entry
    }));
    writeToSession(key, entry);
  };

	return (
		<TicketsContext.Provider
			value={{ 
				currentTicket, 
				setCurrentTicket, 
				refreshTickets, 
				triggerRefresh,
        ticketsCache,
        getCachedList,
        setCachedList,
        updateCacheMeta
			}}
		>
			{children}
		</TicketsContext.Provider>
	);
};

export { TicketsContext, TicketsContextProvider };
