import React, { useState, useEffect, createContext } from "react";
import { useHistory } from "react-router-dom";

const TicketsContext = createContext();

const TicketsContextProvider = ({ children }) => {
	const [currentTicket, setCurrentTicket] = useState({ id: null, code: null });
	const [refreshTickets, setRefreshTickets] = useState(0);
    const history = useHistory();

    useEffect(() => {
        if (currentTicket.id !== null) {
            history.push(`/tickets/${currentTicket.uuid}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTicket])

    const triggerRefresh = () => {
        setRefreshTickets(prev => prev + 1);
    };

	return (
		<TicketsContext.Provider
			value={{ 
				currentTicket, 
				setCurrentTicket, 
				refreshTickets, 
				triggerRefresh 
			}}
		>
			{children}
		</TicketsContext.Provider>
	);
};

export { TicketsContext, TicketsContextProvider };
