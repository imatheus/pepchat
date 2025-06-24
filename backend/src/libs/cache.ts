// backend/src/libs/cache.ts

// Versão "Lite" do cache que não usa Redis.
// As funções são "falsas" (dummy) e não fazem nada,
// apenas existem para que o resto do sistema não quebre ao tentar usá-las.

const dummyRedis = {};

export const cacheLayer = {
  get: (key: string): Promise<null> => {
    return Promise.resolve(null);
  },

  set: (key: string, value: string, expiration?: number): Promise<void> => {
    return Promise.resolve();
  },

  del: (key: string): Promise<void> => {
    return Promise.resolve();
  },

  delFromPattern: (pattern: string): Promise<void> => {
    return Promise.resolve();
  },

  // Exporta um objeto redis falso para manter a compatibilidade
  redis: dummyRedis as any
};

// Exporta a constante redis falsa também para manter a compatibilidade
export const redis = dummyRedis as any;
