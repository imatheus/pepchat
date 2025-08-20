import React, { useState, useEffect } from "react";

import { Avatar, CardHeader, Badge, makeStyles, Chip, Tooltip } from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles((theme) => ({
  onlineIndicator: {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
  offlineIndicator: {
    backgroundColor: '#ccc',
    color: '#ccc',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
  groupAvatar: {
    "& .MuiAvatar-colorDefault": {
      color: "#7c7c7c !important",
      backgroundColor: "#e4e4e4 !important",
    },
    color: "#7c7c7c !important",
    backgroundColor: "#e4e4e4 !important",
  },
  chipsContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop:5
  },
  assignedLabel: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    marginRight: 6,
  },
  chip: {
    height: 24,
  },
  chipAvatarFallback: {
    backgroundColor: '#9e9e9e',
    color: '#fff'
  }
}));

const TicketInfo = ({ contact, ticket, onClick }) => {
	const classes = useStyles();
	const { user } = ticket
	const [contactName, setContactName] = useState('')
	const [isOnline, setIsOnline] = useState(false)
	const [isTyping, setIsTyping] = useState(false)

	useEffect(() => {
		if (contact) {
			setContactName(contact.name);
			if(document.body.offsetWidth < 600) {
				if (contact.name.length > 10) {
					const truncadName = contact.name.substring(0, 10) + '...';
					setContactName(truncadName);
				}
			}
		}
	}, [contact])

	// Real online status from socket events
	useEffect(() => {
		const companyId = localStorage.getItem("companyId");
		const socket = socketConnection({ companyId });

		// Listen for typing events to update typing status
		const typingListener = (data) => {
			if (parseInt(data.ticketId) === ticket.id && !data.fromMe) {
				setIsTyping(data.typing);
			}
		};

		// Listen for user online status updates
		const userStatusListener = (data) => {
			if (data.contactId === contact.id) {
				setIsOnline(data.online);
			}
		};

		socket.on(`company-${companyId}-typing`, typingListener);
		socket.on(`company-${companyId}-userStatus`, userStatusListener);

		// Set initial online status (mock for now - in real implementation this would come from contact data)
		setIsOnline(Math.random() > 0.3); // 70% chance of being online

		return () => {
			socket.off(`company-${companyId}-typing`, typingListener);
			socket.off(`company-${companyId}-userStatus`, userStatusListener);
			socket.disconnect();
		};
	}, [ticket.id, contact.id]);

  const renderUserChip = (u) => {
    if (!u) return null;
    const initial = (u.name?.[0] || '').toUpperCase();
    return (
      <Tooltip title={u.name} key={u.id}>
        <Chip
          size="small"
          className={classes.chip}
          label={u.name}
          avatar={
            <Avatar className={!u.profileImage ? classes.chipAvatarFallback : undefined} src={u.profileImage || undefined}>
              {!u.profileImage && initial}
            </Avatar>
          }
        />
      </Tooltip>
    );
  };

  const renderSubheader = () => {
    if (isTyping) return i18n.t("chat.typing");
    const owner = ticket.user;
    const others = Array.isArray(ticket.users) ? ticket.users.filter(u => !owner || u.id !== owner.id) : [];
    const hasAssignees = !!owner || others.length > 0;
    return (
      <div className={classes.chipsContainer}>
        {hasAssignees && (
          <span className={classes.assignedLabel}>{i18n.t("messagesList.header.assignedTo")}</span>
        )}
        {owner && renderUserChip(owner)}
        {others.map(u => renderUserChip(u))}
      </div>
    );
  };

	return (
		<CardHeader
			onClick={onClick}
			style={{ cursor: "pointer"}}
			titleTypographyProps={{ noWrap: true }}
			subheaderTypographyProps={{ noWrap: true }}
			avatar={
				<Badge
					overlap="circular"
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'right',
					}}
					badgeContent={
						<div 
							className={isOnline ? classes.onlineIndicator : classes.offlineIndicator}
							style={{
								width: 12,
								height: 12,
								borderRadius: '50%',
								position: 'relative'
							}}
						/>
					}
				>
					<Avatar 
						src={contact.profilePicUrl} 
						alt="contact_image"
						className={contact.isGroup ? classes.groupAvatar : ""}
					/>
				</Badge>
			}
			title={`${contactName} #${ticket.id}`}
			subheader={renderSubheader()}
		/>
	);
};

export default TicketInfo;