import React, { useEffect, useState, useContext } from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import ThemedToastContainer from "../components/ThemedToastContainer";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import TicketResponsiveContainer from "../pages/TicketResponsiveContainer";
import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import Connections from "../pages/Connections/";
import SettingsCustom from "../pages/SettingsCustom/";
import Financeiro from "../pages/Financeiro/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import Queues from "../pages/Queues/";
import Tags from "../pages/Tags/";
import Integrations from "../pages/Integrations/";
import ContactLists from "../pages/ContactLists/";
import ContactListItems from "../pages/ContactListItems/";
// import Companies from "../pages/Companies/";
import QuickMessages from "../pages/QuickMessages/";
import { AuthProvider, AuthContext } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import TrialGuard from "../components/TrialGuard";
import Route from "./Route";
import Campaigns from "../pages/Campaigns";
import CampaignsConfig from "../pages/CampaignsConfig";
import CampaignReport from "../pages/CampaignReport";
import Subscription from "../pages/Subscription/";

const RoutesContent = () => {
  const { user } = useContext(AuthContext);
  const [showCampaigns, setShowCampaigns] = useState(false);

  useEffect(() => {
    // Verificar se o plano do usuário tem campanhas habilitadas
    if (user && user.company && user.company.plan && user.company.plan.useCampaigns) {
      setShowCampaigns(true);
    } else {
      setShowCampaigns(false);
    }
  }, [user]);

  return (
    <TicketsContextProvider>
      <TrialGuard>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/signup" component={Signup} />
          {/* <Route exact path="/create-company" component={Companies} /> */}
          <WhatsAppsProvider>
            <LoggedInLayout>
              <Route exact path="/" component={Dashboard} isPrivate />
              <Route
                exact
                path="/tickets/:ticketId?"
                component={TicketResponsiveContainer}
                isPrivate
              />
              <Route
                exact
                path="/connections"
                component={Connections}
                isPrivate
              />
              <Route
                exact
                path="/quick-messages"
                component={QuickMessages}
                isPrivate
              />
              <Route exact path="/tags" component={Tags} isPrivate />
              <Route exact path="/contacts" component={Contacts} isPrivate />
              <Route exact path="/users" component={Users} isPrivate />
              <Route
                exact
                path="/integrations"
                component={Integrations}
                isPrivate
              />
              <Route
                exact
                path="/settings"
                component={SettingsCustom}
                isPrivate
              />
              <Route
                exact
                path="/financeiro"
                component={Financeiro}
                isPrivate
              />
              <Route exact path="/queues" component={Queues} isPrivate />
              <Route
                exact
                path="/subscription"
                component={Subscription}
                isPrivate
              />
              {showCampaigns && (
                <>
                  <Route
                    exact
                    path="/contact-lists"
                    component={ContactLists}
                    isPrivate
                  />
                  <Route
                    exact
                    path="/contact-lists/:contactListId/contacts"
                    component={ContactListItems}
                    isPrivate
                  />
                  <Route
                    exact
                    path="/campaigns"
                    component={Campaigns}
                    isPrivate
                  />
                  <Route
                    exact
                    path="/campaign/:campaignId/report"
                    component={CampaignReport}
                    isPrivate
                  />
                  <Route
                    exact
                    path="/campaigns-config"
                    component={CampaignsConfig}
                    isPrivate
                  />
                </>
              )}
            </LoggedInLayout>
          </WhatsAppsProvider>
        </Switch>
      </TrialGuard>
      <ThemedToastContainer />
    </TicketsContextProvider>
  );
};

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;