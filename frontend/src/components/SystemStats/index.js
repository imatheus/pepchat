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
  Divider,
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
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import systemStatsService from "../../services/systemStats";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Bar // Adicionado para barras
} from "recharts";

const useStyles = makeStyles((theme) => ({
  root: {
    ...theme.scrollbarStyles,
    width: "100%",
    maxHeight: "100%",
    fontFamily: "'Lato', Arial, sans-serif", // Aplica Lato em todo o dash
  },
  card: {
    borderRadius: 15, // Arredondamento de 15px
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 8px 0 rgba(44,62,80,0.07)", // Shadow curto e leve
    border: "1px solid #eee",
  },
  cardContent: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    padding: theme.spacing(2),
    position: "relative",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: theme.spacing(0.5),
    borderBottom: "1px solid #eee", // Linha cinza claro
    paddingBottom: theme.spacing(1),
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: "bold",
    color: "#666",
    fontFamily: "'Lato', Arial, sans-serif", // Garante Lato no título
  },
  cardIcon: {
    fontSize: 40,
    marginLeft: theme.spacing(1),
    color: "#4caf50", // Ícone verde
  },
  cardValue: {
    color: '#4caf50',
    fontWeight: 600,
    fontSize: '1.7rem',
    marginTop: 4,
    marginBottom: 0,
    fontFamily: "'Lato', Arial, sans-serif", // Garante Lato no valor
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
  const [lastUpdate, setLastUpdate] = useState(null);

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
      setLastUpdate(new Date());
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
          icon={<ScheduleIcon style={{ color: '#4caf50' }} />} // Ícone verde
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

  const formatDaysRemaining = (date) => {
    if (!date) return "-";
    try {
      const daysRemaining = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) return "Expirado";
      if (daysRemaining === 0) return "Expira hoje";
      return `${daysRemaining} dias`;
    } catch (error) {
      console.error("Erro ao calcular dias restantes:", error);
      return "-";
    }
  };

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
              <div className={classes.cardTitleRow}>
                <Typography className={classes.cardTitle}>
                  Usuários Online
                </Typography>
                <PeopleIcon className={classes.cardIcon} />
              </div>
              <Typography className={classes.cardValue}>
                {stats?.users?.online || 0}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                {/* Espaço reservado para subtítulo se necessário */}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <div className={classes.cardTitleRow}>
                <Typography className={classes.cardTitle}>
                  Empresas
                </Typography>
                <BusinessIcon className={classes.cardIcon} />
              </div>
              <Typography className={classes.cardValue}>
                {stats?.companies?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <div className={classes.cardTitleRow}>
                <Typography className={classes.cardTitle}>
                  Empresas em Trial
                </Typography>
                <BusinessIcon className={classes.cardIcon} style={{ color: "#ff9800" }} />
              </div>
              <Typography className={classes.cardValue}>
                {stats?.companies?.inTrial || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <div className={classes.cardTitleRow}>
                <Typography className={classes.cardTitle}>
                  WhatsApp Conectados
                </Typography>
                <WhatsAppIcon className={classes.cardIcon} style={{ color: "#25D366" }} />
              </div>
              <Typography className={classes.cardValue}>
                {stats?.whatsapp?.connected || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <div className={classes.cardTitleRow}>
                <Typography className={classes.cardTitle}>
                  Tickets Hoje
                </Typography>
                <TicketIcon className={classes.cardIcon} />
              </div>
              <Typography className={classes.cardValue}>
                {stats?.tickets?.today || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Evolução de Usuários */}
      <Paper className={classes.chartContainer} elevation={0} style={{ boxShadow: 'none', border: '1px solid #eee' }}>
        <Typography variant="h6" className={classes.chartTitle}>
        </Typography>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
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
              allowDecimals={false}
              domain={[0, dataMax => Math.max(dataMax * 1.1, 10)]}
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
                  return [`${value} acumulado`, 'Total acumulado'];
                }
                if (name === 'novosUsuarios') {
                  return [`${value} novos`, 'Novos no mês'];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="novosUsuarios" fill="#90caf9" barSize={32} radius={[8, 8, 0, 0]} name="Novos no mês" />
            <Line 
              type="monotone" 
              dataKey="usuarios" 
              stroke="#4caf50" 
              strokeWidth={3}
              dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4caf50', strokeWidth: 2, fill: '#fff' }}
              name="Total acumulado"
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