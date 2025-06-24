import React, { useState, useRef, useEffect, useContext } from "react";

import { useHistory } from "react-router-dom";
import { format } from "date-fns";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import { makeStyles } from "@material-ui/core/styles";
import NotificationsIcon from "@material-ui/icons/Notifications";
import ClearAllIcon from "@material-ui/icons/ClearAll";

import TicketListItem from "../TicketListItem";
import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles((theme) => ({
  tabContainer: {
    overflowY: "auto",
    maxHeight: 350,
    ...theme.scrollbarStyles,
  },
  popoverPaper: {
    width: "100%",
    maxWidth: 350,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 270,
    },
  },
  noShadow: {
    boxShadow: "none !important",
  },
  clearButton: {
    margin: theme.spacing(1),
    width: 'calc(100% - 16px)',
  },
}));

const NotificationsPopOver = () => {
  const classes = useStyles();

  const history = useHistory();
  const { user } = useContext(AuthContext);
  const ticketIdUrl = +history.location.pathname.split("/")[2];
  const ticketIdRef = useRef(ticketIdUrl);
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { profile, queues } = user;

  const [desktopNotifications, setDesktopNotifications] = useState([]);

  const { tickets } = useTickets({ withUnreadMessages: "true" });
  const historyRef = useRef(history);

  // Som de notificação usando Web Audio API
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Erro ao reproduzir som de notificação:", error);
    }
  };

	useEffect(() => {
		if (!("Notification" in window)) {
			console.log("This browser doesn't support notifications");
		} else {
			Notification.requestPermission();
		}
	}, []);

	useEffect(() => {
		// Filtrar apenas tickets com mensagens não lidas e que pertencem ao usuário
		const userId = user.id;
		const filteredTickets = tickets.filter(ticket => {
			const belongsToUser = !ticket.userId || ticket.userId === userId;
			const hasUnreadMessages = ticket.unreadMessages > 0;
			const isInUserQueue = !ticket.queueId || queues.some(queue => queue.id === ticket.queueId);
			
			return belongsToUser && hasUnreadMessages && isInUserQueue;
		});
		
		setNotifications(filteredTickets);
	}, [tickets, user.id, queues]);

	useEffect(() => {
		ticketIdRef.current = ticketIdUrl;
		
		// Remover notificação quando ticket for visualizado
		if (ticketIdUrl) {
			setNotifications(prevState => {
				const updatedNotifications = prevState.filter(ticket => ticket.id !== ticketIdUrl);
				return updatedNotifications;
			});
			
			// Fechar notificação desktop se existir
			setDesktopNotifications(prevState => {
				const notificationIndex = prevState.findIndex(n => n.tag === String(ticketIdUrl));
				if (notificationIndex !== -1) {
					prevState[notificationIndex].close();
					const updatedDesktopNotifications = [...prevState];
					updatedDesktopNotifications.splice(notificationIndex, 1);
					return updatedDesktopNotifications;
				}
				return prevState;
			});
		}
	}, [ticketIdUrl]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });
    const userId = user.id;

    socket.on("connect", () => socket.emit("joinNotification"));

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "updateUnread" || data.action === "delete") {
				setNotifications(prevState => {
					const updatedNotifications = prevState.filter(t => t.id !== data.ticketId);
					return updatedNotifications;
				});

				setDesktopNotifications(prevState => {
					const notificationIndex = prevState.findIndex(
						n => n.tag === String(data.ticketId)
					);
					if (notificationIndex !== -1) {
						prevState[notificationIndex].close();
						const updatedDesktopNotifications = [...prevState];
						updatedDesktopNotifications.splice(notificationIndex, 1);
						return updatedDesktopNotifications;
					}
					return prevState;
				});
      }
      
      // Remover notificação quando ticket for atualizado (ex: status mudou)
      if (data.action === "update" && data.ticket) {
        // Se o ticket não tem mais mensagens não lidas, remover das notificações
        if (!data.ticket.unreadMessages || data.ticket.unreadMessages === 0) {
          setNotifications(prevState => {
            const updatedNotifications = prevState.filter(t => t.id !== data.ticket.id);
            return updatedNotifications;
          });
          
          setDesktopNotifications(prevState => {
            const notificationIndex = prevState.findIndex(n => n.tag === String(data.ticket.id));
            if (notificationIndex !== -1) {
              prevState[notificationIndex].close();
              const updatedDesktopNotifications = [...prevState];
              updatedDesktopNotifications.splice(notificationIndex, 1);
              return updatedDesktopNotifications;
            }
            return prevState;
          });
        }
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
			if (
				data.action === "create" &&
				!data.message.read &&
				(data.ticket.userId === userId || !data.ticket.userId)
			) {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
					if (ticketIndex !== -1) {
						prevState[ticketIndex] = data.ticket;
						return [...prevState];
					}
					return [data.ticket, ...prevState];
				});

				const shouldNotNotificate =
					(data.message.ticketId === ticketIdRef.current &&
						document.visibilityState === "visible") ||
					(data.ticket.userId && data.ticket.userId !== userId) ||
					data.ticket.isGroup;

				if (shouldNotNotificate) return;

				// Tocar som de notificação
				playNotificationSound();
				
				// Mostrar notificação desktop
				handleNotifications(data);
			}
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id, profile, queues]);

  const handleNotifications = (data) => {
    const { message, contact, ticket } = data;

    // Verificar se as notificações estão permitidas
    if (Notification.permission === "granted") {
      const options = {
        body: `${message.body} - ${format(new Date(), "HH:mm")}`,
        icon: contact.profilePicUrl || '/favicon.ico',
        tag: String(ticket.id),
        renotify: true,
        requireInteraction: false,
        silent: false
      };

      const notification = new Notification(
        `Nova mensagem de ${contact.name}`,
        options
      );

      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        historyRef.current.push(`/tickets/${ticket.uuid}`);
        notification.close();
      };

      // Auto-fechar após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      setDesktopNotifications((prevState) => {
        const notificationIndex = prevState.findIndex(
          (n) => n.tag === notification.tag
        );
        if (notificationIndex !== -1) {
          prevState[notificationIndex].close();
          prevState[notificationIndex] = notification;
          return [...prevState];
        }
        return [notification, ...prevState];
      });
    }
  };

  const handleClick = () => {
    setIsOpen((prevState) => !prevState);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    
    // Fechar todas as notificações desktop
    desktopNotifications.forEach(notification => {
      notification.close();
    });
    setDesktopNotifications([]);
    
    setIsOpen(false);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const NotificationTicket = ({ children, ticket }) => {
    const handleTicketClick = () => {
      history.push(`/tickets/${ticket.uuid}`);
      handleClickAway();
    };
    
    return <div onClick={handleTicketClick} style={{ cursor: 'pointer' }}>{children}</div>;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        ref={anchorEl}
        aria-label="Mostrar Notificações"
        variant="contained"
      >
        <Badge badgeContent={notifications.length > 0 ? notifications.length : null} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <List dense className={classes.tabContainer}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText>Nenhuma notificação</ListItemText>
            </ListItem>
          ) : (
            <>
              {notifications.map((ticket) => (
                <NotificationTicket key={ticket.id} ticket={ticket}>
                  <TicketListItem ticket={ticket} />
                </NotificationTicket>
              ))}
              <Divider />
              <Button
                className={classes.clearButton}
                startIcon={<ClearAllIcon />}
                onClick={clearAllNotifications}
                size="small"
                variant="outlined"
              >
                Limpar todas
              </Button>
            </>
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationsPopOver;
