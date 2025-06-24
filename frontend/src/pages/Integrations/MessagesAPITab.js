import React, { useState } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import { 
  Button, 
  CircularProgress, 
  Grid, 
  TextField, 
  Typography, 
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment
} from "@material-ui/core";
import { 
  Send as SendIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  FileCopy as FileCopyIcon,
  FiberManualRecord as DotIcon
} from "@material-ui/icons";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    fontFamily: theme.typography.fontFamily,
  },
  compactCard: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
  },
  endpointBox: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  methodChip: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
    fontSize: '0.75rem',
    fontFamily: theme.typography.fontFamily,
  },
  submitButton: {
    borderRadius: theme.spacing(1),
    textTransform: 'none',
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: theme.typography.fontFamily,
    '&:hover': {
      backgroundColor: theme.palette.primary.light + '10',
    },
  },
  statusDot: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
  statusBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontFamily: theme.typography.fontFamily,
  },
  infoText: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    fontFamily: theme.typography.fontFamily,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    fontSize: '1.1rem',
    fontFamily: theme.typography.fontFamily,
  },
  formContainer: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.spacing(1),
  },
}));

const MessagesAPITab = () => {
  const classes = useStyles();
  const [formMessageTextData] = useState({ token: '', number: '', body: '' });
  const [formMessageMediaData] = useState({ token: '', number: '', medias: '' });
  const [file, setFile] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');

  const getEndpoint = () => {
    return process.env.REACT_APP_BACKEND_URL + '/api/messages/send';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const handleSendTextMessage = async (values) => {
    const { number, body } = values;
    const data = { number, body };
    const options = {
      method: 'POST',
      url: `${process.env.REACT_APP_BACKEND_URL}/api/messages/send`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${values.token}`
      },
      data
    };
    
    try {
      await axios.request(options);
      toast.success('Mensagem enviada com sucesso!');
    } catch (error) {
      toastError(error);
    }
  };

  const handleSendMediaMessage = async (values) => { 
    try {
      const firstFile = file[0];
      const data = new FormData();
      data.append('number', values.number);
      data.append('body', firstFile.name);
      data.append('medias', firstFile);
      
      const options = {
        method: 'POST',
        url: `${process.env.REACT_APP_BACKEND_URL}/api/messages/send`,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${values.token}`
        },
        data
      };
      
      await axios.request(options);
      toast.success('Mensagem enviada com sucesso!');
    } catch (err) {
      toastError(err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files);
    setSelectedFileName(e.target.files[0]?.name || '');
  };

  return (
    <div className={classes.root}>
      {/* Informações Básicas */}
      <Card className={classes.compactCard}>
        <CardContent>
          <Typography variant="h6" className={classes.sectionTitle}>
            Configuração da API
          </Typography>
          <Typography variant="body2" className={classes.infoText}>
            Copie o token na seção "Conexões" antes de usar a API.
          </Typography>
          <Typography variant="body2" className={classes.infoText}>
            <Box component="span" fontWeight="bold">Formato do número:</Box> 5511999999999 (código país + DDD + número)
          </Typography>
        </CardContent>
      </Card>

      {/* Endpoint */}
      <Card className={classes.compactCard}>
        <CardContent>
          <Typography variant="h6" className={classes.sectionTitle}>
            Endpoint
          </Typography>
          <Box className={classes.endpointBox}>
            <Box display="flex" alignItems="center">
              <Chip label="POST" className={classes.methodChip} size="small" />
              <Typography variant="body2" style={{ fontFamily: 'monospace' }}>
                {getEndpoint()}
              </Typography>
            </Box>
            <Tooltip title="Copiar endpoint">
              <IconButton size="small" onClick={() => copyToClipboard(getEndpoint())}>
                <FileCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Teste de Mensagem de Texto */}
      <Card className={classes.compactCard}>
        <CardContent>
          <Typography variant="h6" className={classes.sectionTitle}>
            Enviar Mensagem de Texto
          </Typography>
          <Paper className={classes.formContainer}>
            <Formik
              initialValues={formMessageTextData}
              enableReinitialize={true}
              onSubmit={(values, actions) => {
                setTimeout(async () => {
                  await handleSendTextMessage(values);
                  actions.setSubmitting(false);
                  actions.resetForm();
                }, 400);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        label="Token"
                        name="token"
                        variant="outlined"
                        fullWidth
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CodeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        label="Número"
                        name="number"
                        variant="outlined"
                        fullWidth
                        required
                        size="small"
                        placeholder="5511999999999"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        label="Mensagem"
                        name="body"
                        variant="outlined"
                        fullWidth
                        required
                        size="small"
                        placeholder="Sua mensagem..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.submitButton}
                        startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
                        disabled={isSubmitting}
                        fullWidth
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Paper>
        </CardContent>
      </Card>

      {/* Teste de Mensagem de Mídia */}
      <Card className={classes.compactCard}>
        <CardContent>
          <Typography variant="h6" className={classes.sectionTitle}>
            Enviar Mensagem de Mídia
          </Typography>
          <Paper className={classes.formContainer}>
            <Formik
              initialValues={formMessageMediaData}
              enableReinitialize={true}
              onSubmit={(values, actions) => {
                setTimeout(async () => {
                  await handleSendMediaMessage(values);
                  actions.setSubmitting(false);
                  actions.resetForm();
                  setSelectedFileName('');
                  document.getElementById('medias').value = null;
                }, 400);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        label="Token"
                        name="token"
                        variant="outlined"
                        fullWidth
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CodeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        label="Número"
                        name="number"
                        variant="outlined"
                        fullWidth
                        required
                        size="small"
                        placeholder="5511999999999"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <input
                        type="file"
                        name="medias"
                        id="medias"
                        className={classes.fileInput}
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      />
                      <label htmlFor="medias" className={classes.fileInputLabel}>
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <ImageIcon color="primary" style={{ marginRight: 8 }} />
                          <Typography variant="body2" color="primary">
                            {selectedFileName || 'Selecionar arquivo'}
                          </Typography>
                        </Box>
                      </label>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.submitButton}
                        startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
                        disabled={isSubmitting || !selectedFileName}
                        fullWidth
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar Mídia'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Paper>
        </CardContent>
      </Card>

      {/* Status Codes */}
      <Card className={classes.compactCard}>
        <CardContent>
          <Typography variant="h6" className={classes.sectionTitle}>
            Códigos de Resposta
          </Typography>
          <Box className={classes.statusBox}>
            <Box display="flex" alignItems="center">
              <DotIcon className={classes.statusDot} style={{ color: '#4caf50' }} />
              <Typography variant="body2">
                <Box component="span" fontWeight="bold">200</Box> - Sucesso
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <DotIcon className={classes.statusDot} style={{ color: '#f44336' }} />
              <Typography variant="body2">
                <Box component="span" fontWeight="bold">400</Box> - Dados inválidos
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <DotIcon className={classes.statusDot} style={{ color: '#ff9800' }} />
              <Typography variant="body2">
                <Box component="span" fontWeight="bold">401</Box> - Token inválido
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <DotIcon className={classes.statusDot} style={{ color: '#9e9e9e' }} />
              <Typography variant="body2">
                <Box component="span" fontWeight="bold">500</Box> - Erro interno
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagesAPITab;