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
				// CORREÇÃO: Remoção otimista ANTES da chamada da API
				// Disparar eventos para remoção otimista do card em listas específicas
				if (status === "open") {
					try {
						// Remover de "Aguardando" quando aceito
						window.dispatchEvent(new CustomEvent('ticket-accepted', { detail: { ticketId: ticket.id, ticketUuid: ticket.uuid } }));
						// Remover de "Arquivados" quando reaberto
						window.dispatchEvent(new CustomEvent('ticket-reopened', { detail: { ticketId: ticket.id, ticketUuid: ticket.uuid } }));
					} catch (e) { /* noop */ }
				} else if (status === "closed") {
					// CORREÇÃO: Remoção otimista imediata do ticket das listas de "Abertos" ANTES da API
					try {
						window.dispatchEvent(new CustomEvent('ticket-closed', { detail: { ticketId: ticket.id, ticketUuid: ticket.uuid } }));
					} catch {}
				}

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

				setLoading(false);
				if (status === "open") {
					setCurrentTicket({ ...ticket, code: "#open" });
					// remoção otimista da lista "Aguardando" já tratada em 'ticket-accepted'
				} else if (status === "closed") {
					// CORREÇÃO: NÃO chamar triggerRefresh() - isso traz o ticket de volta!
					// A remoção otimista + socket já cuidam da atualização
					setCurrentTicket({ id: null, code: null })
					history.push("/tickets");
				} else {
					setCurrentTicket({ id: null, code: null })
					history.push("/tickets");
				}
				
				// Mantemos sockets e eventos para atualizações granulares
				
			} catch (err) {
				setLoading(false);
				// CORREÇÃO: Em caso de erro, reverter a remoção otimista
				if (status === "closed") {
					try {
						// Forçar refresh para restaurar o ticket na lista
						triggerRefresh();
					} catch {}
				}
				
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
