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
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Chip from "@material-ui/core/Chip";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import VisibilityIcon from "@material-ui/icons/Visibility";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
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
    marginTop: theme.spacing(1),
    padding: theme.spacing(3),
    paddingTop: theme.spacing(2),
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
    marginBottom: theme.spacing(3),
    maxWidth: "600px",
    margin: "0",
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
  },
  planPrice: {
    fontSize: "2.5rem",
    fontWeight: "800",
    marginBottom: theme.spacing(0.5),
    color: "#44b774",
    lineHeight: 1,
  },
  planPriceUnit: {
    fontSize: "0.9rem",
    opacity: 0.7,
    color: theme.palette.text.secondary,
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
  tabsPaper: {
    padding: theme.spacing(2),
    height: "fit-content",
    minHeight: "500px",
    borderRadius: "16px",
  },
  tabsTitle: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.type === 'dark' ? '#424242' : '#f5f5f5',
    margin: `-${theme.spacing(2)}px -${theme.spacing(2)}px ${theme.spacing(2)}px -${theme.spacing(2)}px`,
    borderRadius: "16px 16px 0 0",
    color: theme.palette.text.primary,
  },
  tabContent: {
    marginTop: theme.spacing(2),
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
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
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
    id: `financial-tab-${index}`,
    'aria-controls': `financial-tabpanel-${index}`,
  };
}

const Financial = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { companyStatus } = useCompanyStatus();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [, setHasMore] = useState(false);
  const [searchParam,] = useState("");
  const [invoices, dispatch] = useReducer(reducer, []);
  const [storagePlans, setStoragePlans] = React.useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const renderInvoicesTab = () => (
    <div style={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">Plano</TableCell>
            <TableCell align="center">Valor</TableCell>
            <TableCell align="left">Mês Base</TableCell>
            <TableCell align="center">Vencimento</TableCell>
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
                <TableCell align="center">{invoice.detail}</TableCell>
                <TableCell style={{ fontWeight: 'bold' }} align="center">
                  {invoice.value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell align="left">{moment(invoice.createdAt).format("MM/YYYY")}</TableCell>
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
  );

  const renderPlansTab = () => (
    <Box p={2} display="flex" justifyContent="flex-start">
      <Card
        elevation={2}
        style={{
          borderRadius: 15,
          width: 300,
          textAlign: 'center',
          padding: 30,
          backgroundColor: '#fff',
          color: '#333',
          position: 'relative'
        }}
      >
        {/* Badge pequeno no canto superior direito */}
        <Box
          position="absolute"
          top={15}
          right={15}
        >
         <Typography
  variant="body2"
  style={{
    fontSize: '0.85em',
    backgroundColor: companyStatus.isInTrial ? '#ff9800' : '#4caf50',
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.5px',
    padding: '2px 8px',
    borderRadius: 12,
    display: 'inline-block'
  }}
>
  {companyStatus.isInTrial 
    ? 'Trial' 
    : 'Ativo'}
</Typography>

        </Box>

        {/* Header com título */}
        <Box mb={1}>
          <Typography
            variant="h5"
            component="h1"
            style={{
              fontSize:"2em",
              textAlign: 'left',
              fontWeight: 600,
              color: '#333',
              marginTop:-15,
              marginBottom: 10
            }}
          >
            {user?.company?.plan?.name || "Plano Padrão"}
          </Typography>

                 {/* Preço */}
        <Box mb={3} display="flex" justifyContent="left">
          <Box display="flex" alignItems="flex-end">
            <Typography
              variant="h3"
              style={{
                fontSize: '1.4em',
                fontWeight: 300,
                color: 'gray',
                marginBottom: 0,
                borderRadius:"100px",
              }}
            >
              {user?.company?.plan?.totalValue ?
                formatCurrency(user.company.plan.totalValue) :
                (user?.company?.plan?.value && user?.company?.plan?.users ?
                  formatCurrency(user.company.plan.value * user.company.plan.users) :
                  formatCurrency(user.company.plan?.value || 0)
                )
              }
            </Typography>

            <Typography
              variant="body2"
              style={{
                fontSize: '0.9em',
                color: '#666',
                fontWeight: 400,
                marginLeft: 4
              }}
            >
              /mês
            </Typography>
          </Box>
        </Box>
        </Box>

        {/* Descrição */}
        <Typography
          variant="body2"
          style={{
            color: '#666',
            fontSize: '0.9em',
            lineHeight: 1.6,
            marginBottom: 20
          }}
        >
        </Typography>

        {/* Lista de recursos */}
        <List
          dense
          style={{
            textAlign: 'right',
            marginBottom: 25,
            padding: 0
          }}
        >
          {getPlanFeatures(user?.company?.plan).map((feature, index) => (
            <ListItem
              key={index}
              style={{
                padding: '1px 0',
                fontSize: '1.2em'
              }}
            >
              <ListItemIcon style={{ minWidth: 25 }}>
                <Typography
                  style={{
                    backgroundColor: "#3c741eff",
                    padding: "0 5px",
                    borderRadius: "20px",
                    color: '#bfffc1ff',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}
                >
                  ✓
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    style={{
                      color: feature.included ? '#333' : '#999',
                      fontSize: '0.9em',
                      opacity: feature.included ? 1 : 0.6,
                      textDecoration: feature.included ? 'none' : 'line-through'
                    }}
                  >
                    {feature.text}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

 
      </Card>
      
    </Box>
  );

  return (
    <MainContainer>
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

      {/* Main Content */}
      <div className={classes.mainContainer}>
        <Paper className={classes.tabsPaper} variant="outlined">

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="financial tabs"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Faturas" {...a11yProps(0)} />
            <Tab label="Planos" {...a11yProps(1)} />
          </Tabs>

          <div className={classes.tabContent}>
            <TabPanel value={tabValue} index={0}>
              {renderInvoicesTab()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderPlansTab()}
            </TabPanel>
          </div>
        </Paper>
      </div>
    </MainContainer>
  );
};

export default Financial;