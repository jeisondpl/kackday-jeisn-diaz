import pino from 'pino';
import config from '../config/index.js';

const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

// Logger port interface (for dependency injection)
export class LoggerPort {
  trace(msg, ...args) {}
  debug(msg, ...args) {}
  info(msg, ...args) {}
  warn(msg, ...args) {}
  error(msg, ...args) {}
  fatal(msg, ...args) {}
  child(bindings) {}
}

// Pino adapter implementation
export class PinoLoggerAdapter extends LoggerPort {
  constructor(pinoInstance = logger) {
    super();
    this.logger = pinoInstance;
  }

  trace(msg, ...args) {
    this.logger.trace(msg, ...args);
  }

  debug(msg, ...args) {
    this.logger.debug(msg, ...args);
  }

  info(msg, ...args) {
    this.logger.info(msg, ...args);
  }

  warn(msg, ...args) {
    this.logger.warn(msg, ...args);
  }

  error(msg, ...args) {
    this.logger.error(msg, ...args);
  }

  fatal(msg, ...args) {
    this.logger.fatal(msg, ...args);
  }

  child(bindings) {
    return new PinoLoggerAdapter(this.logger.child(bindings));
  }
}
