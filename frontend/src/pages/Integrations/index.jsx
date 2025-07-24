import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import { Tabs, Tab, Box, Typography } from "@material-ui/core";

import MessagesAPITab from "./MessagesAPITab";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    paddingBottom: 100
  },
  mainHeader: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  tabsContainer: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `integration-tab-${index}`,
    'aria-controls': `integration-tabpanel-${index}`,
  };
}

const Integrations = () => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper
      className={classes.mainPaper}
      variant="outlined"
    >
      <Typography variant="h5" className={classes.mainHeader}>
        Integrações
      </Typography>
      
      <div className={classes.tabsContainer}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="integration tabs"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="API" {...a11yProps(0)} />
        </Tabs>
      </div>

      <TabPanel value={tabValue} index={0}>
        <MessagesAPITab />
      </TabPanel>
    </Paper>
  );
};

export default Integrations;