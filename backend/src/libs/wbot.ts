import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import Whatsapp from "../models/Whatsapp";
import { getIO } from "./socket";
import { useStore, removeBaileysState } from "../helpers/authState";
import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";

const logger = pino({ level: "silent" });

type Session = WASocket & {
  id?: number;
};

const sessions: Session[] = [];

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) {
    throw new Error("Session not found");
  }
  return sessions[sessionIndex];
};

export const removeWbot = (whatsappId: number): void => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex !== -1) {
    sessions.splice(sessionIndex, 1);
  }
};

export const initWbot = async (whatsapp: Whatsapp): Promise<Session> => {
  const { id, name, companyId } = whatsapp;
  const io = getIO();

  console.log(`--- Iniciando conexão para: ${name} ---`);
  const { state, saveCreds } = await useStore(id);

  const wbot: Session = makeWASocket({
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    version: (await fetchLatestBaileysVersion()).version,
  });

  wbot.id = id;

  const sessionIndex = sessions.findIndex(s => s.id === id);
  if (sessionIndex === -1) {
    sessions.push(wbot);
  } else {
    sessions[sessionIndex] = wbot;
  }

  wbot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    console.log(`Conexão para ${name}: ${connection}`);

    if (qr) {
      // O QR Code é salvo no banco e enviado para o frontend.
      // A impressão no terminal foi removida.
      await whatsapp.update({ qrcode: qr, status: "qrcode" });
      io.emit(`whatsappSession${companyId}`, { action: "update", session: whatsapp });
    }

    if (connection === 'open') {
        await whatsapp.update({ status: "CONNECTED", qrcode: "" });
        io.emit(`whatsappSession${companyId}`, { action: "update", session: whatsapp });
        console.log(`-> CONEXÃO ABERTA PARA ${name} <-`);
        wbotMessageListener(wbot as any, companyId);
    }

    if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        let status = "CLOSED";
        if (statusCode === DisconnectReason.loggedOut) {
          await removeBaileysState(id);
        } else {
          // Se não for deslogado, tenta reconectar
          setTimeout(() => initWbot(whatsapp), 5000);
          status = "OPENING";
        }
        await whatsapp.update({ status, qrcode: "" });
        io.emit(`whatsappSession${companyId}`, { action: "update", session: whatsapp });
    }
  });

  wbot.ev.on("creds.update", saveCreds);

  return wbot;
};