// backend/src/helpers/useMultiFileAuthState.ts

import {
  proto,
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON
} from "@adiwajshing/baileys";
import { promisify } from "util";
import fs from "fs";
import path from "path";

import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";

// Define o diretório onde as sessões do WhatsApp serão salvas
const SESSIONS_DIR = path.join(__dirname, "..", "..", "whatsapp_sessions");

// Cria o diretório de sessões se ele não existir
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const rmAsync = promisify(fs.rm);

export const useMultiFileAuthState = async (
  whatsapp: Whatsapp
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const whatsappId = whatsapp.id.toString();
  const sessionDir = path.join(SESSIONS_DIR, whatsappId);

  // Cria um diretório específico para esta sessão de WhatsApp se não existir
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const credsFilePath = path.join(sessionDir, "creds.json");

  const writeData = async (data: any, file: string) => {
    const filePath = path.join(sessionDir, file.replace(/\//g, "__"));
    await writeFileAsync(filePath, JSON.stringify(data, BufferJSON.replacer));
  };

  const readData = async (file: string) => {
    try {
      const filePath = path.join(sessionDir, file.replace(/\//g, "__"));
      const data = await readFileAsync(filePath, { encoding: "utf-8" });
      return JSON.parse(data, BufferJSON.reviver);
    } catch (error) {
      return null;
    }
  };

  const removeData = async (file: string) => {
    try {
      const filePath = path.join(sessionDir, file.replace(/\//g, "__"));
      await rmAsync(filePath);
    } catch (error) {
      // Ignora o erro se o arquivo não existir
    }
  };

  const creds: AuthenticationCreds = (await readData("creds.json")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
          for (const id of ids) {
            let value = await readData(`${type}-${id}.json`);
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            if (value) {
              data[id] = value;
            }
          }
          return data;
        },
        set: async data => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => {
      return writeData(creds, "creds.json");
    }
  };
};
