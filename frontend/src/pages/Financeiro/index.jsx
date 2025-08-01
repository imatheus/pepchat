import React, { useState, useEffect, useReducer, useContext, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import VisibilityIcon from "@material-ui/icons/Visibility";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import SubscriptionModal from "../../components/SubscriptionModal";
import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { AuthContext } from "../../context/Auth/AuthContext";

import toastError from "../../errors/toastError";
import { showUniqueWarning } from "../../utils/toastManager";
import { socketConnection } from "../../services/socket";
import useCompanyStatus from "../../hooks/useCompanyStatus";
import TrialUpgradePrompt from "../../components/TrialUpgradePrompt";

import moment from "moment";

const reducer = (state, action) => {
  if (action.type === "LOAD_INVOICES") {
    const invoices = action.payload;
    const newUsers = [];

    invoices.forEach((user) => {
      const userIndex = state.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      // Atualizar apenas os campos fornecidos, mantendo os outros
      state[userIndex] = { ...state[userIndex], ...user };
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;

    const userIndex = state.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    gap: theme.spacing(3),
    marginTop: theme.spacing(1),
    padding: theme.spacing(3),
    paddingTop: theme.spacing(2),
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
    },
  },
  leftColumn: {
    flex: "0 0 320px",
    position: "relative",
    [theme.breakpoints.down("md")]: {
      flex: "1 1 auto",
    },
  },
  rightColumn: {
    flex: "1 1 auto",
    minWidth: 0,
  },
  planCard: {
    borderRadius: "16px",
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.palette.type === 'dark' 
      ? "0 8px 32px rgba(0, 0, 0, 0.3)" 
      : "0 8px 32px rgba(0, 0, 0, 0.08)",
    border: `1px solid ${theme.palette.divider}`,
    position: "relative",
    height: "fit-content",
    overflow: "hidden",
  },
  activeBadge: {
    position: "absolute",
    top: "-8px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#44b774",
    color: "#ffffff",
    padding: theme.spacing(0.8, 3),
    borderRadius: "25px",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    boxShadow: "0 4px 12px rgba(68, 183, 116, 0.3)",
    fontFamily: "'Inter', 'Roboto', sans-serif",
    zIndex: 10,
  },
  planHeader: {
    textAlign: "center",
    marginBottom: theme.spacing(3),
    position: "relative",
    zIndex: 1,
  },
  planTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  planPrice: {
    fontSize: "2.5rem",
    fontWeight: "800",
    marginBottom: theme.spacing(0.5),
    color: "#44b774",
    fontFamily: "'Inter', 'Roboto', sans-serif",
    lineHeight: 1,
  },
  planPriceUnit: {
    fontSize: "0.9rem",
    opacity: 0.7,
    color: theme.palette.text.secondary,
    fontFamily: "'Inter', 'Roboto', sans-serif",
    fontWeight: "500",
  },
  featuresList: {
    marginBottom: theme.spacing(2),
    position: "relative",
    zIndex: 1,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1.2),
    fontSize: "0.9rem",
    fontFamily: "'Inter', 'Roboto', sans-serif",
    fontWeight: "500",
    color: theme.palette.text.primary,
  },
  featureIcon: {
    marginRight: theme.spacing(1),
    color: "#ffffff",
    fontSize: "1rem",
    backgroundColor: "#44b774",
    borderRadius: "50%",
    padding: "4px",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(68, 183, 116, 0.2)",
  },
  featureIconMissing: {
    marginRight: theme.spacing(1),
    color: "#ffffff",
    fontSize: "1rem",
    backgroundColor: "#f44336",
    borderRadius: "50%",
    padding: "4px",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(244, 67, 54, 0.2)",
  },
  cancelNotice: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
    textAlign: "center",
  },
  dueDate: {
    textAlign: "center",
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1),
    backgroundColor: "#fff3cd",
    borderRadius: "8px",
    border: "1px solid #ffeaa7",
  },
  invoicesPaper: {
    padding: theme.spacing(2),
    height: "fit-content",
    minHeight: "500px",
    borderRadius: "16px",
  },
  invoicesTitle: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.type === 'dark' ? '#424242' : '#f5f5f5',
    margin: `-${theme.spacing(2)}px -${theme.spacing(2)}px ${theme.spacing(2)}px -${theme.spacing(2)}px`,
    borderRadius: "16px 16px 0 0",
    color: theme.palette.text.primary,
  },
  paidStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#4caf50",
    color: "white",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    gap: theme.spacing(0.5),
  },
  paidStatusIcon: {
    fontSize: "1rem",
  },
  overdueStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#f44336",
    color: "white",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  nearDueStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#ff9800",
    color: "white",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  openStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#2196f3",
    color: "white",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  viewInvoiceButton: {
    padding: theme.spacing(0.5),
    color: "#1976d2",
    "&:hover": {
      backgroundColor: "rgba(25, 118, 210, 0.1)",
    },
  },
  expiredBanner: {
    backgroundColor: "#f44336",
    color: "#fff",
    padding: theme.spacing(3),
    textAlign: "center",
    borderRadius: "16px",
    marginBottom: theme.spacing(3),
    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
  },
  expiredTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: theme.spacing(1),
  },
  expiredMessage: {
    fontSize: "1rem",
    marginBottom: theme.spacing(2),
  },
  expiredContact: {
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
}));

