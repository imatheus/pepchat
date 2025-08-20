import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManager/";
import Ticket from "../../components/Ticket/";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	chatContainer: {
		flex: 1,
		height: "calc(100% - 5px)",
		padding: "5px 5px 0 5px",
		overflowY: "hidden",
		boxSizing: "border-box",
		marginTop: "5px",
		backgroundColor: theme.palette.background.default,
		[theme.breakpoints.between("sm", "md")]: {
			padding: "4px 4px 0 4px",
			marginTop: "5px",
		},
		[theme.breakpoints.down("sm")]: {
			padding: "3px 3px 0 3px",
			marginTop: "5px",
		},
	},

	chatPapper: {
		// backgroundColor: "red",
		display: "flex",
		height: "100%",
		backgroundColor: theme.palette.background.paper,
		[theme.breakpoints.down("md")]: {
			flexDirection: "column",
		},
	},

	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
		backgroundColor: theme.palette.background.paper,
		[theme.breakpoints.down("md")]: {
			height: "40%",
			minHeight: "300px",
		},
	},
	messagessWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		backgroundColor: theme.palette.background.paper,
		[theme.breakpoints.down("md")]: {
			height: "60%",
		},
	},
	welcomeMsg: {
		backgroundColor: "#eee",
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
	},
}));

const Chat = () => {
	const classes = useStyles();
	const { ticketId } = useParams();

	return (
		<div className={classes.chatContainer}>
			<div className={classes.chatPapper}>
				<Grid container spacing={0} style={{ height: "100%" }}>
					<Grid item xs={12} md={4} className={classes.contactsWrapper}>
						<TicketsManager />
					</Grid>
					<Grid item xs={12} md={8} className={classes.messagessWrapper}>
						{ticketId ? (
							<>
								<Ticket />
							</>
						) : (
							<Paper square variant="outlined" className={classes.welcomeMsg}>
								<span>{i18n.t("chat.noTicketMessage")}</span>
							</Paper>
						)}
					</Grid>
				</Grid>
			</div>
		</div>
	);
};

export default Chat;