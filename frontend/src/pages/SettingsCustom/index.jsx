import React, { useState, useEffect } from "react";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import { makeStyles, Paper, Tabs, Tab } from "@material-ui/core";

import TabPanel from "../../components/TabPanel";

import CompaniesManager from "../../components/CompaniesManager";
import PlansManager from "../../components/PlansManager";
import Options from "../../components/Settings/Options";
import AsaasManager from "../../components/AsaasManager";

import { i18n } from "../../translate/i18n.js";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth.js";
import useSettings from "../../hooks/useSettings";

import OnlyForSuperUser from "../../components/OnlyForSuperUser";

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.palette.background.paper,
  },
  mainPaper: {
    ...theme.scrollbarStyles,
    overflowY: "scroll",
    flex: 1,
  },
  tab: {
    background: "#f2f5f3",
    borderRadius: 4,
  },
  paper: {
    ...theme.scrollbarStyles,
    overflowY: "scroll",
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  container: {
    width: "100%",
    maxHeight: "100%",
  },
  control: {
    padding: theme.spacing(1),
  },
  textfield: {
    width: "100%",
  },
}));

const SettingsCustom = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("options");
    const [currentUser, setCurrentUser] = useState({});
  const [settings, setSettings] = useState({});

  const { getCurrentUserInfo } = useAuth();
  const { getAll: getAllSettings } = useSettings();

  useEffect(() => {
    async function findData() {
      try {
        const settingList = await getAllSettings();
        setSettings(settingList);

        const user = await getCurrentUserInfo();
        setCurrentUser(user);
      } catch (e) {
        toast.error(e);
      }
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (event, newValue) => {
      async function findData() {
        try {
          const settingList = await getAllSettings();
          setSettings(settingList);
  
          const user = await getCurrentUserInfo();
          setCurrentUser(user);
        } catch (e) {
          toast.error(e);
        }
      }
      findData();
      // eslint-disable-next-line react-hooks/exhaustive-deps

    setTab(newValue);
  };

  const isSuper = () => {
    return currentUser.super;
  };

  return (
    <MainContainer className={classes.root}>
      <MainHeader>
        <Title>{i18n.t("settings.title")}</Title>
      </MainHeader>
      <Paper className={classes.mainPaper} elevation={1}>
        <Tabs
          value={tab}
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          onChange={handleTabChange}
          className={classes.tab}
        >
          <Tab label="Opções" value={"options"} />
          {isSuper() ? <Tab label="Empresas" value={"companies"} /> : null}
          {isSuper() ? <Tab label="Planos" value={"plans"} /> : null}
          {isSuper() ? <Tab label="Asaas" value={"asaas"} /> : null}
        </Tabs>
        <Paper className={classes.paper} elevation={0}>
          <OnlyForSuperUser
            user={currentUser}
            yes={() => (
              <TabPanel
                className={classes.container}
                value={tab}
                name={"companies"}
              >
                <CompaniesManager />
              </TabPanel>
            )}
          />
          <OnlyForSuperUser
            user={currentUser}
            yes={() => (
              <TabPanel
                className={classes.container}
                value={tab}
                name={"plans"}
              >
                <PlansManager />
              </TabPanel>
            )}
          />
          <OnlyForSuperUser
            user={currentUser}
            yes={() => (
              <TabPanel
                className={classes.container}
                value={tab}
                name={"asaas"}
              >
                <AsaasManager />
              </TabPanel>
            )}
          />
          <TabPanel className={classes.container} value={tab} name={"options"}>
            <Options
              settings={settings}
            />
          </TabPanel>
        </Paper>
      </Paper>
    </MainContainer>
  );
};

export default SettingsCustom;