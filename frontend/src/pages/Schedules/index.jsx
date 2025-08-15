import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useContext,
} from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Chip from "@material-ui/core/Chip";
import Avatar from "@material-ui/core/Avatar";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import ReplayIcon from "@material-ui/icons/Replay";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
// import AccessTimeOutlinedIcon from "@material-ui/icons/AccessTimeOutlined";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import moment from "moment";
import { capitalize } from "lodash";
import { socketConnection } from "../../services/socket";
import { AuthContext } from "../../context/Auth/AuthContext";

// A custom hook that builds on useLocation to parse
// the query string for you.
const getUrlParam = (param) => {
  return new URLSearchParams(window.location.search).get(param);
};

const reducer = (state, action) => {
  if (action.type === "LOAD_SCHEDULES") {
    const schedules = action.payload;
    const newSchedules = [];

    schedules.forEach((schedule) => {
      const scheduleIndex = state.findIndex((s) => s.id === schedule.id);
      if (scheduleIndex !== -1) {
        state[scheduleIndex] = schedule;
      } else {
        newSchedules.push(schedule);
      }
    });

    return [...state, ...newSchedules];
  }

  if (action.type === "UPDATE_SCHEDULES") {
    const schedule = action.payload;
    const scheduleIndex = state.findIndex((s) => s.id === schedule.id);

    if (scheduleIndex !== -1) {
      state[scheduleIndex] = schedule;
      return [...state];
    } else {
      return [schedule, ...state];
    }
  }

  if (action.type === "DELETE_SCHEDULE") {
    const scheduleId = action.payload;
    return state.filter((s) => s.id !== scheduleId);
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  statusChip: {
    height: 22,
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
  },
}));

const Schedules = () => {
  const classes = useStyles();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [schedules, dispatch] = useReducer(reducer, []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(+getUrlParam("contactId"));

  const fetchSchedules = useCallback(async () => {
    try {
      const { data } = await api.get("/schedules/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_SCHEDULES", payload: data.schedules });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  }, [searchParam, pageNumber]);

  const handleOpenScheduleModalFromContactId = useCallback(() => {
    if (contactId) {
      handleOpenScheduleModal();
    }
  }, [contactId]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchSchedules();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [
    searchParam,
    pageNumber,
    contactId,
    fetchSchedules,
    handleOpenScheduleModalFromContactId,
  ]);

  useEffect(() => {
    handleOpenScheduleModalFromContactId();
    const socket = socketConnection({ companyId: user.companyId });

    socket.on("schedule", (data) => {
      if ((data.action === "update" || data.action === "create") && data.schedule) {
        // Garantir que schedule tenha as chaves esperadas para não quebrar a renderização
        const safeSchedule = {
          ...data.schedule,
          contact: data.schedule.contact || { id: 0, name: "" },
          user: data.schedule.user || { id: 0, name: "" },
        };

        dispatch({ type: "UPDATE_SCHEDULES", payload: safeSchedule });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_SCHEDULE", payload: Number(data.scheduleId) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [handleOpenScheduleModalFromContactId, user]);

  const cleanContact = () => {
    setContactId("");
  };

  const handleOpenScheduleModal = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleModalOpen(true);
  };

  const handleReschedule = async (schedule) => {
    try {
      const newSendAt = moment().add(1, 'hour').toISOString();
      // Atualizar o agendamento existente (não mostrar feedback na UI)
      await api.put(`/schedules/${schedule.id}`, {
        sendAt: newSendAt,
      });
      // intencionalmente sem toasts/sem reload imediato; a lista será atualizada via socket "update"
    } catch (err) {
      // intencionalmente silencioso para UX "nada acontece"
      console.error('Reschedule (update existing) failed', err);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      
      toast.success("✅ Agendamento excluído com sucesso!");
      
      // Atualizar lista localmente (garantir que o ID seja número)
      dispatch({ type: "DELETE_SCHEDULE", payload: Number(scheduleId) });
      
    } catch (err) {
      console.error("🗑️ Frontend - Delete failed:", err);
      toastError(err);
    } finally {
      // Sempre fechar modal de confirmação
      setDeletingSchedule(null);
      setConfirmModalOpen(false);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const truncate = (str, len) => {
    if (str.length > len) {
      return str.substring(0, len) + "...";
    }
    return str;
  };

  const renderStatusChip = (status) => {
    const s = (status || '').toUpperCase();
    let label = 'Pendente';
    let bg = '#ff9800'; // default: pending - orange
    if (s === 'ENVIADO') { label = 'Enviado'; bg = '#4caf50'; }
    if (s === 'ERRO') { label = 'Erro'; bg = '#f44336'; }
    return (
      <Chip
        label={label}
        className={classes.statusChip}
        style={{ backgroundColor: bg }}
        size="small"
      />
    );
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingSchedule &&
          `${i18n.t("schedules.confirmationModal.deleteTitle")}`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteSchedule(deletingSchedule.id)}
      >
        {i18n.t("schedules.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        reload={fetchSchedules}
        aria-labelledby="form-dialog-title"
        scheduleId={selectedSchedule && selectedSchedule.id}
        contactId={contactId}
        cleanContact={cleanContact}
      />
      <MainHeader>
        <Title>{i18n.t("schedules.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenScheduleModal}
          >
            {i18n.t("schedules.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">
                {i18n.t("schedules.table.contact")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("schedules.table.body")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("schedules.table.sendAt")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("schedules.table.status")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("schedules.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell align="left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
                      <Avatar src={schedule.contact?.profilePicUrl} style={{ width: 28, height: 28 }} />
                      <span>{schedule.contact?.name || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell align="center" title={schedule.body}>
                    {truncate(schedule.body, 25)}
                  </TableCell>

                  <TableCell align="center">
                    {moment(schedule.sendAt).format("DD/MM/YYYY HH:mm:ss")}
                  </TableCell>
                  <TableCell align="center">
                    {renderStatusChip(schedule.status)}
                  </TableCell>
                  <TableCell align="center">
                    {schedule.status === 'PENDENTE' && (
                      <IconButton
                        size="small"
                        onClick={() => handleEditSchedule(schedule)}
                        title="Editar agendamento"
                      >
                        <EditIcon />
                      </IconButton>
                    )}

                    {schedule.status === 'PENDENTE' && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setConfirmModalOpen(true);
                          setDeletingSchedule(schedule);
                        }}
                        title="Excluir agendamento"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}

                    {schedule.status === 'ERRO' && (
                      <IconButton
                        size="small"
                        onClick={() => handleReschedule(schedule)}
                        title="Reagendar em 1 hora"
                      >
                        <ReplayIcon />
                      </IconButton>
                    )}
                    
                    {(schedule.status !== 'PENDENTE' && schedule.status !== 'ERRO') && (
                      <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Schedules;
