import pino from 'pino';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PinoLoggerAdapter implements LoggerPort {
  private logger: pino.Logger;

  constructor(options?: pino.LoggerOptions) {
    this.logger = pino(options || {});
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context || {}, message);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context || {}, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context || {}, message);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logger.error({ err: error, ...context }, message);
  }

  child(bindings: Record<string, unknown>): LoggerPort {
    return new PinoLoggerAdapter({ ...this.logger.bindings(), ...bindings } as pino.LoggerOptions);
  }
}
