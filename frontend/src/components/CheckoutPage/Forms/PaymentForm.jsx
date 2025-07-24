import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Divider,
  Paper
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../../services/api";
import toastError from "../../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  card: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
  },
  pixCard: {
    backgroundColor: "#f8f9fa",
    border: "2px solid #28a745",
    borderRadius: "12px",
    padding: theme.spacing(3),
    textAlign: "center",
    marginTop: theme.spacing(2),
  },
  qrCodeContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  qrCodeImage: {
    maxWidth: "250px",
    maxHeight: "250px",
    border: "2px solid #ddd",
    borderRadius: "8px",
  },
  pixCode: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: theme.spacing(1),
    fontFamily: "monospace",
    fontSize: "0.8rem",
    wordBreak: "break-all",
    maxWidth: "100%",
    overflow: "auto",
  },
  copyButton: {
    marginTop: theme.spacing(1),
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(4),
  },
  invoiceInfo: {
    backgroundColor: "#e3f2fd",
    padding: theme.spacing(2),
    borderRadius: "8px",
    marginBottom: theme.spacing(2),
  },
  generateButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: theme.spacing(1.5, 4),
    fontSize: "1.1rem",
    fontWeight: "bold",
    "&:hover": {
      backgroundColor: "#218838",
    },
  },
}));

const PaymentForm = ({ formField, setFieldValue, setActiveStep, activeStep, invoiceId, values }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [invoice, setInvoice] = useState(null);

  // Buscar dados da fatura
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await api.get(`/invoices/${invoiceId}`);
        setInvoice(data);
      } catch (error) {
        console.error("Erro ao buscar fatura:", error);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const generatePixPayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        firstName: values.firstName || "Cliente",
        price: invoice?.value || 0,
        users: 1,
        connections: 1,
        address2: values.address2 || "",
        city: values.city || "",
        state: values.state || "",
        zipcode: values.zipcode || "",
        country: values.country || "Brasil",
        plan: JSON.stringify({
          price: invoice?.value || 0,
          users: 1,
          connections: 1
        }),
        invoiceId: invoiceId
      };

      const { data } = await api.post("/subscription", paymentData);
      setPixData(data);
      toast.success("PIX gerado com sucesso! Escaneie o QR Code ou copie o código PIX.");
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qrcode?.qrcode) {
      navigator.clipboard.writeText(pixData.qrcode.qrcode);
      toast.success("Código PIX copiado para a área de transferência!");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className={classes.root}>
      <Typography variant="h5" gutterBottom align="center">
        Pagamento da Fatura
      </Typography>

      {/* Informações da Fatura */}
      {invoice && (
        <Paper className={classes.invoiceInfo}>
          <Typography variant="h6" gutterBottom>
            Detalhes da Fatura
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Fatura:</strong> #{invoice.id}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Valor:</strong> {formatCurrency(invoice.value)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2">
                <strong>Descrição:</strong> {invoice.detail}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Vencimento:</strong> {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Status:</strong> {invoice.status === 'PENDING' ? 'Pendente' : invoice.status}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Divider style={{ margin: "20px 0" }} />

      {/* Área de Pagamento PIX */}
      {!pixData && !loading && (
        <Card className={classes.card}>
          <CardContent>
            <Typography variant="h6" gutterBottom align="center">
              Pagamento via PIX
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" paragraph>
              Clique no botão abaixo para gerar o código PIX e realizar o pagamento da sua fatura.
            </Typography>
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                className={classes.generateButton}
                onClick={generatePixPayment}
                size="large"
              >
                Gerar PIX para Pagamento
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className={classes.loadingContainer}>
          <CircularProgress size={50} />
          <Typography variant="body1">
            Gerando código PIX...
          </Typography>
        </div>
      )}

      {/* PIX Gerado */}
      {pixData && (
        <Card className={classes.pixCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <span role="img" aria-label="celebration">🎉</span> PIX Gerado com Sucesso!
            </Typography>
            
            <div className={classes.qrCodeContainer}>
              {pixData.qrcode?.imagemQrcode && (
                <img
                  src={`data:image/png;base64,${pixData.qrcode.imagemQrcode}`}
                  alt="QR Code PIX"
                  className={classes.qrCodeImage}
                />
              )}
              
              <Typography variant="body2" color="textSecondary">
                Escaneie o QR Code acima com o app do seu banco
              </Typography>
              
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
                Ou copie o código PIX abaixo:
              </Typography>
              
              {pixData.qrcode?.qrcode && (
                <>
                  <div className={classes.pixCode}>
                    {pixData.qrcode.qrcode}
                  </div>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={copyPixCode}
                    className={classes.copyButton}
                  >
                    Copiar Código PIX
                  </Button>
                </>
              )}
              
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
                <strong>Valor:</strong> {formatCurrency(invoice?.value || 0)}
              </Typography>
              
              <Typography variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                O pagamento será processado automaticamente após a confirmação.
                Você receberá uma notificação quando o pagamento for aprovado.
              </Typography>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentForm;