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
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import AdbIcon from "@material-ui/icons/Adb";
import VisibilityIcon from "@material-ui/icons/Visibility";
import TicketMessagesDialog from "../TicketMessagesDialog";
import DoneIcon from '@material-ui/icons/Done';
import ClearOutlinedIcon from '@material-ui/icons/ClearOutlined';
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
    height: 98,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: "12px",
    margin: "8px 0px",
    paddingLeft: "16px",
    paddingRight: "80px", // Espaço para os botões
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: theme.palette.type === 'dark' ? '#333333' : theme.palette.background.paper,
    border: "1px solid rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      transform: "translateY(-1px)",
    },
  },

  pendingTicket: {
    cursor: "unset",
    borderRadius: "12px",
    margin: "8px 0px",
    paddingLeft: "16px",
    paddingRight: "80px", // Espaço para os botões
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: theme.palette.background.paper,
    border: "1px solid rgba(0, 0, 0, 0.05)",
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
    textAlign: "right",
    position: "relative",
    top: -23,
    fontSize: 12
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto",
  },

  contactLastMessage: {
    paddingRight: "80px", // Ajustado para não sobrepor os botões
  },

  newMessagesCount: {
    alignSelf: "center",
    marginRight: 0,
    marginLeft: "auto",
    top: -10,
    right: 10
  },

  badgeStyle: {
    color: "white",
    backgroundColor: green[500],
    right: 0,
    top: 10
  },

  acceptButton: {
    position: "absolute",
    right: "108px",
  },

  ticketQueueColor: {
    flex: "none",
    width: "8px",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
    borderTopLeftRadius: "12px",
    borderBottomLeftRadius: "12px",
  },

  ticketInfo: {
    position: "relative",
    top: 0
  },

  ticketInfo1: {
    position: "relative",
    top: 40,
    right: 0
  },
  Radiusdot: {
    "& .MuiBadge-badge": {
      borderRadius: "50px", // 100% arredondado
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
  
  }));

const TicketListItemCustom = ({ ticket, setUpdate }) => {
  const classes = useStyles();
  const history = useHistory();
  const [, setLoading] = useState(false);
  const [ticketUser, setTicketUser] = useState(null);
  const [whatsAppName, setWhatsAppName] = useState(null);
  const [currentTicketTags, setCurrentTicketTags] = useState(ticket.tags || []);

  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket, triggerRefresh } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const { profile } = user;

  useEffect(() => {
    // Atualizar tags quando o ticket prop mudar
    setCurrentTicketTags(ticket.tags || []);
  }, [ticket.tags]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    // Escutar mudanças nas tags do ticket
    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "update" && data.ticket && data.ticket.id === ticket.id) {
        console.log(`🏷️ Tags atualizadas para ticket ${ticket.id}:`, data.ticket.tags);
        setCurrentTicketTags(data.ticket.tags || []);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticket.id]);

  useEffect(() => {
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user.name);
    }

    if (ticket.whatsappId && ticket.whatsapp) {
      setWhatsAppName(ticket.whatsapp.name);
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: user?.id,
      });
      
      // Navegar para a lista de tickets após fechar
      history.push(`/tickets/`);
    } catch (err) {
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
      const response = await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
      });
      
      console.log(`✅ Ticket ${id} aceito com sucesso:`, response.data);
      
      // Forçar atualização das listas
      if (setUpdate) {
        setUpdate(prev => prev + 1);
      }
      
      // Trigger refresh global
      if (triggerRefresh) {
        triggerRefresh();
      }
      
      // Navegar para o ticket após aceitar
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      console.error(`❌ Erro ao aceitar ticket ${id}:`, err);
      toastError(err);
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

  
  const renderTicketInfo = () => {
    if (ticketUser) {
      return (
        <>
          <Badge
            className={classes.Radiusdot}
            badgeContent={`${ticketUser}`}
            //color="primary"
            style={{
              backgroundColor: "#3498db",
              height: 18,
              padding: 5,
              position: "inherit",
              borderRadius: "50px",
              color: '#fff',
              top: -6,
              marginRight: 3,
            }}
          />

          {ticket.whatsappId && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={`${whatsAppName}`}
              style={{
                backgroundColor: "#7d79f2",
                height: 18,
                padding: 5,
                position: "inherit",
                borderRadius: "50px",
                color: "white",
                top: -6,
                marginRight: 3
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
          {ticket.status === "open" && (
            <Tooltip title="Fechar Conversa">
              <ClearOutlinedIcon
                onClick={() => handleCloseTicket(ticket.id)}
                fontSize="small"
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
          {profile === "admin" && (
            <Tooltip title="Espiar Conversa">
              <VisibilityIcon
                onClick={() => setOpenTicketMessageDialog(true)}
                fontSize="small"
                style={{
                  padding: 2,
                  height: 23,
                  width: 23,
                  fontSize: 12,
                  color: '#fff',
                  cursor: "pointer",
                  backgroundColor: blue[700],
                  borderRadius: 50,
                  position: 'absolute',
                  right: 36,
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

          {ticket.whatsappId && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={`${whatsAppName}`}
              style={{
                backgroundColor: "#7d79f2",
                height: 18,
                padding: 5,
                position: "inherit",
                borderRadius: "50px",
                color: "white",
                top: -6,
                marginRight: 3
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
                style={{
                  color: '#fff',
                  backgroundColor: red[700],
                  cursor: "pointer",
                  margin: '0 5 0 5',
                  padding: 2,
                  right: 56,
                  height: 23,
                  width: 23,
                  fontSize: 12,
                  borderRadius: 50,
                  top: -8,
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
                  right: 33,
                  top: -8,
                  position: 'absolute',
                }}
              />
            </Tooltip>
          )}

          {profile === "admin" && (
            <Tooltip title="Espiar Conversa">
              <VisibilityIcon
                onClick={() => setOpenTicketMessageDialog(true)}
                fontSize="small"
                style={{
                  padding: 2,
                  height: 23,
                  width: 23,
                  fontSize: 12,
                  color: '#fff',
                  cursor: "pointer",
                  backgroundColor: blue[700],
                  borderRadius: 50,
                  right: 8,
                  top: -8,
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
      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      ></TicketMessagesDialog>
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
        <ListItemAvatar>
          <Avatar src={ticket?.contact?.profilePicUrl} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
              >
                {ticket.channel === "whatsapp" && (
                  <Tooltip title={`Atribuido à ${ticketUser}`}>
                    <WhatsAppIcon fontSize="inherit" style={{ color: grey[700] }} />
                  </Tooltip>
                )}{' '}
                {ticket.contact.name}
              </Typography>
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
              > {ticket.lastMessage.includes('data:image/png;base64') ? <MarkdownWrapper> Localização</MarkdownWrapper> : <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>}
                {/* {ticket.lastMessage === "" ? <br /> : <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>} */}
              </Typography>
              <ListItemSecondaryAction style={{ left: 73 }}>
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
                backgroundColor: ticket.queue?.color || "#ff0000",
                height: 18,
                padding: 5,
                paddingHorizontal: 12,
                borderRadius: "50px",
                color: "white",
                top: -28,
                marginRight: 5

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
                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                  <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                ) : (
                  <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                )}
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