import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions,
  CircularProgress,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
  Box,
} from "@material-ui/core";
import { FileCopy as CopyIcon, Refresh as RefreshIcon, Info as InfoIcon } from "@material-ui/icons";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import StandardToggleSwitch from "../StandardToggleSwitch";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },

  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },

  tokenField: {
    "& .MuiInputBase-input": {
      fontFamily: "monospace",
      fontSize: "0.875rem",
    },
  },

  queueSection: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },

  fieldWithHint: {
    position: "relative",
  },

  hintIcon: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
    color: theme.palette.grey[500],
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
}));

const SessionSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  
  // Mensagem padrão para avaliação (sem as opções 1-3 que serão adicionadas automaticamente)
  const defaultRatingMessage = `Muito obrigado por escolher nossa empresa! 😊

Avalie nossa equipe:`;

  // Mensagem padrão de conclusão
  const defaultComplationMessage = "Atendimento finalizado. Obrigado pelo contato! 😊";

  const initialState = {
    name: "",
    greetingMessage: "",
    complationMessage: defaultComplationMessage, // Pré-preencher com mensagem padrão
    outOfHoursMessage: "",
    ratingMessage: defaultRatingMessage, // Pré-preencher com mensagem padrão
    isDefault: false,
    token: "",
    provider: "beta",
  };
  const [whatsApp, setWhatsApp] = useState(initialState);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);

  // Função para gerar token no formato: a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8
  const generateToken = () => {
    const chars = '0123456789abcdef';
    const segments = [8, 4, 4, 4, 12];
    
    return segments.map(length => {
      let segment = '';
      for (let i = 0; i < length; i++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      return segment;
    }).join('-');
  };

  // Gerar token automaticamente para novas conexões
  useEffect(() => {
    if (open && !whatsAppId && !whatsApp.token) {
      const newToken = generateToken();
      setWhatsApp(prev => ({ 
        ...prev, 
        token: newToken
      }));
    }
  }, [open, whatsAppId, whatsApp.token]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`whatsapp/${whatsAppId}?session=0`);
        setWhatsApp(data);

        const whatsQueueIds = data.queues?.map((queue) => queue.id);
        setSelectedQueueIds(whatsQueueIds);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  const handleSaveWhatsApp = async (values) => {
    const whatsappData = { ...values, queueIds: selectedQueueIds };
    delete whatsappData["queues"];
    delete whatsappData["session"];

    try {
      if (whatsAppId) {
        await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
      } else {
        await api.post("/whatsapp", whatsappData);
        // Aguardar um pouco para a conexão ser criada e processada
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      toast.success(i18n.t("whatsappModal.success"));
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copiado!");
  };

  const refreshToken = (setFieldValue) => {
    const newToken = generateToken();
    setFieldValue('token', newToken);
    setWhatsApp(prev => ({ ...prev, token: newToken }));
    toast.success("Novo token gerado!");
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {whatsAppId
            ? i18n.t("whatsappModal.title.edit")
            : i18n.t("whatsappModal.title.add")}
        </DialogTitle>
        <Formik
          initialValues={whatsApp}
          enableReinitialize={true}
          validationSchema={SessionSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveWhatsApp(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ values, touched, errors, isSubmitting, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <div className={classes.multFieldLine}>
                  <Grid spacing={2} container>
                    <Grid item>
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.name")}
                        autoFocus
                        name="name"
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        variant="outlined"
                        margin="dense"
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid style={{ paddingTop: 15 }} item>
                      <Field name="isDefault">
                        {({ field }) => (
                          <StandardToggleSwitch
                            label={i18n.t("whatsappModal.form.default")}
                            checked={field.value}
                            onChange={field.onChange}
                            name={field.name}
                          />
                        )}
                      </Field>
                    </Grid>
                  </Grid>
                </div>

                {/* Setores - movido para cima da mensagem de saudação */}
                <div className={classes.queueSection}>
                  <QueueSelect
                    selectedQueueIds={selectedQueueIds}
                    onChange={(selectedIds) => setSelectedQueueIds(selectedIds)}
                  />
                </div>

                {/* Mensagem de saudação */}
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.greetingMessage")}
                    type="greetingMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="greetingMessage"
                    error={
                      touched.greetingMessage && Boolean(errors.greetingMessage)
                    }
                    helperText={
                      touched.greetingMessage && errors.greetingMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>

                {/* Mensagem fora de expediente */}
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.outOfHoursMessage")}
                    type="outOfHoursMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="outOfHoursMessage"
                    error={
                      touched.outOfHoursMessage &&
                      Boolean(errors.outOfHoursMessage)
                    }
                    helperText={
                      touched.outOfHoursMessage && errors.outOfHoursMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>

                {/* Mensagem de avaliação com hint */}
                <div className={classes.fieldWithHint}>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.ratingMessage")}
                    type="ratingMessage"
                    multiline
                    rows={6}
                    fullWidth
                    name="ratingMessage"
                    error={
                      touched.ratingMessage && Boolean(errors.ratingMessage)
                    }
                    helperText={touched.ratingMessage && errors.ratingMessage}
                    variant="outlined"
                    margin="dense"
                    placeholder="Exemplo: Muito obrigado por escolher nossa empresa! 😊

Avalie nossa equipe:

[Aqui serão inseridas automaticamente as opções 1-3]"
                  />
                  <Tooltip 
                    title="Personalize a mensagem de avaliação. As opções de avaliação (1 - Insatisfeito, 2 - Satisfeito, 3 - Muito Satisfeito) serão adicionadas automaticamente após esta mensagem."
                    placement="top"
                    arrow
                  >
                    <IconButton 
                      size="small" 
                      className={classes.hintIcon}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>

                {/* Mensagem de conclusão - movida para baixo da avaliação */}
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.complationMessage")}
                    type="complationMessage"
                    multiline
                    rows={2}
                    fullWidth
                    name="complationMessage"
                    error={
                      touched.complationMessage &&
                      Boolean(errors.complationMessage)
                    }
                    helperText="Mensagem enviada após a avaliação ou quando o ticket é finalizado."
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                
                {/* Campo Token com ícones */}
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.token")}
                    type="text"
                    fullWidth
                    name="token"
                    variant="outlined"
                    margin="dense"
                    className={classes.tokenField}
                    placeholder="Token será gerado automaticamente"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copiar token">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(values.token)}
                              disabled={!values.token}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gerar novo token">
                            <IconButton
                              size="small"
                              onClick={() => refreshToken(setFieldValue)}
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Token para autenticação na API de mensagens"
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("whatsappModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {whatsAppId
                    ? i18n.t("whatsappModal.buttons.okEdit")
                    : i18n.t("whatsappModal.buttons.okAdd")}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default React.memo(WhatsAppModal);