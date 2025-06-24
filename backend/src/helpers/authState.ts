import {
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalDataTypeMap
} from "@whiskeysockets/baileys";
import Baileys from "../models/Baileys";

// Função para remover a sessão do banco de dados
export const removeBaileysState = async (sessionId: number): Promise<void> => {
  try {
    const record = await Baileys.findOne({ where: { whatsappId: sessionId } });
    if (record) {
      await record.destroy();
    }
  } catch (err) {
    console.log("Erro ao remover estado do Baileys:", err);
  }
};

// Função principal para gerenciar o estado de autenticação
export const useStore = async (
  sessionId: number
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  // Inicializa credenciais e chaves em memória
  let creds = initAuthCreds();
  let keys: any = {};

  // Busca o registro da sessão no banco de dados
  const record = await Baileys.findOne({ where: { whatsappId: sessionId } });

  // Se houver um registro, desserializa os dados corretamente
  if (record && record.contacts) {
    const parsed = JSON.parse(record.contacts, BufferJSON.reviver);
    creds = parsed.creds;
    keys = parsed.keys;
  }

  // Função para salvar o estado no banco de dados
  const saveState = async () => {
    try {
      const state = { creds, keys };
      // Serializa o estado para JSON, tratando os Buffers corretamente
      const strState = JSON.stringify(state, BufferJSON.replacer, 2);

      const existingRecord = await Baileys.findOne({
        where: { whatsappId: sessionId }
      });

      if (existingRecord) {
        await existingRecord.update({ contacts: strState });
      } else {
        await Baileys.create({ contacts: strState, whatsappId: sessionId });
      }
    } catch (e) {
      console.error("Falha ao salvar o estado de autenticação:", e);
    }
  };

  return {
    // O estado que será usado pelo Baileys
    state: {
      creds,
      // Funções para obter e definir as chaves de sinalização
      keys: {
        get: (type, ids) => {
          const key = type as keyof typeof keys;
          return ids.reduce((dict: any, id: string) => {
            const value = keys[key]?.[id];
            if (value) {
              dict[id] = value;
            }
            return dict;
          }, {});
        },
        set: (data: any) => {
          for (const key in data) {
            const type = key as keyof typeof keys;
            if (!keys[type]) {
              keys[type] = {};
            }
            Object.assign(keys[type], data[key]);
          }
          // Salva o estado sempre que as chaves forem atualizadas
          saveState();
        }
      }
    },
    // Função para ser chamada quando as credenciais são atualizadas
    saveCreds: saveState
  };
};