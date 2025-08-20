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
} from "@material-ui/core";
import { FileCopy as CopyIcon, Refresh as RefreshIcon, Info as InfoIcon, AttachFile as AttachFileIcon, Delete as DeleteIcon } from "@material-ui/icons";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import ToggleSwitch from "../ToggleSwitch";
import { loadGreetingMedia, uploadGreetingMedia as uploadGreetingMediaHelper, deleteGreetingMedia } from "./greetingMediaHelpers";

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

  greetingFieldWrapper: {
    position: "relative",
  },

  attachIcon: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
    color: theme.palette.grey[500],
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },

  uploadInput: {
    display: "none",
  },

  mediaPreview: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mediaInfo: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },

  mediaContainer: {
    marginTop: theme.spacing(1),
    maxHeight: 300,
    overflowY: "auto",
  },

  mediaItem: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.grey[300]}`,
  },

  mediaHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },

  mediaPreviewContent: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
  },

  previewImage: {
    maxWidth: 100,
    maxHeight: 100,
    borderRadius: theme.shape.borderRadius,
    objectFit: "cover",
  },

  previewVideo: {
    maxWidth: 150,
    maxHeight: 100,
    borderRadius: theme.shape.borderRadius,
  },

  documentPreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    backgroundColor: theme.palette.grey[200],
    borderRadius: theme.shape.borderRadius,
    fontSize: "2rem",
    color: theme.palette.grey[600],
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontWeight: 500,
    marginBottom: theme.spacing(0.5),
  },

  fileSize: {
    fontSize: "0.8em",
    color: theme.palette.grey[600],
  },

  fileType: {
    fontSize: "0.75em",
    color: theme.palette.grey[500],
    textTransform: "uppercase",
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
  const [greetingMedia, setGreetingMedia] = useState([]);
  const [uploadingGreeting, setUploadingGreeting] = useState(false);

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
        
        // Carregar arquivos existentes de saudação
        const existingMedia = await loadGreetingMedia(api, whatsAppId);
        setGreetingMedia(existingMedia);
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
      let savedWhatsAppId = whatsAppId;
      
      if (whatsAppId) {
        await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
      } else {
        const response = await api.post("/whatsapp", whatsappData);
        savedWhatsAppId = response.data.id;
      }

      // Fazer upload dos arquivos de saudação se houver arquivos novos
      const newFiles = greetingMedia.filter(media => !media.isExisting);
      if (newFiles.length > 0 && savedWhatsAppId) {
        setUploadingGreeting(true);
        try {
          const success = await uploadGreetingMediaHelper(api, savedWhatsAppId, greetingMedia, toast, toastError);
          if (success) {
            toast.success("Arquivos de saudação enviados com sucesso!");
          }
        } catch (uploadErr) {
          console.error("Erro no upload dos arquivos:", uploadErr);
          toast.error("Erro ao enviar arquivos de saudação");
        } finally {
          setUploadingGreeting(false);
        }
      }

      toast.success(i18n.t("whatsappModal.success"));
      handleClose();
      
      // Recarregar a página após um pequeno delay para mostrar as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toastError(err);
    }
  };

  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
    setGreetingMedia([]);
    setUploadingGreeting(false);
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

  const handleGreetingMediaChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        file,
        id: Date.now() + Math.random(),
        preview: null,
        isExisting: false
      }));
      
      // Gerar previews para imagens
      newFiles.forEach(fileObj => {
        if (fileObj.file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            fileObj.preview = e.target.result;
            setGreetingMedia(prev => [...prev]);
          };
          reader.readAsDataURL(fileObj.file);
        }
      });
      
      setGreetingMedia(prev => [...prev, ...newFiles]);
      toast.success(`${files.length} arquivo(s) selecionado(s)`);
    }
    
    // Limpar o input para permitir selecionar os mesmos arquivos novamente
    event.target.value = '';
  };

  const handleUploadGreetingMedia = async () => {
    if (!whatsAppId) {
      toast.error("Salve a conexão primeiro antes de anexar arquivos");
      return;
    }

    setUploadingGreeting(true);
    
    try {
      const success = await uploadGreetingMediaHelper(api, whatsAppId, greetingMedia, toast, toastError);
      if (success) {
        // Recarregar arquivos após upload
        const updatedMedia = await loadGreetingMedia(api, whatsAppId);
        setGreetingMedia(updatedMedia);
      }
    } catch (err) {
      toastError(err);
    } finally {
      setUploadingGreeting(false);
    }
  };

  const handleDeleteGreetingMedia = async (filename) => {
    if (!whatsAppId) return;
    
    try {
      const success = await deleteGreetingMedia(api, whatsAppId, filename, toast, toastError);
      if (success) {
        // Remover arquivo da lista local
        setGreetingMedia(prev => prev.filter(media => 
          media.isExisting ? media.id !== filename : media.id !== filename
        ));
      }
    } catch (err) {
      toastError(err);
    }
  };

  const removeGreetingMedia = (fileId) => {
    const mediaItem = greetingMedia.find(media => media.id === fileId);
    
    if (mediaItem && mediaItem.isExisting) {
      // Se é um arquivo existente no servidor, deletar do servidor
      handleDeleteGreetingMedia(mediaItem.id);
    } else {
      // Se é um arquivo novo, apenas remover da lista local
      setGreetingMedia(prev => prev.filter(media => media.id !== fileId));
      toast.info("Arquivo removido da mensagem de saudação");
    }
  };

  const removeAllGreetingMedia = () => {
    // Remover apenas arquivos novos (não existentes no servidor)
    const newFiles = greetingMedia.filter(media => !media.isExisting);
    if (newFiles.length > 0) {
      setGreetingMedia(prev => prev.filter(media => media.isExisting));
      toast.info(`${newFiles.length} arquivo(s) removido(s) da seleção`);
    } else {
      toast.info("Nenhum arquivo novo para remover");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFilePreview = (mediaObj) => {
    const { file, preview, isExisting } = mediaObj;
    
    if (isExisting) {
      // Para arquivos existentes, usar o preview do servidor se disponível
      if (preview) {
        return (
          <img 
            src={preview} 
            alt={file.name}
            className={classes.previewImage}
          />
        );
      } else {
        return (
          <div className={classes.documentPreview}>
            {getFileIcon(file.type)}
          </div>
        );
      }
    }
    
    // Para arquivos novos
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={preview} 
          alt={file.name}
          className={classes.previewImage}
        />
      );
    }
    
    if (file.type.startsWith('video/')) {
      return (
        <video 
          className={classes.previewVideo}
          controls
          preload="metadata"
        >
          <source src={URL.createObjectURL(file)} type={file.type} />
          Seu navegador não suporta vídeo.
        </video>
      );
    }
    
    return (
      <div className={classes.documentPreview}>
        {getFileIcon(file.type)}
      </div>
    );
  };

  const newFilesCount = greetingMedia.filter(media => !media.isExisting).length;
  const existingFilesCount = greetingMedia.filter(media => media.isExisting).length;

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
                          <ToggleSwitch
                            label={i18n.t("whatsappModal.form.default")}
                            checked={field.value}
                            onChange={field.onChange}
                            name={field.name}
                            variant="standard"
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

                {/* Mensagem de saudação com anexo */}
                <div className={classes.greetingFieldWrapper}>
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
                      touched.greetingMessage && errors.greetingMessage || "Você pode anexar imagens, vídeos ou documentos junto com a mensagem"
                    }
                    variant="outlined"
                    margin="dense"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                          <input
                            type="file"
                            id="greeting-media-input"
                            className={classes.uploadInput}
                            onChange={handleGreetingMediaChange}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            multiple
                          />
                          <label htmlFor="greeting-media-input">
                            <Tooltip title="Anexar arquivo à mensagem de saudação">
                              <IconButton
                                size="small"
                                component="span"
                                className={classes.attachIcon}
                              >
                                <AttachFileIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </label>
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {/* Preview dos arquivos selecionados */}
                  {greetingMedia.length > 0 && (
                    <div className={classes.mediaContainer}>
                      {/* Header com ações globais */}
                      <div className={classes.mediaHeader}>
                        <span style={{ fontWeight: 500 }}>
                          {existingFilesCount > 0 && `${existingFilesCount} arquivo(s) salvos`}
                          {existingFilesCount > 0 && newFilesCount > 0 && " • "}
                          {newFilesCount > 0 && `${newFilesCount} arquivo(s) selecionados`}
                        </span>
                        <div>
                          {!uploadingGreeting && newFilesCount > 0 && (
                            <Tooltip title="Arquivos serão enviados automaticamente ao salvar">
                              <IconButton
                                size="small"
                                onClick={handleUploadGreetingMedia}
                                color="primary"
                                disabled={!whatsAppId}
                              >
                                <AttachFileIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {uploadingGreeting && (
                            <CircularProgress size={20} />
                          )}
                        </div>
                      </div>

                      {/* Lista de arquivos com preview */}
                      {greetingMedia.map((mediaObj) => (
                        <div key={mediaObj.id} className={classes.mediaItem}>
                          <div className={classes.mediaHeader}>
                            <div className={classes.fileName}>
                              {mediaObj.file.name}
                            </div>
                            <Tooltip title="Remover arquivo">
                              <IconButton
                                size="small"
                                onClick={() => removeGreetingMedia(mediaObj.id)}
                                color="secondary"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </div>
                          
                          <div className={classes.mediaPreviewContent}>
                            {renderFilePreview(mediaObj)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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