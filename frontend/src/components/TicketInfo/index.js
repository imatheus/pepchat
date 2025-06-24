import React, { useState, useEffect } from "react";

import { Avatar, CardHeader, Badge, makeStyles } from "@material-ui/core";

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
}));

const TicketInfo = ({ contact, ticket, onClick }) => {
	const classes = useStyles();
	const { user } = ticket
	const [userName, setUserName] = useState('')
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

		if (user && contact) {
			setUserName(`${i18n.t("messagesList.header.assignedTo")} ${user.name}`);

			if(document.body.offsetWidth < 600) {
				setUserName(`${user.name}`);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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

	const getSubheaderText = () => {
		if (isTyping) {
			return i18n.t("chat.typing");
		}
		if (ticket.user) {
			return userName;
		}
		return "";
	};

	return (
		<CardHeader
			onClick={onClick}
			style={{ cursor: "pointer" }}
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
					<Avatar src={contact.profilePicUrl} alt="contact_image" />
				</Badge>
			}
			title={`${contactName} #${ticket.id}`}
			subheader={getSubheaderText()}
		/>
	);
};

export default TicketInfo;
