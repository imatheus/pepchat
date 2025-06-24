/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useReducer } from "react";
import { toast } from "react-toastify";

import { useHistory } from "react-router-dom";

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

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import DescriptionIcon from "@material-ui/icons/Description";
import TimerOffIcon from "@material-ui/icons/TimerOff";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import PauseCircleOutlineIcon from "@material-ui/icons/PauseCircleOutline";
import SyncIcon from "@material-ui/icons/Sync";
import RefreshIcon from "@material-ui/icons/Refresh";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CampaignModal from "../../components/CampaignModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { Grid, Fab } from "@material-ui/core";
import { isArray } from "lodash";
import { useDate } from "../../hooks/useDate";
import { socketConnection } from "../../services/socket";

const reducer = (state, action) => {
  if (action.type === "LOAD_CAMPAIGNS") {
    const campaigns = action.payload;
    const newCampaigns = [];

    if (isArray(campaigns)) {
      campaigns.forEach((campaign) => {
        const campaignIndex = state.findIndex((u) => u.id === campaign.id);
        if (campaignIndex !== -1) {
          state[campaignIndex] = campaign;
        } else {
          newCampaigns.push(campaign);
        }
      });
    }

    return [...state, ...newCampaigns];
  }

  if (action.type === "UPDATE_CAMPAIGNS") {
    const campaign = action.payload;
    const campaignIndex = state.findIndex((u) => u.id === campaign.id);

    if (campaignIndex !== -1) {
      state[campaignIndex] = campaign;
      return [...state];
    } else {
      return [campaign, ...state];
    }
  }

  if (action.type === "DELETE_CAMPAIGN") {
    const campaignId = action.payload;

    const campaignIndex = state.findIndex((u) => u.id === campaignId);
    if (campaignIndex !== -1) {
      state.splice(campaignIndex, 1);
    }
    return [...state];
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
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textAlign: "center",
    minWidth: "80px",
    display: "inline-block",
  },
  statusInativa: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  statusProgramada: {
    backgroundColor: "#d1ecf1",
    color: "#0c5460",
    border: "1px solid #bee5eb",
  },
  statusEmAndamento: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeaa7",
  },
  statusCancelada: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  statusFinalizada: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  completedBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textAlign: "center",
    minWidth: "80px",
    display: "inline-block",
  },
  completed: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  notCompleted: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeaa7",
  },
  updatingRow: {
    backgroundColor: "#e3f2fd",
    transition: "background-color 0.3s ease",
    "& td": {
      borderColor: "#2196f3",
    }
  },
  pulseAnimation: {
    animation: "$pulse 1.5s ease-in-out infinite",
  },
  "@keyframes pulse": {
    "0%": {
      opacity: 1,
    },
    "50%": {
      opacity: 0.7,
    },
    "100%": {
      opacity: 1,
    },
  },
  spinning: {
    animation: "$spin 1s linear infinite",
  },
  "@keyframes spin": {
    "0%": {
      transform: "rotate(0deg)",
    },
    "100%": {
      transform: "rotate(360deg)",
    },
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1000,
    backgroundColor: '#1976d2',
    color: 'white',
    '&:hover': {
      backgroundColor: '#1565c0',
    },
    '&:disabled': {
      backgroundColor: '#e0e0e0',
      color: '#9e9e9e',
    }
  },
}));

