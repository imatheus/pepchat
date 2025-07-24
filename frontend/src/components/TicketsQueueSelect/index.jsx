import React from "react";

import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { Checkbox, ListItemText, InputAdornment } from "@material-ui/core";
import FilterListIcon from "@material-ui/icons/FilterList";
import { i18n } from "../../translate/i18n";

const TicketsQueueSelect = ({
	userQueues,
	selectedQueueIds = [],
	onChange,
	showAllOption = false,
	onShowAllChange,
	showAllTickets = false,
}) => {
	const handleChange = e => {
		const value = e.target.value;
		
		// Se "todos" foi selecionado/desmarcado
		if (value.includes("all")) {
			if (showAllTickets) {
				// Se estava marcado, desmarcar todos
				onShowAllChange && onShowAllChange(false);
				onChange([]);
			} else {
				// Se não estava marcado, marcar todos
				onShowAllChange && onShowAllChange(true);
				const allQueueIds = userQueues?.map(queue => queue.id) || [];
				onChange([...allQueueIds, "no-queue"]);
			}
		} else {
			// Seleção normal de setores individuais
			onShowAllChange && onShowAllChange(false);
			onChange(value);
		}
	};

	const isAllSelected = showAllTickets || (userQueues?.length > 0 && selectedQueueIds.length === userQueues.length);

	return (
		<div style={{ width: 120, marginTop: -4 }}>
			<FormControl fullWidth margin="dense">
				<Select
					multiple
					displayEmpty
					variant="outlined"
					value={selectedQueueIds}
					onChange={handleChange}
					startAdornment={
						<InputAdornment position="start">
							<FilterListIcon fontSize="small" />
						</InputAdornment>
					}
					MenuProps={{
						anchorOrigin: {
							vertical: "bottom",
							horizontal: "left",
						},
						transformOrigin: {
							vertical: "top",
							horizontal: "left",
						},
						getContentAnchorEl: null,
					}}
					renderValue={() => i18n.t("ticketsQueueSelect.placeholder")}
				>
					{showAllOption && (
						<MenuItem dense key="all" value="all">
							<Checkbox
								size="small"
								color="primary"
								checked={isAllSelected}
							/>
							<ListItemText primary={i18n.t("ticketsQueueSelect.buttons.showAll")} />
						</MenuItem>
					)}
					<MenuItem dense key="no-queue" value="no-queue">
						<Checkbox
							size="small"
							color="primary"
							checked={selectedQueueIds.indexOf("no-queue") > -1}
						/>
						<ListItemText primary={i18n.t("ticketsQueueSelect.buttons.noQueue")} />
					</MenuItem>
					{userQueues?.length > 0 &&
						userQueues.map(queue => (
							<MenuItem dense key={queue.id} value={queue.id}>
								<Checkbox
									style={{
										color: queue.color,
									}}
									size="small"
									color="primary"
									checked={selectedQueueIds.indexOf(queue.id) > -1}
								/>
								<ListItemText primary={queue.name} />
							</MenuItem>
						))}
				</Select>
			</FormControl>
		</div>
	);
};

export default TicketsQueueSelect;
