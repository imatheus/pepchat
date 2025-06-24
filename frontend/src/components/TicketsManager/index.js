import React, { useContext, useEffect, useRef, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import AddCommentIcon from "@material-ui/icons/AddComment";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsList";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { Button, IconButton } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	ticketsWrapper: {
		position: "relative",
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflow: "hidden",
		borderTopRightRadius: 0,
		borderBottomRightRadius: 0,
	},

	tabsHeader: {
		flex: "none",
		backgroundColor: "#eee",
	},

	settingsIcon: {
		alignSelf: "center",
		marginLeft: "auto",
		padding: 8,
	},

	tab: {
		minWidth: 120,
		width: 120,
	},

	ticketOptionsBox: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		background: "#fafafa",
		padding: theme.spacing(1),
	},

	searchInputWrapper: {
		flex: 1,
		background: theme.palette.background.paper,
		display: "flex",
		borderRadius: 40,
		padding: 4,
		marginRight: theme.spacing(1),
		border: `1px solid ${theme.palette.divider}`,
	},

	searchIcon: {
		color: "grey",
		marginLeft: 6,
		marginRight: 6,
		alignSelf: "center",
	},

	searchInput: {
		flex: 1,
		border: "none",
		borderRadius: 30,
	},
}));

const TicketsManager = () => {
	const classes = useStyles();

	const [searchParam, setSearchParam] = useState("");
	const [tab, setTab] = useState("open");
	const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
	const [showAllTickets, setShowAllTickets] = useState(false);
	const searchInputRef = useRef();
	const { user } = useContext(AuthContext);

	const userQueueIds = user.queues.map(q => q.id);
	
	// Função para carregar seleção salva do localStorage
	const loadSavedSelection = () => {
		try {
			const savedSelection = localStorage.getItem(`selectedQueueIds_${user.id}`);
			if (savedSelection) {
				return JSON.parse(savedSelection);
			}
		} catch (error) {
			console.error('Erro ao carregar seleção salva:', error);
		}
		return userQueueIds || [];
	};
	
	const [selectedQueueIds, setSelectedQueueIds] = useState(loadSavedSelection);
	
	// Função para salvar seleção no localStorage
	const saveSelection = (queueIds) => {
		try {
			localStorage.setItem(`selectedQueueIds_${user.id}`, JSON.stringify(queueIds));
		} catch (error) {
			console.error('Erro ao salvar seleção:', error);
		}
	};
	
	// Wrapper para setSelectedQueueIds que também salva no localStorage
	const handleQueueIdsChange = (queueIds) => {
		setSelectedQueueIds(queueIds);
		saveSelection(queueIds);
	};

	useEffect(() => {
		if (tab === "search") {
			searchInputRef.current.focus();
		}
	}, [tab]);

	let searchTimeout;

	const handleSearch = e => {
		const searchedTerm = e.target.value.toLowerCase();

		clearTimeout(searchTimeout);

		if (searchedTerm === "") {
			setSearchParam(searchedTerm);
			// setTab("open");
			return;
		}

		searchTimeout = setTimeout(() => {
			setSearchParam(searchedTerm);
		}, 500);
	};

	const handleChangeTab = (e, newValue) => {
		setTab(newValue);
	};

	return (
		<Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
			<NewTicketModal
				modalOpen={newTicketModalOpen}
				onClose={e => setNewTicketModalOpen(false)}
			/>
			<Paper elevation={0} square className={classes.tabsHeader}>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<Tabs
						value={tab}
						onChange={handleChangeTab}
						indicatorColor="primary"
						textColor="primary"
						aria-label="icon label tabs example"
						style={{ flex: 1 }}
					>
						<Tab
							value={"open"}
							icon={<MoveToInboxIcon />}
							label={i18n.t("tickets.tabs.open.title")}
							classes={{ root: classes.tab }}
						/>
						<Tab
							value={"closed"}
							icon={<CheckBoxIcon />}
							label={i18n.t("tickets.tabs.closed.title")}
							classes={{ root: classes.tab }}
						/>
						<Tab
							value={"search"}
							icon={<SearchIcon />}
							label={i18n.t("tickets.tabs.search.title")}
							classes={{ root: classes.tab }}
						/>
					</Tabs>
					<IconButton
						color="primary"
						onClick={() => setNewTicketModalOpen(true)}
						title={i18n.t("ticketsManager.buttons.newTicket")}
						style={{ marginRight: 8 }}
					>
						<AddCommentIcon />
					</IconButton>
				</div>
			</Paper>
			<Paper square elevation={0} className={classes.ticketOptionsBox}>
				{tab === "search" ? (
					<div className={classes.searchInputWrapper}>
						<SearchIcon className={classes.searchIcon} />
						<InputBase
							className={classes.searchInput}
							inputRef={searchInputRef}
							placeholder={i18n.t("tickets.search.placeholder")}
							type="search"
							onChange={handleSearch}
						/>
					</div>
				) : (
					<div style={{ flex: 1 }}></div>
				)}
				<Can
					role={user.profile}
					perform="tickets-manager:showall"
					yes={() => (
						<TicketsQueueSelect
							style={{ marginLeft: 6 }}
							selectedQueueIds={selectedQueueIds}
							userQueues={user?.queues}
							onChange={handleQueueIdsChange}
							showAllOption={true}
							onShowAllChange={setShowAllTickets}
							showAllTickets={showAllTickets}
						/>
					)}
					no={() => (
						<TicketsQueueSelect
							style={{ marginLeft: 6 }}
							selectedQueueIds={selectedQueueIds}
							userQueues={user?.queues}
							onChange={handleQueueIdsChange}
							showAllOption={false}
						/>
					)}
				/>
			</Paper>
			<TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
				<TicketsList
					status="open"
					showAll={showAllTickets}
					selectedQueueIds={selectedQueueIds}
				/>
				<TicketsList status="pending" selectedQueueIds={selectedQueueIds} />
			</TabPanel>
			<TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
				<TicketsList
					status="closed"
					showAll={true}
					selectedQueueIds={selectedQueueIds}
				/>
			</TabPanel>
			<TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
				<TicketsList
					searchParam={searchParam}
					showAll={true}
					selectedQueueIds={selectedQueueIds}
				/>
			</TabPanel>
		</Paper>
	);
};

export default TicketsManager;