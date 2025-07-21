import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip
} from "@material-ui/core";
// import { Alert } from "@material-ui/lab";
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  WhatsApp as WhatsAppIcon,
  Assignment as TicketIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import systemStatsService from "../../services/systemStats";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";

const useStyles = makeStyles((theme) => ({
  root: {
    ...theme.scrollbarStyles,
    width: "100%",
    maxHeight: "100%",
  },
  card: {
    borderRadius: 12,
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  cardContent: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: theme.spacing(2),
  },
  cardAvatar: {
    fontSize: 48,
    color: theme.palette.grey[500],
    backgroundColor: theme.palette.background.paper,
    width: theme.spacing(7),
    height: theme.spacing(7),
    marginBottom: theme.spacing(1),
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#4caf50", // Verde
    marginBottom: theme.spacing(0.5),
  },
  cardSubtitle: {
    color: theme.palette.grey[600],
    fontSize: "0.875rem",
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    maxHeight: 400,
    borderRadius: 12,
  },
  statusChip: {
    minWidth: 80,
  },
  trialChip: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  expiredChip: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  activeChip: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  alertError: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
    padding: theme.spacing(2),
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  alertSuccess: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
    padding: theme.spacing(2),
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  chartContainer: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: 12,
    ...theme.scrollbarStyles,
  },
  chartTitle: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  refreshButtonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: theme.spacing(1),
  },
}));

// Componente Alert personalizado
const CustomAlert = ({ severity, children, action }) => {
  const classes = useStyles();
  const alertClass = severity === "error" ? classes.alertError : classes.alertSuccess;
  
  return (
    <Paper className={alertClass} elevation={1}>
      <Box display="flex" alignItems="center" width="100%">
        <Box flexGrow={1}>
          {children}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
    </Paper>
  );
};

const SystemStats = () => {
  const classes = useStyles();
  const [stats, setStats] = useState(null);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar estatísticas gerais e dados de crescimento em paralelo
      const [statsData, growthData] = await Promise.all([
        systemStatsService.getSystemStats(),
        systemStatsService.getUserGrowthStats()
      ]);
      
      setStats(statsData);
      
      // Processar dados de crescimento para o gráfico
      const processedGrowthData = growthData.userGrowth.map(item => ({
        month: item.month,
        usuarios: parseInt(item.cumulative_users) || 0,
        fullDate: item.full_date,
        novosUsuarios: parseInt(item.new_users) || 0
      }));
      
      setUserGrowthData(processedGrowthData);
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      if (err.response?.status === 403) {
        setError("Acesso negado. Apenas super usuários podem acessar estas informações.");
      } else {
        setError("Erro ao carregar estatísticas do sistema");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusChip = (status, trialExpiration, dueDate) => {
    if (trialExpiration && new Date(trialExpiration) > new Date()) {
      return (
        <Chip
          label="Trial"
          size="small"
          className={`${classes.statusChip} ${classes.trialChip}`}
          icon={<ScheduleIcon />}
        />
      );
    }
    
    if (status === false || (dueDate && new Date(dueDate) < new Date())) {
      return (
        <Chip
          label="Expirada"
          size="small"
          className={`${classes.statusChip} ${classes.expiredChip}`}
          icon={<WarningIcon />}
        />
      );
    }
    
    return (
      <Chip
        label="Ativa"
        size="small"
        className={`${classes.statusChip} ${classes.activeChip}`}
        icon={<CheckCircleIcon />}
      />
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return new Date(date).toLocaleString('pt-BR');
    }
  };

  // formatDaysRemaining removido - não utilizado

  if (loading && !stats) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <CustomAlert severity="error" action={
        <IconButton color="inherit" size="small" onClick={fetchStats}>
          <RefreshIcon />
        </IconButton>
      }>
        {error}
      </CustomAlert>
    );
  }

  return (
    <div className={classes.root}>
      <Box className={classes.refreshButtonContainer}>
        <Tooltip title="Atualizar">
          <IconButton 
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cards de Estatísticas Gerais */}
      <Grid container spacing={3} style={{ marginBottom: 16 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <PeopleIcon className={classes.cardAvatar} />
              <Typography className={classes.cardTitle}>
                {stats?.users?.online || 0}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                Usuários Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <BusinessIcon className={classes.cardAvatar} />
              <Typography className={classes.cardTitle}>
                {stats?.companies?.total || 0}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                Total de Empresas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <BusinessIcon className={classes.cardAvatar} style={{ color: "#ff9800" }} />
              <Typography className={classes.cardTitle}>
                {stats?.companies?.inTrial || 0}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                Empresas em Trial
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <WhatsAppIcon className={classes.cardAvatar} style={{ color: "#25D366" }} />
              <Typography className={classes.cardTitle}>
                {stats?.whatsapp?.connected || 0}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                WhatsApp Conectados
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <TicketIcon className={classes.cardAvatar} />
              <Typography className={classes.cardTitle}>
                {stats?.tickets?.today || 0}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                Tickets Hoje
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Evolução de Usuários */}
      <Paper className={classes.chartContainer} elevation={2}>
        <Typography variant="h6" className={classes.chartTitle}>
          Usuários Cadastrados
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '12px'
              }}
              labelStyle={{
                color: '#333',
                fontWeight: 'bold'
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = userGrowthData.find(item => item.month === label);
                  return data ? data.fullDate : label;
                }
                return label;
              }}
              formatter={(value, name, props) => {
                if (name === 'usuarios') {
                  const novosUsuarios = props.payload?.novosUsuarios || 0;
                  return [
                    `${value} usuários total`,
                    novosUsuarios > 0 ? `(+${novosUsuarios} novos)` : '(nenhum novo)'
                  ];
                }
                return [value, name];
              }}
            />
            <Line 
              type="monotone" 
              dataKey="usuarios" 
              stroke="#4caf50" 
              strokeWidth={3}
              dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4caf50', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Tabela de Empresas Expiradas */}
      {stats?.companies?.expiredList?.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Empresas Expiradas
          </Typography>
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data de Expiração</TableCell>
                  <TableCell>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.companies.expiredList.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {company.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(company.status, company.trialExpiration, company.dueDate)}
                    </TableCell>
                    <TableCell>
                      {formatDate(company.trialExpiration || company.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.trialExpiration ? "Trial" : "Pagamento"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Mensagem quando não há empresas em trial ou expiradas */}
      {(!stats?.companies?.trialList?.length && !stats?.companies?.expiredList?.length) && (
        <CustomAlert severity="success">
          Nenhuma empresa em trial ou expirada no momento.
        </CustomAlert>
      )}
    </div>
  );
};

export default SystemStats;