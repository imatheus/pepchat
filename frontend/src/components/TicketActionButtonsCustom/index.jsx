import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles, createTheme, ThemeProvider } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { MoreVert, Replay } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import UndoRoundedIcon from '@material-ui/icons/UndoRounded';
import Tooltip from '@material-ui/core/Tooltip';
import { green } from '@material-ui/core/colors';


const useStyles = makeStyles(theme => ({
	actionButtons: {
		marginRight: 6,
		flex: "none",
		alignSelf: "center",
		marginLeft: "auto",
		display: "flex",
		alignItems: "center",
		"& > *": {
			margin: theme.spacing(0.5),
		},
	},
}));

const TicketActionButtonsCustom = ({ ticket, onTicketUpdate }) => {
	const classes = useStyles();
	const history = useHistory();
	const [anchorEl, setAnchorEl] = useState(null);
	const [loading, setLoading] = useState(false);
	const ticketOptionsMenuOpen = Boolean(anchorEl);
	const { user } = useContext(AuthContext);
	const { setCurrentTicket, triggerRefresh } = useContext(TicketsContext);

	const customTheme = createTheme({
		palette: {
		  	primary: green,
		}
	});

	const handleOpenTicketOptionsMenu = e => {
		setAnchorEl(e.currentTarget);
	};

	const handleCloseTicketOptionsMenu = e => {
		setAnchorEl(null);
	};

	const handleUpdateTicketStatus = async (e, status, userId) => {
		setLoading(true);
		try {
			const updateData = {
				status: status,
				userId: userId || null,
			};
			
			// Não adicionar justClose para permitir o envio da pesquisa de avaliação
			// justClose deve ser usado apenas em casos específicos onde não queremos a pesquisa

			const response = await api.put(`/tickets/${ticket.id}`, updateData);

			// Atualizar o estado local imediatamente com os dados retornados
			if (onTicketUpdate && response.data) {
				// Garantir que o ticket seja atualizado com todos os dados necessários
				const updatedTicket = {
					...ticket,
					...response.data,
					status: status, // Garantir que o status seja atualizado
					userId: userId || null
				};
				onTicketUpdate(updatedTicket);
			}

			// Disparar evento para remoção otimista do card na lista "Aguardando"
			if (status === "open") {
				try {
					window.dispatchEvent(new CustomEvent('ticket-accepted', { detail: { ticketId: ticket.id, ticketUuid: ticket.uuid } }));
				} catch (e) { /* noop */ }
			}

			setLoading(false);
			if (status === "open") {
				setCurrentTicket({ ...ticket, code: "#open" });
			} else {
				setCurrentTicket({ id: null, code: null })
				history.push("/tickets");
			}
			
			// Não forçar atualização global; o socket cuidará da inclusão/remoção pontual do ticket
			// Removido triggerRefresh() para evitar limpar a lista inteira temporariamente
			
		} catch (err) {
			setLoading(false);
			// Tentar extrair mensagem do backend e exibir no toast
			const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
			if (backendMsg) {
				toastError({ message: backendMsg });
				return;
			}
			// Caso específico: aceitar ticket sem fila pode gerar 400/500 dependendo do backend
			if (status === "open") {
				toastError({ message: "Não é possível aceitar um ticket sem fila" });
				return;
			}
			toastError(err);
		}
	};

	return (
		<div className={classes.actionButtons}>
			{ticket.status === "closed" && (
				<ButtonWithSpinner
					loading={loading}
					startIcon={<Replay />}
					size="small"
					onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.reopen")}
				</ButtonWithSpinner>
			)}
			{ticket.status === "open" && (
				<>
					<Tooltip title={i18n.t("messagesList.header.buttons.return")}>
						<IconButton onClick={e => handleUpdateTicketStatus(e, "pending", null)}>
							<UndoRoundedIcon />
						</IconButton>
					</Tooltip>
					<ThemeProvider theme={customTheme}>
						<Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
							<IconButton onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)} color="primary">
								<CheckCircleIcon />
							</IconButton>
						</Tooltip>
					</ThemeProvider>
					{/* <ButtonWithSpinner
						loading={loading}
						startIcon={<Replay />}
						size="small"
						onClick={e => handleUpdateTicketStatus(e, "pending", null)}
					>
						{i18n.t("messagesList.header.buttons.return")}
					</ButtonWithSpinner>
					<ButtonWithSpinner
						loading={loading}
						size="small"
						variant="contained"
						color="primary"
						onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)}
					>
						{i18n.t("messagesList.header.buttons.resolve")}
					</ButtonWithSpinner> */}
					<IconButton onClick={handleOpenTicketOptionsMenu}>
						<MoreVert />
					</IconButton>
					<TicketOptionsMenu
						ticket={ticket}
						anchorEl={anchorEl}
						menuOpen={ticketOptionsMenuOpen}
						handleClose={handleCloseTicketOptionsMenu}
					/>
				</>
			)}
			{ticket.status === "pending" && (
				<ButtonWithSpinner
					loading={loading}
					size="small"
					variant="contained"
					color="primary"
					onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.accept")}
				</ButtonWithSpinner>
			)}
		</div>
	);
};

export default TicketActionButtonsCustom;
