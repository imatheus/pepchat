import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import FilterListIcon from "@material-ui/icons/FilterList";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import AddIcon from "@material-ui/icons/Add";
import { 
  IconButton, 
  MenuItem, 
  Checkbox, 
  ListItemText, 
  List,
  Popover
} from "@material-ui/core";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { getThemeColors } from "../../styles/colors";

const useStyles = makeStyles((theme) => {
  const isDark = theme.palette.type === 'dark';
  const themeColors = getThemeColors(isDark);
  
  return {
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
      backgroundColor: theme.palette.background.paper,
      position: "relative",
      "& .MuiTabs-scroller": {
        overflow: "hidden",
        borderRadius: "12px",
        background: isDark ? themeColors.background.darkGrey : themeColors.background.border,
        margin: "6px",
        boxShadow: isDark 
          ? `1px 10px 50px ${themeColors.shadow.dark}` 
          : `1px 10px 50px ${themeColors.background.lightGrey}`,
      },
      "& .MuiTabs-flexContainer": {
        width: "100%",
        display: "flex",
      },
    },

    newTicketButtonInTabs: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: "12px",
      minWidth: "32px",
      width: "32px", 
      height: "32px",
      padding: "0",
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
      },
    },

    settingsIcon: {
      alignSelf: "center",
      marginLeft: "auto",
      padding: 8,
    },

    tab: {
      minWidth: 105,
      flex: 1,
      maxWidth: 'none',
      [theme.breakpoints.down('md')]: {
        minWidth: 80,
        fontSize: '0.75rem',
        flex: 1,
      },
      [theme.breakpoints.down('sm')]: {
        minWidth: 60,
        fontSize: '0.7rem',
        flex: 1,
        '& .MuiTab-wrapper': {
          flexDirection: 'column',
          '& .MuiSvgIcon-root': {
            marginBottom: 2,
            fontSize: '1rem',
          },
        },
      },
    },
    
    newTicketTab: {
      minWidth: 50,
      width: 50,
      maxWidth: 50,
      flex: '0 0 50px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    },

    ticketOptionsBox: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: theme.palette.background.paper,
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

    badge: {
      right: "-10px",
    },
    show: {
      display: "block",
    },
    hide: {
      display: "none !important",
    },
    newTicketButton: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: "50%",
      minWidth: "48px",
      width: "48px", 
      height: "48px",
      padding: "0",
      marginLeft: "auto",
      marginRight: theme.spacing(1),
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
    },
    filterPopover: {
      "& .MuiPopover-paper": {
        minWidth: 250,
        maxWidth: 300,
        maxHeight: 400,
        overflow: "auto",
      },
    },
    filterList: {
      padding: theme.spacing(1),
      "& .MuiMenuItem-root": {
        borderRadius: theme.spacing(1),
        margin: theme.spacing(0.5, 0),
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
      },
    },
  };
});

