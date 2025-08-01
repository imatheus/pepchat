import React, { useState, useEffect, useContext } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import FormHelperText from "@material-ui/core/FormHelperText";

import SpeedIcon from "@material-ui/icons/Speed";
import GroupIcon from "@material-ui/icons/Group";
import AssignmentIcon from "@material-ui/icons/Assignment";
import PersonIcon from "@material-ui/icons/Person";

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import Chart from "./Chart";
import ButtonWithSpinner from "../../components/ButtonWithSpinner";

import CardCounter from "../../components/Dashboard/CardCounter";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import TrialStatusCard from "../../components/TrialStatusCard";
import { isArray } from "lodash";

import useDashboard from "../../hooks/useDashboard";
import useCompanyStatus from "../../hooks/useCompanyStatus";
import { AuthContext } from "../../context/Auth/AuthContext";

import { isEmpty } from "lodash";
import moment from "moment";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    borderRadius: "12px",
    ...theme.scrollbarStyles,
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
    filterField: {
    "& .MuiOutlinedInput-root": {
      backgroundColor: theme.palette.background.paper,
      borderRadius: "8px",
      color: theme.palette.text.primary,
      "&:hover": {
        backgroundColor: theme.palette.background.paper,
      },
      "&.Mui-focused": {
        backgroundColor: theme.palette.background.paper,
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.divider,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
    "& .MuiSelect-root": {
      backgroundColor: theme.palette.background.paper,
      borderRadius: "8px",
      color: theme.palette.text.primary,
    },
    "& .MuiInputLabel-root": {
      color: theme.palette.text.secondary,
      "&.Mui-focused": {
        color: theme.palette.primary.main,
      },
    },
    "& .MuiFormHelperText-root": {
      color: theme.palette.text.secondary,
    },
    "& .MuiSvgIcon-root": {
      color: theme.palette.text.secondary,
    },
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const [counters, setCounters] = useState({
    supportPending: 0,
    supportHappening: 0,
    supportFinished: 0,
    leads: 0,
    avgSupportTime: 0,
    avgWaitTime: 0
  });
  const [attendants, setAttendants] = useState([]);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DD")
  );
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const { find } = useDashboard();
  const { companyStatus } = useCompanyStatus();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    async function firstLoad() {
      try {
        // Set default parameters for initial load
        const defaultParams = {
          days: 7 // Default to last 7 days
        };
        
        setLoading(true);
        const data = await find(defaultParams);
        
        if (data && data.counters) {
          setCounters(data.counters);
        } else {
          setCounters({
            supportPending: 0,
            supportHappening: 0,
            supportFinished: 0,
            leads: 0,
            avgSupportTime: 0,
            avgWaitTime: 0
          });
        }
        
        if (isArray(data.attendants)) {
          setAttendants(data.attendants);
        } else {
          setAttendants([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error("Erro ao carregar dashboard");
        
        // Set default values in case of error
        setCounters({
          supportPending: 0,
          supportHappening: 0,
          supportFinished: 0,
          leads: 0,
          avgSupportTime: 0,
          avgWaitTime: 0
        });
        setAttendants([]);
        setLoading(false);
      }
    }
    
    // Timeout to allow system to load properly
    setTimeout(() => {
      firstLoad();
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function handleChangeFilterType(value) {
    setFilterType(value);
    if (value === 1) {
      setPeriod(0);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  }

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (period > 0) {
      params = {
        days: period,
      };
    }

    if (!isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error("Parametrize o filtro");
      setLoading(false);
      return;
    }

    try {
      const data = await find(params);

      setCounters(data.counters || {
        supportPending: 0,
        supportHappening: 0,
        supportFinished: 0,
        leads: 0,
        avgSupportTime: 0,
        avgWaitTime: 0
      });
      
      if (isArray(data.attendants)) {
        setAttendants(data.attendants);
      } else {
        setAttendants([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Erro ao carregar dados do dashboard");
      
      // Set default values in case of error
      setCounters({
        supportPending: 0,
        supportHappening: 0,
        supportFinished: 0,
        leads: 0,
        avgSupportTime: 0,
        avgWaitTime: 0
      });
      setAttendants([]);
    }

    setLoading(false);
  }

  
  function formatTime(minutes) {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  }

  function renderFilters() {
    if (filterType === 1) {
      return (
        <>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Data Inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${classes.fullWidth} ${classes.filterField}`}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Data Final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${classes.fullWidth} ${classes.filterField}`}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </>
      );
    } else {
      return (
        <Grid item xs={12} sm={6} md={4}>
          <FormControl className={`${classes.selectContainer} ${classes.filterField}`} variant="outlined">
            <InputLabel id="period-selector-label">Período</InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={(e) => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>Nenhum selecionado</MenuItem>
              <MenuItem value={3}>Últimos 3 dias</MenuItem>
              <MenuItem value={7}>Últimos 7 dias</MenuItem>
              <MenuItem value={15}>Últimos 15 dias</MenuItem>
              <MenuItem value={30}>Últimos 30 dias</MenuItem>
              <MenuItem value={60}>Últimos 60 dias</MenuItem>
              <MenuItem value={90}>Últimos 90 dias</MenuItem>
            </Select>
            <FormHelperText>Selecione o período desejado</FormHelperText>
          </FormControl>
        </Grid>
      );
    }
  }

  return (
    <div>
      <Container maxWidth="lg" className={classes.container}>
        {/* Card de Status do Trial - aparece apenas durante período de teste e não para usuários "user" */}
        {companyStatus.isInTrial && user?.profile !== 'user' && (
          <TrialStatusCard />
        )}
        
        <Grid container spacing={3} justifyContent="flex-end">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl className={`${classes.selectContainer} ${classes.filterField}`} variant="outlined">
              <InputLabel id="period-selector-label">Tipo de Filtro</InputLabel>
              <Select
                labelId="period-selector-label"
                value={filterType}
                onChange={(e) => handleChangeFilterType(e.target.value)}
              >
                <MenuItem value={1}>Filtro por Data</MenuItem>
                <MenuItem value={2}>Filtro por Período</MenuItem>
              </Select>
              <FormHelperText>Selecione o período desejado</FormHelperText>
            </FormControl>
          </Grid>

          {renderFilters()}

          <Grid item xs={12} className={classes.alignRight}>
            <ButtonWithSpinner
              loading={loading}
              onClick={() => fetchData()}
              variant="contained"
              color="primary"
            >
              Filtrar
            </ButtonWithSpinner>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <CardCounter
              icon={<GroupIcon fontSize="inherit" />}
              title="Atd. Pendentes"
              value={counters.supportPending}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <CardCounter
              icon={<GroupIcon fontSize="inherit" />}
              title="Atd. Acontecendo"
              value={counters.supportHappening}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <CardCounter
              icon={<AssignmentIcon fontSize="inherit" />}
              title="Atd. Realizados"
              value={counters.supportFinished}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <CardCounter
              icon={<PersonIcon fontSize="inherit" />}
              title="Leads"
              value={counters.leads}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <CardCounter
              icon={<SpeedIcon fontSize="inherit" />}
              title="T.M. de Atendimento"
              value={formatTime(counters.avgSupportTime)}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <CardCounter
              icon={<SpeedIcon fontSize="inherit" />}
              title="T.M. de Espera"
              value={formatTime(counters.avgWaitTime)}
              loading={loading}
            />
          </Grid>
          
          {/* Gráfico de Atendimentos de Hoje - movido para cima da tabela de avaliações */}
          <Grid item xs={12}>
            <Paper className={classes.fixedHeightPaper}>
              <Chart />
            </Paper>
          </Grid>
          
          {/* Tabela de Avaliações */}
          <Grid item xs={12}>
            {attendants.length ? (
              <TableAttendantsStatus
                attendants={attendants}
                loading={loading}
              />
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;