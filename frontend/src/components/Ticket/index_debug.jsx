import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import { toast } from "react-toastify";
import clsx from "clsx";

import { Paper, makeStyles } from "@material-ui/core";

import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInputCustom/";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TagsContainer } from "../TagsContainer";
import { socketConnection } from "../../services/socket";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: theme.palette.background.default,
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    marginRight: -drawerWidth,
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});

  console.log('🎫 [Ticket] Component rendered with ticketId:', ticketId);

  useEffect(() => {
    console.log('🎫 [Ticket] useEffect triggered for ticketId:', ticketId);
    console.log('👤 [Ticket] Current user:', user);
    console.log('🔍 [Ticket] User object keys:', Object.keys(user));
    
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        console.log('📞 [Ticket] Fetching ticket data for ID:', ticketId);
        console.log('🔍 [Ticket] Current API base URL:', api.defaults.baseURL);
        console.log('🔍 [Ticket] Current API headers:', api.defaults.headers);
        
        try {
          console.log('📤 [Ticket] Making API call to /tickets/u/' + ticketId);
          const { data } = await api.get("/tickets/u/" + ticketId);
          console.log('✅ [Ticket] API call successful, data received:', data ? 'YES' : 'NO');
          console.log('✅ [Ticket] Ticket data:', data);
          
          const { queueId } = data;
          const { queues, profile } = user;

          console.log('🔍 [Ticket] Queue ID from ticket:', queueId);
          console.log('🔍 [Ticket] User queues:', queues);
          console.log('🔍 [Ticket] User profile:', profile);

          const queueAllowed = queues.find((q) => q.id === queueId);
          // Permitir visualizar tickets pending mesmo sem acesso à fila
          // mas bloquear envio de mensagens até aceitar o ticket
          if (queueAllowed === undefined && profile !== "admin" && data.status !== "pending") {
            console.log('🚫 [Ticket] Access denied - redirecting to tickets');
            toast.error("Acesso não permitido");
            history.push("/tickets");
            return;
          }

          console.log('✅ [Ticket] Setting contact and ticket data');
          setContact(data.contact);
          setTicket(data);
          setLoading(false);
        } catch (err) {
          console.error('❌ [Ticket] API call failed:', err);
          console.error('❌ [Ticket] Error status:', err.response?.status);
          console.error('❌ [Ticket] Error statusText:', err.response?.statusText);
          console.error('❌ [Ticket] Error message:', err.message);
          console.error('❌ [Ticket] Error config URL:', err.config?.url);
          console.error('❌ [Ticket] Error config headers:', err.config?.headers);
          console.error('❌ [Ticket] Full error object:', err);
          
          if (err.response?.status === 401) {
            console.log('🚫 [Ticket] 401 Unauthorized - token issue detected');
          }
          
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history]);

  useEffect(() => {
    console.log('🔌 [Ticket] Socket useEffect triggered');
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on("connect", () => {
      console.log('🔌 [Ticket] Socket connected, joining chat box:', ticket.id);
      socket.emit("joinChatBox", `${ticket.id}`);
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      console.log('🎫 [Ticket] Socket ticket event received:', data);
      if (data.action === "update") {
        setTicket(data.ticket);
      }

      if (data.action === "delete") {
        toast.success("Ticket deleted sucessfully.");
        history.push("/tickets");
      }
    });

    socket.on(`company-${companyId}-contact`, (data) => {
      console.log('👤 [Ticket] Socket contact event received:', data);
      if (data.action === "update") {
        setContact((prevState) => {
          if (prevState.id === data.contact?.id) {
            return { ...prevState, ...data.contact };
          }
          return prevState;
        });
      }
    });

    return () => {
      console.log('🔌 [Ticket] Disconnecting socket');
      socket.disconnect();
    };
  }, [ticketId, ticket, history]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleTicketUpdate = (updatedTicket) => {
    setTicket(prevTicket => ({
      ...prevTicket,
      ...updatedTicket
    }));
  };

  const renderTicketInfo = () => {
    if (ticket.user !== undefined) {
      return (
        <TicketInfo
          contact={contact}
          ticket={ticket}
          onClick={handleDrawerOpen}
        />
      );
    }
  };

  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          ticket={ticket}
          ticketId={ticket.id}
          isGroup={ticket.isGroup}
        ></MessagesList>
        <MessageInput ticketId={ticket.id} ticketStatus={ticket.status} />
      </>
    );
  };

  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
      >
        <TicketHeader loading={loading}>
          <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ flex: 1 }}>
              {renderTicketInfo()}
              <div style={{ marginLeft: 72, marginTop: -8 }}>
                <TagsContainer ticket={ticket} />
              </div>
            </div>
            <TicketActionButtons ticket={ticket} onTicketUpdate={handleTicketUpdate} />
          </div>
        </TicketHeader>
        <ReplyMessageProvider>{renderMessagesList()}</ReplyMessageProvider>
      </Paper>
      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
      />
    </div>
  );
};

export default Ticket;