const Invoices = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { companyStatus } = useCompanyStatus();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [, setHasMore] = useState(false);
  const [searchParam, ] = useState("");
  const [invoices, dispatch] = useReducer(reducer, []);
  const [storagePlans, setStoragePlans] = React.useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const getPlanFeatures = useCallback((plan) => {
    if (!plan) return [];
    
    const features = [
      { text: `${plan.users} usuário${plan.users > 1 ? 's' : ''} por licença`, included: true },
      { text: `${plan.connections} ${plan.connections > 1 ? 'conexões' : 'conexão'} WhatsApp`, included: true },
      { text: `${plan.queues} fila${plan.queues > 1 ? 's' : ''} de atendimento`, included: true },
    ];

    // Add conditional features based on plan capabilities
    if (plan.useFacebook !== undefined) {
      features.push({ text: "Facebook Messenger", included: plan.useFacebook });
    }
    if (plan.useInstagram !== undefined) {
      features.push({ text: "Instagram Direct", included: plan.useInstagram });
    }
    if (plan.useCampaigns !== undefined) {
      features.push({ text: "Campanhas de Marketing", included: plan.useCampaigns });
    }

    // Always included features
    features.push(
      { text: "Agendamento de Mensagens", included: true },
      { text: "Suporte técnico", included: true },
      { text: "Atualizações automáticas", included: true }
    );

    return features;
  }, []);

  const handleOpenContactModal = useCallback((invoice) => {
    // Se a fatura tem invoiceUrl, redireciona diretamente para o Asaas
    if (invoice.invoiceUrl) {
      window.open(invoice.invoiceUrl, '_blank');
      return;
    }
    
    // Fallback para o modal antigo se não tiver invoiceUrl
    setStoragePlans(invoice);
    setSelectedContactId(null);
    setContactModalOpen(true);
  }, []);

  const handleViewInvoice = useCallback((invoice) => {
    // Abrir fatura paga para visualização
    if (invoice.invoiceUrl) {
      window.open(invoice.invoiceUrl, '_blank');
    }
  }, []);

  const handleCloseContactModal = useCallback(() => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  }, []);

  const isTrialExpired = useCallback(() => {
    return companyStatus.isExpired && !companyStatus.isInTrial;
  }, [companyStatus.isExpired, companyStatus.isInTrial]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchInvoices = async () => {
        try {
          const { data } = await api.get("/invoices/all", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_INVOICES", payload: data });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchInvoices();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  // Mostrar toast de trial expirado apenas uma vez (não para usuários "user")
  const profile = user?.profile;
  const companyId = user?.companyId;

  useEffect(() => {
    // Só executar se o usuário estiver carregado
    if (!profile) return;
    
    if (profile !== 'user' && isTrialExpired()) {
      showUniqueWarning(
        'Seu período de teste expirou! Para continuar utilizando o sistema, regularize o pagamento.',
        { autoClose: 8000 }
      );
    }
  }, [companyStatus.isExpired, companyStatus.isInTrial, profile, isTrialExpired]);

  // Socket.IO listener para atualizações de pagamento em tempo real
  useEffect(() => {
    if (companyId && profile) {
      const socket = socketConnection({ companyId });

      // Listener para pagamento confirmado
      socket.on(`company-${companyId}-invoice-paid`, (data) => {
        if (data.action === "payment_confirmed") {
          // Atualizar a fatura na lista
          dispatch({
            type: "UPDATE_USERS", // Reutilizando o reducer existente
            payload: { 
              id: data.invoice.id, 
              status: data.invoice.status,
              paymentDate: data.invoice.paymentDate,
              paymentMethod: data.invoice.paymentMethod
            }
          });

          // Não mostrar toast aqui pois já é mostrado no useCompanyStatus
        }
      });

      // Listener para mudanças de status da empresa
      socket.on(`company-${companyId}-status-updated`, (data) => {
        if (data.action === "company_reactivated") {
          // Não mostrar toast aqui pois já é mostrado no useAuth
          
          // Recarregar a página após 2 segundos para aplicar as mudanças
          setTimeout(() => {
            window.location.reload();
          }, 4000);
        } else if (data.action === "company_blocked") {
          // Não mostrar toast aqui pois já é mostrado no useAuth
          
          // Recarregar a página para mostrar o status atualizado
          setTimeout(() => {
            window.location.reload();
          }, 4000);
        }
      });

      // Listener para atualizações de status (vencimento, etc.)
      socket.on(`company-${companyId}-invoice-updated`, (data) => {
        if (data.action === "payment_overdue") {
          // Atualizar a fatura na lista
          dispatch({
            type: "UPDATE_USERS",
            payload: { 
              id: data.invoice.id, 
              status: data.invoice.status
            }
          });

          // Mostrar notificação de vencimento (não para usuários "user")
          if (profile !== 'user') {
            showUniqueWarning(`Fatura #${data.invoice.id} está vencida.`);
          }
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [companyId, profile, dispatch]);

  const getStatusInfo = useCallback((record) => {
    const status = record.status;
    
    // Se a fatura já foi paga
    if (status === "paid" || status === "CONFIRMED" || status === "RECEIVED" || status === "RECEIVED_IN_CASH") {
      return { text: "Pago", type: "paid" };
    }
    
    // Calcular diferença de dias usando moment
    if (moment(record.dueDate).isValid()) {
      const now = moment();
      const dueDate = moment(record.dueDate);
      const diff = dueDate.diff(now, "days");
      
      // Verificar se está vencido pelo status do Asaas ou pela data
      if (status === "OVERDUE" || diff < 0) {
        return { text: "Vencido", type: "overdue" };
      }
      
      // Faltam menos de 3 dias para vencer
      if (diff >= 0 && diff < 3) {
        return { text: "Em Aberto", type: "nearDue" };
      }
    }
    
    return { text: "Em Aberto", type: "open" };
  }, []);

  const renderStatus = useCallback((record) => {
    const statusInfo = getStatusInfo(record);
    
    switch (statusInfo.type) {
      case "paid":
        return (
          <div className={classes.paidStatusBadge}>
            <CheckIcon className={classes.paidStatusIcon} />
            PAGO
          </div>
        );
      case "overdue":
        return (
          <div className={classes.overdueStatusBadge}>
            VENCIDO
          </div>
        );
      case "nearDue":
        return (
          <div className={classes.nearDueStatusBadge}>
            EM ABERTO
          </div>
        );
      case "open":
      default:
        return (
          <div className={classes.openStatusBadge}>
            EM ABERTO
          </div>
        );
    }
  }, [classes, getStatusInfo]);

  const isPaid = useCallback((record) => {
    const status = record.status;
    return status === "paid" || status === "CONFIRMED" || status === "RECEIVED" || status === "RECEIVED_IN_CASH";
  }, []);

  return (
    <MainContainer>
      {/* Prompt de Upgrade para usuários em período de teste e não para usuários "user" */}
      {companyStatus.isInTrial && user?.profile !== 'user' && (
        <TrialUpgradePrompt />
      )}
      <SubscriptionModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        Invoice={storagePlans}
        contactId={selectedContactId}
      />
      
      <MainHeader>
        <Title>Financeiro</Title>
      </MainHeader>

      {/* Two Column Layout */}
      <div className={classes.mainContainer}>
        {/* Left Column - Plan Information */}
        <div className={classes.leftColumn}>
          {/* Active Plan Badge */}
          <div className={classes.activeBadge}>
            Plano Ativo
          </div>
          
          <Paper className={classes.planCard} elevation={0}>
            <div className={classes.planHeader}>
              <Typography className={classes.planTitle}>
                {user?.company?.plan?.name || "Plano Não Identificado"}
              </Typography>

              <Box>
                <Typography className={classes.planPrice}>
                  {user?.company?.plan?.totalValue ? 
                    formatCurrency(user.company.plan.totalValue) :
                    (user?.company?.plan?.value && user?.company?.plan?.users ?
                      formatCurrency(user.company.plan.value * user.company.plan.users) :
                      formatCurrency(user.company.plan?.value || 0)
                    )
                  }
                </Typography>
              </Box>
            </div>

            <div className={classes.featuresList}>
              {getPlanFeatures(user?.company?.plan).map((feature, index) => (
                <div key={index} className={classes.featureItem}>
                  {feature.included ? (
                    <CheckIcon className={classes.featureIcon} />
                  ) : (
                    <CloseIcon className={classes.featureIconMissing} />
                  )}
                  <span 
                    style={{ 
                      fontFamily: "'Inter', 'Roboto', sans-serif",
                      fontWeight: "500",
                      opacity: feature.included ? 1 : 0.6,
                      textDecoration: feature.included ? 'none' : 'line-through'
                    }}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

          </Paper>
        </div>

        {/* Right Column - Invoices */}
        <div className={classes.rightColumn}>
          <Paper className={classes.invoicesPaper} variant="outlined">
            <Typography variant="h6" className={classes.invoicesTitle} style={{ fontWeight: 'bold' }}>
              Faturas
            </Typography>
            
            <div style={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Id</TableCell>
                    <TableCell align="center">Detalhes</TableCell>
                    <TableCell align="center">Valor</TableCell>
                    <TableCell align="center">Data Venc.</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Ação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" style={{ padding: '40px', color: '#666' }}>
                        <Typography variant="body1">
                          Nenhuma fatura encontrada
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell align="center">{invoice.id}</TableCell>
                        <TableCell align="center">{invoice.detail}</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }} align="center">
                          {invoice.value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell align="center">{moment(invoice.dueDate).format("DD/MM/YYYY")}</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }} align="center">{renderStatus(invoice)}</TableCell>
                        <TableCell align="center">
                          {!isPaid(invoice) ? (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenContactModal(invoice)}
                              startIcon={invoice.invoiceUrl ? <OpenInNewIcon /> : null}
                              title={invoice.invoiceUrl ? "Abrir página de pagamento do Asaas" : "Processar pagamento"}
                            >
                              PAGAR
                            </Button>
                          ) : (
                            invoice.invoiceUrl && (
                              <Tooltip title="Ver fatura" arrow>
                                <IconButton
                                  className={classes.viewInvoiceButton}
                                  onClick={() => handleViewInvoice(invoice)}
                                  size="small"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {loading && <TableRowSkeleton columns={6} />}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </div>
      </div>
    </MainContainer>
  );
};

export default Invoices;