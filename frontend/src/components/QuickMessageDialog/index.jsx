import React, { useState, useEffect, useContext } from 'react';
import { Button, TextField, DialogContent, DialogActions, Grid, InputAdornment, IconButton, Tooltip, CircularProgress } from '@material-ui/core';
import { AttachFile as AttachFileIcon, Delete as DeleteIcon } from '@material-ui/icons';
import PropType from 'prop-types'
import Dialog from '../Dialog';
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { i18n } from '../../translate/i18n';
import { makeStyles } from '@material-ui/core/styles';
import ButtonWithSpinner from '../ButtonWithSpinner';
import { AuthContext } from "../../context/Auth/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

import { isNil, isObject, has, get } from 'lodash';
import { loadQuickMessageMedia, uploadQuickMessageMedia, deleteQuickMessageMedia } from './quickMessageMediaHelpers';

const MessageSchema = Yup.object().shape({
	shortcode: Yup.string()
		.min(3, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
    message: Yup.string()
        .min(3, "Too Short!")
        .max(500, "Too Long!")
        .required("Required")
});

const useStyles = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '350px',
        },
    },
    list: {
        width: '100%',
        maxWidth: '350px',
        maxHeight: '200px',
        backgroundColor: theme.palette.background.paper,
    },
    inline: {
        width: '100%'
    },
    messageFieldWrapper: {
        position: 'relative',
    },
    attachIcon: {
        position: 'absolute',
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


function QuickMessageDialog(props) {
    const classes = useStyles()

    const initialMessage = {
        id: null,
        shortcode: '',
        message: ''
    };

    const { modalOpen, saveMessage, editMessage, onClose, messageSelected } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [message, setMessage] = useState(initialMessage);
    const [loading, setLoading] = useState(false);
    const [messageMedia, setMessageMedia] = useState([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const { user } = useContext(AuthContext);

    useEffect(() => {
        verifyAndSetMessage()
        setDialogOpen(modalOpen)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalOpen])

    useEffect(() => {
        verifyAndSetMessage()
        loadExistingMedia()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageSelected])

    const loadExistingMedia = async () => {
        if (messageSelectedIsValid()) {
            try {
                const existingMedia = await loadQuickMessageMedia(api, messageSelected.id);
                setMessageMedia(existingMedia);
            } catch (err) {
                console.error("Erro ao carregar arquivos existentes:", err);
            }
        } else {
            setMessageMedia([]);
        }
    };

    const messageSelectedIsValid = () => {
        return isObject(messageSelected) && has(messageSelected, 'id') && !isNil(get(messageSelected, 'id'))
    }

    const verifyAndSetMessage = () =>{
        if (messageSelectedIsValid()) {
            const { id, message, shortcode } = messageSelected
            setMessage({ id, message, shortcode })
        } else {
            setMessage(initialMessage)
        }
    }

    const handleClose = () => {
        onClose()
        setLoading(false)
        setMessageMedia([])
        setUploadingMedia(false)
    }

    const handleSave = async (values) => {
        let savedMessageId = messageSelected?.id;
        
        try {
            if (messageSelectedIsValid()) {
                await editMessage({
                    ...messageSelected,
                    ...values,
                    userId: user.id
                });
            } else {
                const newMessage = await saveMessage({
                    ...values,
                    userId: user.id
                });
                savedMessageId = newMessage?.id;
            }

            // Fazer upload dos arquivos se houver arquivos novos
            const newFiles = messageMedia.filter(media => !media.isExisting);
            if (newFiles.length > 0 && savedMessageId) {
                setUploadingMedia(true);
                try {
                    const success = await uploadQuickMessageMedia(api, savedMessageId, messageMedia, toast, toastError);
                    if (success) {
                        toast.success("Arquivos enviados com sucesso!");
                    }
                } catch (uploadErr) {
                    console.error("Erro no upload dos arquivos:", uploadErr);
                    toast.error("Erro ao enviar arquivos");
                } finally {
                    setUploadingMedia(false);
                }
            }
        } catch (error) {
            console.error("Erro ao salvar mensagem:", error);
            toast.error("Erro ao salvar mensagem");
        }

        handleClose()
    }

    const handleMediaChange = (event) => {
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
                        setMessageMedia(prev => [...prev]);
                    };
                    reader.readAsDataURL(fileObj.file);
                }
            });
            
            setMessageMedia(prev => [...prev, ...newFiles]);
            toast.success(`${files.length} arquivo(s) selecionado(s)`);
        }
        
        // Limpar o input
        event.target.value = '';
    };

    const removeMedia = (fileId) => {
        const mediaItem = messageMedia.find(media => media.id === fileId);
        
        if (mediaItem && mediaItem.isExisting) {
            // Se é um arquivo existente no servidor, deletar do servidor
            handleDeleteMedia(mediaItem.id);
        } else {
            // Se é um arquivo novo, apenas remover da lista local
            setMessageMedia(prev => prev.filter(media => media.id !== fileId));
            toast.info("Arquivo removido da mensagem");
        }
    };

    const handleDeleteMedia = async (filename) => {
        if (!messageSelected?.id) return;
        
        try {
            const success = await deleteQuickMessageMedia(api, messageSelected.id, filename, toast, toastError);
            if (success) {
                setMessageMedia(prev => prev.filter(media => 
                    media.isExisting ? media.id !== filename : media.id !== filename
                ));
            }
        } catch (err) {
            toastError(err);
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

    return (
        <Dialog
            title="Mensagem Rápida"
            modalOpen={dialogOpen}
            onClose={handleClose}
        >
            <Formik
                initialValues={message}
                enableReinitialize={true}
                validationSchema={MessageSchema}
                onSubmit={(values, actions) => {
                    setLoading(true)
                    setTimeout(() => {
                        handleSave(values);
                        actions.setSubmitting(false);
                    }, 400);
                }}
            >

                {({ touched, errors }) => (
                    <Form>
                        <DialogContent className={classes.root} dividers>
                            <Grid direction="column" container>
                                <Grid item>
                                    <Field
                                        as={TextField}
                                        name="shortcode"
                                        label={i18n.t("quickMessages.dialog.shortcode")}
                                        error={touched.shortcode && Boolean(errors.shortcode)}
                                        helperText={touched.shortcode && errors.shortcode}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item>
                                    <div className={classes.messageFieldWrapper}>
                                        <Field
                                            as={TextField}
                                            name="message"
                                            rows={6}
                                            label={i18n.t("quickMessages.dialog.message")}
                                            multiline={true}
                                            error={touched.message && Boolean(errors.message)}
                                            helperText={touched.message && errors.message || "Você pode anexar imagens, vídeos ou documentos junto com a mensagem"}
                                            variant="outlined"
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                                                        <input
                                                            type="file"
                                                            id="message-media-input"
                                                            className={classes.uploadInput}
                                                            onChange={handleMediaChange}
                                                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                                            multiple
                                                        />
                                                        <label htmlFor="message-media-input">
                                                            <Tooltip title="Anexar arquivo à mensagem rápida">
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
                                        {messageMedia.length > 0 && (
                                            <div className={classes.mediaContainer}>
                                                {/* Header com informações */}
                                                <div className={classes.mediaHeader}>
                                                    <span style={{ fontWeight: 500 }}>
                                                        {messageMedia.filter(m => m.isExisting).length > 0 && 
                                                            `${messageMedia.filter(m => m.isExisting).length} arquivo(s) salvos`}
                                                        {messageMedia.filter(m => m.isExisting).length > 0 && 
                                                         messageMedia.filter(m => !m.isExisting).length > 0 && " • "}
                                                        {messageMedia.filter(m => !m.isExisting).length > 0 && 
                                                            `${messageMedia.filter(m => !m.isExisting).length} arquivo(s) selecionados`}
                                                    </span>
                                                    {uploadingMedia && (
                                                        <CircularProgress size={20} />
                                                    )}
                                                </div>

                                                {/* Lista de arquivos com preview */}
                                                {messageMedia.map((mediaObj) => (
                                                    <div key={mediaObj.id} className={classes.mediaItem}>
                                                        <div className={classes.mediaHeader}>
                                                            <div className={classes.fileName}>
                                                                {mediaObj.isExisting && "📎 "}
                                                                {mediaObj.file.name}
                                                                {mediaObj.isExisting && " (salvo)"}
                                                            </div>
                                                            <Tooltip title="Remover arquivo">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => removeMedia(mediaObj.id)}
                                                                    color="secondary"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </div>
                                                        
                                                        <div className={classes.mediaPreviewContent}>
                                                            {renderFilePreview(mediaObj)}
                                                            
                                                            <div className={classes.fileInfo}>
                                                                <div className={classes.fileSize}>
                                                                    {formatFileSize(mediaObj.file.size)}
                                                                </div>
                                                                <div className={classes.fileType}>
                                                                    {mediaObj.file.type || 'Tipo desconhecido'}
                                                                </div>
                                                                {mediaObj.file.type.startsWith('image/') && (
                                                                    <div style={{ fontSize: '0.75em', color: 'gray' }}>
                                                                        Imagem • Pré-visualização disponível
                                                                    </div>
                                                                )}
                                                                {mediaObj.file.type.startsWith('video/') && (
                                                                    <div style={{ fontSize: '0.75em', color: 'gray' }}>
                                                                        Vídeo • Player disponível
                                                                    </div>
                                                                )}
                                                                {mediaObj.file.type.startsWith('audio/') && (
                                                                    <div style={{ fontSize: '0.75em', color: 'gray' }}>
                                                                        Áudio • {getFileIcon(mediaObj.file.type)}
                                                                    </div>
                                                                )}
                                                                {!mediaObj.file.type.startsWith('image/') && 
                                                                 !mediaObj.file.type.startsWith('video/') && 
                                                                 !mediaObj.file.type.startsWith('audio/') && (
                                                                    <div style={{ fontSize: '0.75em', color: 'gray' }}>
                                                                        Documento • {getFileIcon(mediaObj.file.type)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancelar
                            </Button>
                            <ButtonWithSpinner loading={loading} color="primary" type="submit" variant="contained" autoFocus>
                                Salvar
                            </ButtonWithSpinner>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    )
}

QuickMessageDialog.propType = {
    modalOpen: PropType.bool,
    onClose: PropType.func
}

export default QuickMessageDialog;