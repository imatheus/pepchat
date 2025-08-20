import React, { useContext, useEffect, useState, useRef } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List, Popover, MenuList, MenuItem } from "@material-ui/core";
import {
  IoSpeedometerOutline,
  IoChatbubblesOutline,
  IoSyncOutline,
  IoSettingsOutline,
  IoPersonOutline,
  IoCallOutline,
  IoFlashOutline,
  IoLayersOutline,
  IoWalletOutline,

  IoPricetagOutline,
  IoFlameOutline,
  IoChevronUpOutline,
  IoChevronDownOutline,
  IoPeopleOutline,
  IoListOutline,
  IoTimeOutline
} from "react-icons/io5";

import { RiBardLine } from "react-icons/ri";
import { IoIosLink } from "react-icons/io";


import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { TutorialContext } from "../context/Tutorial/TutorialContext";
import { useCustomTheme } from "../context/Theme/ThemeContext";
import { Can } from "../components/Can";
import useCompanyStatus from "../hooks/useCompanyStatus";
import TutorialTooltip from "../components/TutorialTooltip";
import TutorialOverlay from "../components/TutorialOverlay";

const ICON_SIZE = 23;
const ICON_SIZE_EXPAND = 24;

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
          paddingLeft: drawerCollapsed ? 10 : 10,
          paddingRight: drawerCollapsed ? 10 : 10,
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
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<IoChatbubblesOutline size={ICON_SIZE} />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={<IoFlashOutline size={ICON_SIZE} />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<IoCallOutline size={ICON_SIZE} />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />

      <ListItemLink
        to="/tags"
        primary={i18n.t("mainDrawer.listItems.tags")}
        icon={<IoPricetagOutline size={ICON_SIZE} />}
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
        icon={<IoTimeOutline size={ICON_SIZE} />}
        drawerCollapsed={drawerCollapsed}
        disabled={isCompanyBlocked}
      />


      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            {!drawerCollapsed && <Divider />}
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
                    <IoFlameOutline size={ICON_SIZE} />

                  </ListItemIcon>
                  <ListItemText
                    primary={isCompanyBlocked ? ` ${i18n.t("mainDrawer.listItems.campaigns")}` : i18n.t("mainDrawer.listItems.campaigns")}
                    style={{ opacity: isCompanyBlocked ? 0.5 : 1 }}
                  />
                  {!isCompanyBlocked && (openCampaignSubmenu ? (
                    <IoChevronUpOutline size={ICON_SIZE_EXPAND} />
                  ) : (
                    <IoChevronDownOutline size={ICON_SIZE_EXPAND} />
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
                        <IoListOutline size={ICON_SIZE} />
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
                        <IoPeopleOutline size={ICON_SIZE} />
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
                        <IoSettingsOutline size={ICON_SIZE} />
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
                    <IoFlameOutline size={ICON_SIZE} />
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
                        <IoListOutline size={ICON_SIZE} />
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
                        <IoPeopleOutline size={ICON_SIZE} />
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
                        <IoSettingsOutline size={ICON_SIZE} />
                      </ListItemIcon>
                      <ListItemText primary="Configurações" />
                    </MenuItem>
                  </MenuList>
                </Popover>
              </>
            )}
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/"
                  primary="Dashboard"
                  icon={<IoSpeedometerOutline size={ICON_SIZE} />}
                  drawerCollapsed={drawerCollapsed}
                  disabled={isCompanyBlocked}
                />
              )}
            />

            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                  <IoIosLink size={ICON_SIZE} />
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
                icon={<RiBardLine size={ICON_SIZE} />}
                drawerCollapsed={drawerCollapsed}
                disabled={isCompanyBlocked}
              />
            </div>
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<IoPersonOutline size={ICON_SIZE} />}

              drawerCollapsed={drawerCollapsed}
              disabled={isCompanyBlocked}
            />
            <ListItemLink
              to="/integrations"
              primary={i18n.t("mainDrawer.listItems.integrations")}
              icon={<IoSyncOutline size={ICON_SIZE} />}

              drawerCollapsed={drawerCollapsed}
              disabled={isCompanyBlocked}
            />
            <ListItemLink
              to="/financial"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<IoWalletOutline size={ICON_SIZE} />}
              drawerCollapsed={drawerCollapsed}
              disabled={false}
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<IoSettingsOutline size={ICON_SIZE} />}
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