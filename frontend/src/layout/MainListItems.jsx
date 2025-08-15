import React, { useContext, useEffect, useState, useRef } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List, Popover, MenuList, MenuItem } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import ChatOutlinedIcon from "@material-ui/icons/ChatOutlined";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
// AccountTreeOutlinedIcon removido - não utilizado
import OfflineBoltOutlinedIcon from "@material-ui/icons/OfflineBoltOutlined";
import AndroidIcon from "@material-ui/icons/Android";
import AccountBalanceOutlinedIcon from "@material-ui/icons/AccountBalanceOutlined";
import PowerOutlinedIcon from "@material-ui/icons/PowerOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import WhatshotIconIcon from "@material-ui/icons/Whatshot";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AccessTimeOutlinedIcon from "@material-ui/icons/AccessTimeOutlined";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { TutorialContext } from "../context/Tutorial/TutorialContext";
import { useCustomTheme } from "../context/Theme/ThemeContext";
import { Can } from "../components/Can";
import useCompanyStatus from "../hooks/useCompanyStatus";
import TutorialTooltip from "../components/TutorialTooltip";
import TutorialOverlay from "../components/TutorialOverlay";

function ListItemLink(props) {
  const { icon, primary, to, className, drawerCollapsed, disabled = false } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={disabled ? "#" : to} ref={ref} {...itemProps} />
      )),
    [to, disabled]
  );

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
    }
  };

  return (
    <li>
      <ListItem 
        button 
        component={disabled ? "div" : renderLink} 
        className={className}
        title={drawerCollapsed ? (disabled ? `${primary} (Bloqueado)` : primary) : ""}
        onClick={handleClick}
        style={{ 
          justifyContent: drawerCollapsed ? 'center' : 'flex-start',
          paddingLeft: drawerCollapsed ? 16 : 16,
          paddingRight: drawerCollapsed ? 16 : 16,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {icon ? (
          <ListItemIcon style={{ 
            minWidth: drawerCollapsed ? 'auto' : '40px',
            opacity: disabled ? 0.5 : 1,
            position: 'relative'
          }}>
            {icon}
          </ListItemIcon>
        ) : null}
        {!drawerCollapsed && <ListItemText 
          primary={disabled ? `${primary}` : primary} 
          style={{ opacity: disabled ? 0.5 : 1 }}
        />}
      </ListItem>
    </li>
  );
}


const MainListItems = (props) => {
  const { drawerClose, drawerCollapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const { showQueuesTutorial, dismissTutorial } = useContext(TutorialContext);
  const { colors } = useCustomTheme();
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [campaignPopoverAnchor, setCampaignPopoverAnchor] = useState(null);
  const history = useHistory();
  const { isCompanyBlocked } = useCompanyStatus();
  const queuesMenuRef = useRef(null);

  
  useEffect(() => {
    // Verificar se o plano do usuário tem campanhas habilitadas
    if (user && user.company && user.company.plan && user.company.plan.useCampaigns) {
      setShowCampaigns(true);
    } else {
      setShowCampaigns(false);
    }
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 4000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const handleCampaignPopoverClose = () => {
    setCampaignPopoverAnchor(null);
  };

  const handleTutorialNext = () => {
    dismissTutorial();
    history.push("/queues");
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <ListItemLink
            to="/"
            primary="Dashboard"
            icon={<DashboardOutlinedIcon />}
            drawerCollapsed={drawerCollapsed}
            disabled={isCompanyBlocked}
          />
        )}
      />

      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<ChatOutlinedIcon />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={<OfflineBoltOutlinedIcon />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<ContactPhoneOutlinedIcon />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/tags"
        primary={i18n.t("mainDrawer.listItems.tags")}
        icon={<LocalOfferOutlinedIcon />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/schedules"
        primary={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {i18n.t("mainDrawer.listItems.schedules")}
            <span
              style={{
                background: '#fff',
                color: '#333',
                borderRadius: 12,
                fontSize: 10,
                padding: '2px 6px',
                lineHeight: 1,
              }}
            >
              Novo
            </span>
          </span>
        }
        icon={<AccessTimeOutlinedIcon />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            {!drawerCollapsed && <Divider />}
            {!drawerCollapsed && (
              <ListSubheader inset>
                {i18n.t("mainDrawer.listItems.administration")}
              </ListSubheader>
            )}
            {showCampaigns && !drawerCollapsed && (
              <>
                <ListItem
                  button
                  onClick={() => !isCompanyBlocked && setOpenCampaignSubmenu((prev) => !prev)}
                  style={{
                    opacity: isCompanyBlocked ? 0.5 : 1,
                    cursor: isCompanyBlocked ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ListItemIcon style={{ 
                    opacity: isCompanyBlocked ? 0.5 : 1,
                    position: 'relative'
                  }}>
                    <WhatshotIconIcon />

                  </ListItemIcon>
                  <ListItemText
                    primary={isCompanyBlocked ? ` ${i18n.t("mainDrawer.listItems.campaigns")}` : i18n.t("mainDrawer.listItems.campaigns")}
                    style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}
                  />
                  {!isCompanyBlocked && (openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  ))}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openCampaignSubmenu && !isCompanyBlocked}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    <ListItem 
                      onClick={() => !isCompanyBlocked && history.push("/campaigns")} 
                      button
                      style={{
                        opacity: isCompanyBlocked ? 0.5 : 1,
                        cursor: isCompanyBlocked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ListItemIcon style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={isCompanyBlocked ? " Listagem" : "Listagem"}
                        style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}
                      />
                    </ListItem>
                    <ListItem
                      onClick={() => !isCompanyBlocked && history.push("/contact-lists")}
                      button
                      style={{
                        opacity: isCompanyBlocked ? 0.5 : 1,
                        cursor: isCompanyBlocked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ListItemIcon style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={isCompanyBlocked ? " Listas de Contatos" : "Listas de Contatos"}
                        style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}
                      />
                    </ListItem>
                    <ListItem
                      onClick={() => !isCompanyBlocked && history.push("/campaigns-config")}
                      button
                      style={{
                        opacity: isCompanyBlocked ? 0.5 : 1,
                        cursor: isCompanyBlocked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ListItemIcon style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}>
                        <SettingsOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={isCompanyBlocked ? " Configurações" : "Configurações"}
                        style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}
                      />
                    </ListItem>
                  </List>
                </Collapse>
              </>
            )}
            {showCampaigns && drawerCollapsed && (
              <>
                <ListItem
                  button
                  onClick={(event) => !isCompanyBlocked && setCampaignPopoverAnchor(event.currentTarget)}
                  title={isCompanyBlocked ? `${i18n.t("mainDrawer.listItems.campaigns")} (Bloqueado)` : i18n.t("mainDrawer.listItems.campaigns")}
                  style={{ 
                    justifyContent: 'center',
                    paddingLeft: 16,
                    paddingRight: 16,
                    opacity: isCompanyBlocked ? 0.5 : 1,
                    cursor: isCompanyBlocked ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ListItemIcon style={{ 
                    minWidth: 'auto',
                    opacity: isCompanyBlocked ? 0.5 : 1,
                    position: 'relative'
                  }}>
                    <WhatshotIconIcon />
                  </ListItemIcon>
                </ListItem>
                <Popover
                  open={Boolean(campaignPopoverAnchor) && !isCompanyBlocked}
                  anchorEl={campaignPopoverAnchor}
                  onClose={handleCampaignPopoverClose}
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                  }}
                  PaperProps={{
                    style: {
                      marginLeft: 8,
                    }
                  }}
                >
                  <MenuList>
                    <MenuItem onClick={() => {
                      if (!isCompanyBlocked) {
                        history.push("/campaigns");
                        handleCampaignPopoverClose();
                      }
                    }}>
                      <ListItemIcon>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listagem" />
                    </MenuItem>
                    <MenuItem onClick={() => {
                      if (!isCompanyBlocked) {
                        history.push("/contact-lists");
                        handleCampaignPopoverClose();
                      }
                    }}>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listas de Contatos" />
                    </MenuItem>
                    <MenuItem onClick={() => {
                      if (!isCompanyBlocked) {
                        history.push("/campaigns-config");
                        handleCampaignPopoverClose();
                      }
                    }}>
                      <ListItemIcon>
                        <SettingsOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText primary="Configurações" />
                    </MenuItem>
                  </MenuList>
                </Popover>
              </>
            )}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                  <PowerOutlinedIcon />
                </Badge>
              }
              drawerCollapsed={drawerCollapsed}
              disabled={isCompanyBlocked}
            />
            <div 
              ref={queuesMenuRef}
              className={showQueuesTutorial ? 'tutorial-highlight' : ''}
              style={{
                position: 'relative',
                borderRadius: showQueuesTutorial ? '12px' : '0px',
                background: showQueuesTutorial 
                  ? `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)` 
                  : 'transparent',
                border: showQueuesTutorial ? `3px solid ${colors.primary}` : 'none',
                boxShadow: showQueuesTutorial 
                  ? `0 0 20px ${colors.primary}40, 0 0 40px ${colors.primary}20` 
                  : 'none',
                transform: showQueuesTutorial ? 'scale(1.05)' : 'scale(1)',
                zIndex: showQueuesTutorial ? 1302 : 'auto',
                transition: 'all 0.3s ease',
                margin: showQueuesTutorial ? '4px' : '0px',
              }}
            >
              <ListItemLink
                to="/queues"
                primary={i18n.t("mainDrawer.listItems.queues")}
                icon={<AndroidIcon />}
                drawerCollapsed={drawerCollapsed}
                disabled={isCompanyBlocked}
              />
            </div>
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<PeopleAltOutlinedIcon />}
              drawerCollapsed={drawerCollapsed}
              disabled={isCompanyBlocked}
            />
            <ListItemLink
              to="/integrations"
              primary={i18n.t("mainDrawer.listItems.integrations")}
              icon={<SyncAltIcon />}
              drawerCollapsed={drawerCollapsed}
              disabled={isCompanyBlocked}
            />
             <ListItemLink
                to="/financial"
                primary={i18n.t("mainDrawer.listItems.financeiro")}
                icon={<AccountBalanceOutlinedIcon />}
                drawerCollapsed={drawerCollapsed}
                disabled={false}
              />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<SettingsOutlinedIcon />}
              drawerCollapsed={drawerCollapsed}
              disabled={isCompanyBlocked}
            />
          </>
        )}
      />
      
      {/* Overlay para diminuir opacidade do background - Setores */}
      <TutorialOverlay 
        show={showQueuesTutorial}
        targetElement={queuesMenuRef.current}
      />
      
      {/* Tutorial Tooltip para Setores */}
      <TutorialTooltip
        open={showQueuesTutorial}
        anchorEl={queuesMenuRef.current}
        onClose={dismissTutorial}
        onNext={handleTutorialNext}
        title="Configure seus Setores"
        content="Para começar a usar o sistema, você precisa configurar pelo menos um setor. Os setores organizam seu atendimento e permitem direcionar conversas para equipes específicas."
        placement="right"
      />

          </div>
  );
};

export default MainListItems;