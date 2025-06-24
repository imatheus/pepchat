import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	chatContainer: {
		flex: 1,
		// backgroundColor: "#eee",
		padding: "5px",
		height: `calc(100% - 48px)`,
		overflowY: "hidden",
		marginTop: "25px",
		[theme.breakpoints.between("sm", "md")]: {
			padding: "3px",
			marginTop: "15px",
		},
		[theme.breakpoints.down("sm")]: {
			padding: "2px",
			marginTop: "10px",
		},
	},

	chatPapper: {
		// backgroundColor: "red",
		display: "flex",
		height: "100%",
		[theme.breakpoints.down("md")]: {
			flexDirection: "column",
		},
	},

	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
		[theme.breakpoints.down("md")]: {
			height: "40%",
			minHeight: "300px",
		},
	},
	messagesWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
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

const TicketsCustom = () => {
	const classes = useStyles();
	const { ticketId } = useParams();

	return (
		<div className={classes.chatContainer}>
			<div className={classes.chatPapper}>
				<Grid container spacing={0}>
					<Grid item xs={12} md={4} className={classes.contactsWrapper}>
						<TicketsManager />
					</Grid>
					<Grid item xs={12} md={8} className={classes.messagesWrapper}>
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

export default TicketsCustom;
