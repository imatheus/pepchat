import React, { useEffect, useState } from "react";
import QRCode from "qrcode.react";
import toastError from "../../errors/toastError";

import { Dialog, DialogContent, Paper, Typography } from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { socketConnection } from "../../services/socket";

const QrcodeModal = ({ open, onClose, whatsAppId }) => {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`/whatsapp/${whatsAppId}`);
        setQrCode(data.qrcode);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  useEffect(() => {
    if (!whatsAppId) return;
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const handleSessionUpdate = (data) => {
      if (data.action === "update" && data.session.id === whatsAppId) {
        setQrCode(data.session.qrcode);
        
        // Se a conexão foi estabelecida, fechar o modal
        if (data.session.status === "CONNECTED") {
          onClose();
        }
      }
    };

    const handleWhatsappUpdate = (data) => {
      if (data.action === "update" && data.whatsapp.id === whatsAppId) {
        setQrCode(data.whatsapp.qrcode);
        
        // Se a conexão foi estabelecida, fechar o modal
        if (data.whatsapp.status === "CONNECTED") {
          onClose();
        }
      }
    };

    socket.on(`company-${companyId}-whatsappSession`, handleSessionUpdate);
    socket.on(`company-${companyId}-whatsapp`, handleWhatsappUpdate);

    return () => {
      socket.off(`company-${companyId}-whatsappSession`, handleSessionUpdate);
      socket.off(`company-${companyId}-whatsapp`, handleWhatsappUpdate);
      socket.disconnect();
    };
  }, [whatsAppId, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" scroll="paper">
      <DialogContent>
        <Paper elevation={0}>
          <Typography color="primary" gutterBottom>
            {i18n.t("qrCode.message")}
          </Typography>
          {qrCode ? (
            <QRCode value={qrCode} size={256} />
          ) : (
            <span>Validando QR Code</span>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);
