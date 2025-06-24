import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import FacebookLogin from "react-facebook-login";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import "./FacebookModal.css";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    minWidth: 400,
  },
  facebookButton: {
    margin: theme.spacing(2, 0),
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(2),
  },
}));

const FacebookModal = ({ open, onClose, connectionType = "facebook" }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const handleFacebookResponse = async (response) => {
    if (response.accessToken) {
      setLoading(true);
      try {
        const addInstagram = connectionType === "instagram";
        await api.post("/whatsapp/facebook/", {
          facebookUserId: response.userID,
          facebookUserToken: response.accessToken,
          addInstagram: addInstagram,
          connectionType: connectionType,
        });
        
        const successMessage = connectionType === "instagram" 
          ? "Conexões do Instagram criadas com sucesso!"
          : "Conexões do Facebook criadas com sucesso!";
        
        toast.success(successMessage);
        onClose();
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error(`Erro ao autorizar com o ${connectionType === "instagram" ? "Instagram" : "Facebook"}`);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getTitle = () => {
    return connectionType === "instagram" 
      ? "Conectar Instagram"
      : "Conectar Facebook";
  };

  const getDescription = () => {
    if (connectionType === "instagram") {
      return "Para conectar suas contas comerciais do Instagram, você precisa autorizar o acesso através do Facebook.";
    }
    return "Para conectar suas páginas do Facebook Messenger, você precisa autorizar o acesso.";
  };

  const getButtonText = () => {
    return connectionType === "instagram" 
      ? "Conectar Instagram"
      : "Conectar Facebook";
  };

  const getScope = () => {
    if (connectionType === "instagram") {
      return "pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages";
    }
    return "pages_manage_metadata,pages_read_engagement,pages_manage_posts,pages_read_user_content,pages_messaging";
  };

  const getInstructions = () => {
    if (connectionType === "instagram") {
      return [
        "Suas contas comerciais do Instagram serão conectadas automaticamente",
        "É necessário ter uma conta comercial do Instagram vinculada a uma página do Facebook",
        "Após autorizar, você poderá receber e enviar mensagens via Instagram Direct"
      ];
    }
    return [
      "Suas páginas do Facebook serão conectadas automaticamente",
      "Você poderá receber e enviar mensagens via Facebook Messenger",
      "Lembre-se da política de 24h do Facebook para respostas"
    ];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" style={{ marginLeft: 16 }}>
              Criando conexão...
            </Typography>
          </div>
        ) : (
          <Box>
            <Typography variant="body1" paragraph>
              {getDescription()}
            </Typography>
            
            <Typography variant="body2" color="textSecondary" component="div" paragraph>
              {getInstructions().map((instruction, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  • {instruction}
                </div>
              ))}
            </Typography>

            <Box className={classes.facebookButton}>
              {process.env.REACT_APP_FACEBOOK_APP_ID ? (
                <FacebookLogin
                  appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                  autoLoad={false}
                  fields="name,email,picture"
                  scope={getScope()}
                  callback={handleFacebookResponse}
                  textButton={getButtonText()}
                  cssClass="facebook-login-button"
                  icon="fa-facebook"
                />
              ) : (
                <Typography variant="body2" color="error" align="center">
                  Para usar esta funcionalidade, configure o REACT_APP_FACEBOOK_APP_ID no arquivo .env
                </Typography>
              )}
            </Box>

            <Typography variant="caption" color="textSecondary">
              Ao clicar no botão acima, uma nova guia será aberta para você fazer login no Facebook e autorizar o acesso às suas {connectionType === "instagram" ? "contas do Instagram" : "páginas do Facebook"}.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FacebookModal;