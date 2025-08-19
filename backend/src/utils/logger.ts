import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || 'error',
  transport: {
    target: 'pino-pretty',
    options: {
      levelFirst: true,
      translateTime: true,
      colorize: true,
    }
  }
});

export { logger };
