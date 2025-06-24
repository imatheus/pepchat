import React, { useState } from "react";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import TicketsManager from "../../components/TicketsManagerTabs/";

const useStyles = makeStyles(theme => ({
	grid: {
		width: "100%",
		height: "100%",
		marginTop: "25px",
		[theme.breakpoints.between("sm", "md")]: {
			marginTop: "15px",
		},
		[theme.breakpoints.down("sm")]: {
			marginTop: "10px",
		},
	},
	paper: {
		padding: theme.spacing(2),
		display: "flex",
		overflow: "auto",
		flexDirection: "column",
		height: "100%",
		[theme.breakpoints.between("sm", "md")]: {
			padding: theme.spacing(1.5),
		},
		[theme.breakpoints.down("sm")]: {
			padding: theme.spacing(1),
		},
	},
}));

const TicketsAdvanced = () => {
	const classes = useStyles();

	const [searchParam, setSearchParam] = useState("");
	const [tags, setTags] = useState([]);
	const [users, setUsers] = useState([]);
	const [date, setDate] = useState(null);

	return (
		<Grid container className={classes.grid}>
			<Grid item xs={12}>
				<Paper className={classes.paper}>
					<TicketsManager
						searchParam={searchParam}
						setSearchParam={setSearchParam}
						tags={tags}
						setTags={setTags}
						users={users}
						setUsers={setUsers}
						date={date}
						setDate={setDate}
					/>
				</Paper>
			</Grid>
		</Grid>
	);
};

export default TicketsAdvanced;