const Campaigns = () => {
  const classes = useStyles();

  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [campaigns, dispatch] = useReducer(reducer, []);
  const [updatingCampaigns, setUpdatingCampaigns] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const { datetimeToClient } = useDate();

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchCampaigns();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-campaign`, (data) => {
      if (data.action === "update" || data.action === "create") {
        // Marcar campanha como sendo atualizada para mostrar indicador visual
        setUpdatingCampaigns(prev => new Set([...prev, data.record.id]));
        
        dispatch({ type: "UPDATE_CAMPAIGNS", payload: data.record });
        
        // Remover indicador após 2 segundos
        setTimeout(() => {
          setUpdatingCampaigns(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.record.id);
            return newSet;
          });
        }, 4000);
        
        // Mostrar toast de atualização
        if (data.action === "update") {
          toast.info(`Campanha "${data.record.name}" foi atualizada - Status: ${formatStatus(data.record.status)}`);
        }
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_CAMPAIGN", payload: +data.id });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get("/campaigns/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CAMPAIGNS", payload: data.records });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(true);
  };

  const handleCloseCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await api.delete(`/campaigns/${campaignId}`);
      toast.success(i18n.t("campaigns.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingCampaign(null);
    setSearchParam("");
    setPageNumber(1);
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

  const formatStatus = (val) => {
    switch (val) {
      case "INATIVA":
        return "Inativa";
      case "PROGRAMADA":
        return "Programada";
      case "EM_ANDAMENTO":
        return "Em Andamento";
      case "CANCELADA":
        return "Cancelada";
      case "FINALIZADA":
        return "Finalizada";
      default:
        return val;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "INATIVA":
        return `${classes.statusBadge} ${classes.statusInativa}`;
      case "PROGRAMADA":
        return `${classes.statusBadge} ${classes.statusProgramada}`;
      case "EM_ANDAMENTO":
        return `${classes.statusBadge} ${classes.statusEmAndamento}`;
      case "CANCELADA":
        return `${classes.statusBadge} ${classes.statusCancelada}`;
      case "FINALIZADA":
        return `${classes.statusBadge} ${classes.statusFinalizada}`;
      default:
        return `${classes.statusBadge} ${classes.statusInativa}`;
    }
  };

  const renderCompletedStatus = (completedAt) => {
    const isCompleted = !!completedAt;
    const statusClass = isCompleted 
      ? `${classes.completedBadge} ${classes.completed}`
      : `${classes.completedBadge} ${classes.notCompleted}`;
    
    return (
      <span className={statusClass}>
        {isCompleted ? "Concluída" : "Não concluída"}
      </span>
    );
  };

  const cancelCampaign = async (campaign) => {
    try {
      await api.post(`/campaigns/${campaign.id}/cancel`);
      toast.success(i18n.t("campaigns.toasts.cancel"));
      setPageNumber(1);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const restartCampaign = async (campaign) => {
    try {
      await api.post(`/campaigns/${campaign.id}/restart`);
      toast.success(i18n.t("campaigns.toasts.restart"));
      setPageNumber(1);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const processPendingCampaigns = async () => {
    setIsProcessing(true);
    try {
      await api.post("/campaigns/process-pending");
      toast.success("Campanhas pendentes processadas com sucesso!");
    } catch (err) {
      toast.error("Erro ao processar campanhas pendentes: " + err.message);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000); // Manter animação por 1 segundo extra para feedback visual
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingCampaign &&
          `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${
            deletingCampaign.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingCampaign.id)}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <CampaignModal
        resetPagination={() => {
          setPageNumber(1);
          fetchCampaigns();
        }}
        open={campaignModalOpen}
        onClose={handleCloseCampaignModal}
        aria-labelledby="form-dialog-title"
        campaignId={selectedCampaign && selectedCampaign.id}
      />
      <MainHeader>
        <Grid style={{ width: "99.6%" }} container>
          <Grid xs={12} sm={8} item>
            <Title>{i18n.t("campaigns.title")}</Title>
          </Grid>
          <Grid xs={12} sm={4} item>
            <Grid spacing={2} container>
              <Grid xs={6} sm={6} item>
                <TextField
                  fullWidth
                  placeholder={i18n.t("campaigns.searchPlaceholder")}
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
              </Grid>
              <Grid xs={6} sm={6} item>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleOpenCampaignModal}
                  color="primary"
                >
                  {i18n.t("campaigns.buttons.add")}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">
                {i18n.t("campaigns.table.name")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("campaigns.table.status")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("campaigns.table.contactList")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("campaigns.table.whatsapp")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("campaigns.table.scheduledAt")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("campaigns.table.completedAt")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("campaigns.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {campaigns.map((campaign) => {
                const isUpdating = updatingCampaigns.has(campaign.id);
                return (
                  <TableRow 
                    key={campaign.id}
                    className={isUpdating ? classes.updatingRow : ""}
                  >
                    <TableCell align="center">
                      <span className={isUpdating ? classes.pulseAnimation : ""}>
                        {campaign.name}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className={`${getStatusClass(campaign.status)} ${isUpdating ? classes.pulseAnimation : ""}`}>
                        {formatStatus(campaign.status)}
                      </span>
                    </TableCell>
                  <TableCell align="center">
                    {campaign.contactListId
                      ? campaign.contactList.name
                      : "Não definida"}
                  </TableCell>
                  <TableCell align="center">
                    {campaign.whatsappId
                      ? campaign.whatsapp.name
                      : "Não definido"}
                  </TableCell>
                  <TableCell align="center">
                    {campaign.scheduledAt
                      ? datetimeToClient(campaign.scheduledAt)
                      : "Sem agendamento"}
                  </TableCell>
                  <TableCell align="center">
                    {renderCompletedStatus(campaign.completedAt)}
                  </TableCell>
                  <TableCell align="center">
                    {campaign.status === "EM_ANDAMENTO" && (
                      <IconButton
                        onClick={() => cancelCampaign(campaign)}
                        title="Parar Campanha"
                        size="small"
                      >
                        <PauseCircleOutlineIcon />
                      </IconButton>
                    )}
                    {campaign.status === "CANCELADA" && (
                      <IconButton
                        onClick={() => restartCampaign(campaign)}
                        title="Parar Campanha"
                        size="small"
                      >
                        <PlayCircleOutlineIcon />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={() =>
                        history.push(`/campaign/${campaign.id}/report`)
                      }
                      size="small"
                    >
                      <DescriptionIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditCampaign(campaign)}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingCampaign(campaign);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })}
              {loading && <TableRowSkeleton columns={7} />}
            </>
          </TableBody>
        </Table>
      </Paper>
      
      <Fab 
        className={classes.fab}
        onClick={processPendingCampaigns}
        title="Processar Campanhas Pendentes"
        disabled={isProcessing}
      >
        {isProcessing ? <SyncIcon className={classes.spinning} /> : <RefreshIcon />}
      </Fab>
    </MainContainer>
  );
};

export default Campaigns;