const TicketsManagerTabs = ({ mergeOpenPending = false }) => {
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const searchInputRef = useRef();
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const userQueueIds = user.queues.map((q) => q.id);
  
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
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
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
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
  }, [tab]);

  let searchTimeout;

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      setTab("open");
      return;
    }

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const handleChangeTab = (e, newValue) => {
    if (newValue === "filter") {
      // Abrir o popover de filtro
      setFilterAnchorEl(e.currentTarget);
    } else if (newValue === "newTicket") {
      // Não fazer nada, o botão tem seu próprio onClick
      return;
    } else {
      // Fechar o popover se estiver aberto
      setFilterAnchorEl(null);
      setTab(newValue);
    }
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);
    setSelectedTags(tags);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);
    setSelectedUsers(users);
  };

  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
  };

  const isFilterOpen = Boolean(filterAnchorEl);

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
          variant="fullWidth"
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
          <Tab
            value={"filter"}
            icon={<FilterListIcon />}
            label="Filtrar"
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"newTicket"}
            icon={
              <IconButton
                className={classes.newTicketButtonInTabs}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNewTicketModalOpen(true);
                }}
                title={i18n.t("ticketsManager.buttons.newTicket")}
              >
                <AddIcon />
              </IconButton>
            }
            label=""
            classes={{ root: classes.newTicketTab }}
          />
        </Tabs>
      </Paper>

      {/* Popover de Filtro */}
      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilter}
        className={classes.filterPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Can
          role={user.profile}
          perform="tickets-manager:showall"
          yes={() => (
            <List className={classes.filterList}>
              <MenuItem 
                dense 
                onClick={() => setShowAllTickets(!showAllTickets)}
              >
                <Checkbox
                  size="small"
                  color="primary"
                  checked={showAllTickets}
                />
                <ListItemText primary={i18n.t("ticketsQueueSelect.buttons.showAll")} />
              </MenuItem>
              
              <MenuItem 
                dense 
                onClick={() => {
                  const isSelected = selectedQueueIds.includes("no-queue");
                  const newSelectedIds = isSelected
                    ? selectedQueueIds.filter(id => id !== "no-queue")
                    : [...selectedQueueIds, "no-queue"];
                  handleQueueIdsChange(newSelectedIds);
                }}
              >
                <Checkbox
                  size="small"
                  color="primary"
                  checked={selectedQueueIds.includes("no-queue")}
                />
                <ListItemText primary={i18n.t("ticketsQueueSelect.buttons.noQueue")} />
              </MenuItem>
              
              {user?.queues?.map(queue => (
                <MenuItem 
                  dense 
                  key={queue.id} 
                  onClick={() => {
                    const isSelected = selectedQueueIds.includes(queue.id);
                    const newSelectedIds = isSelected
                      ? selectedQueueIds.filter(id => id !== queue.id)
                      : [...selectedQueueIds, queue.id];
                    handleQueueIdsChange(newSelectedIds);
                  }}
                >
                  <Checkbox
                    style={{ color: queue.color }}
                    size="small"
                    color="primary"
                    checked={selectedQueueIds.includes(queue.id)}
                  />
                  <ListItemText primary={queue.name} />
                </MenuItem>
              ))}
            </List>
          )}
          no={() => (
            <List className={classes.filterList}>
              <MenuItem 
                dense 
                onClick={() => {
                  const isSelected = selectedQueueIds.includes("no-queue");
                  const newSelectedIds = isSelected
                    ? selectedQueueIds.filter(id => id !== "no-queue")
                    : [...selectedQueueIds, "no-queue"];
                  handleQueueIdsChange(newSelectedIds);
                }}
              >
                <Checkbox
                  size="small"
                  color="primary"
                  checked={selectedQueueIds.includes("no-queue")}
                />
                <ListItemText primary={i18n.t("ticketsQueueSelect.buttons.noQueue")} />
              </MenuItem>
              
              {user?.queues?.map(queue => (
                <MenuItem 
                  dense 
                  key={queue.id} 
                  onClick={() => {
                    const isSelected = selectedQueueIds.includes(queue.id);
                    const newSelectedIds = isSelected
                      ? selectedQueueIds.filter(id => id !== queue.id)
                      : [...selectedQueueIds, queue.id];
                    handleQueueIdsChange(newSelectedIds);
                  }}
                >
                  <Checkbox
                    style={{ color: queue.color }}
                    size="small"
                    color="primary"
                    checked={selectedQueueIds.includes(queue.id)}
                  />
                  <ListItemText primary={queue.name} />
                </MenuItem>
              ))}
            </List>
          )}
        />
      </Popover>

      <Paper square elevation={0} className={classes.ticketOptionsBox}>
        <div className={classes.leftSection}>
          {/* Espaço vazio - botão foi movido para as tabs */}
        </div>
        
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

        <div className={classes.rightSection}>
          {/* Botão removido daqui e movido para as tabs */}
        </div>
      </Paper>
      
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        {!mergeOpenPending ? (
          <>
            <Tabs
              value={tabOpen}
              onChange={handleChangeTabOpen}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab
                label={
                  <Badge
                    className={classes.badge}
                    badgeContent={openCount}
                    color="primary"
                  >
                    {i18n.t("ticketsList.assignedHeader")}
                  </Badge>
                }
                value={"open"}
              />
              <Tab
                label={
                  <Badge
                    className={classes.badge}
                    badgeContent={pendingCount}
                    color="secondary"
                  >
                    {i18n.t("ticketsList.pendingHeader")}
                  </Badge>
                }
                value={"pending"}
              />
            </Tabs>
            <Paper className={classes.ticketsWrapper}>
              <TicketsList
                status="open"
                showAll={showAllTickets}
                selectedQueueIds={selectedQueueIds}
                updateCount={(val) => setOpenCount(val)}
                style={{ display: tabOpen === "open" ? "block" : "none" }}
                highlightUnread={mergeOpenPending}
              />
              <TicketsList
                status="pending"
                selectedQueueIds={selectedQueueIds}
                updateCount={(val) => setPendingCount(val)}
                style={{ display: tabOpen === "pending" ? "block" : "none" }}
                highlightUnread={mergeOpenPending}
              />
            </Paper>
          </>
        ) : (
          // Nova visualização: sem aba "Aguardando", listas juntas
          <Paper className={classes.ticketsWrapper}>
            <TicketsList
              status="open"
              showAll={showAllTickets}
              selectedQueueIds={selectedQueueIds}
              updateCount={(val) => setOpenCount(val)}
              style={{ display: "block" }}
              highlightUnread={mergeOpenPending}
              noTopDivider={true}
            />
            <TicketsList
              status="pending"
              selectedQueueIds={selectedQueueIds}
              updateCount={(val) => setPendingCount(val)}
              style={{ display: "block" }}
              highlightUnread={mergeOpenPending}
              noTopDivider={true}
            />
          </Paper>
        )}
      </TabPanel>
      
      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
        />
      </TabPanel>
      
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        <TagsFilter onFiltered={handleSelectedTags} />
        {profile === "admin" && (
          <UsersFilter onFiltered={handleSelectedUsers} />
        )}
        <TicketsList
          searchParam={searchParam}
          showAll={true}
          tags={selectedTags}
          users={selectedUsers}
          selectedQueueIds={selectedQueueIds}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;