import pino from 'pino';
import config from 'src/config';

/**
 * Singleton pino logger.
 *
 * - Local / test:  pretty-printed, colorised output via pino-pretty.
 * - Production:    structured JSON written to stdout.
 *                  Lambda automatically captures stdout to CloudWatch Logs,
 *                  so no CloudWatch SDK is needed here.
 */
class Logger {
  private static instance: Logger;
  private logger: pino.Logger;

  private constructor() {
    if (config.ENV_NODE_ENV !== 'production') {
      this.logger = pino({
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      });
    } else {
      this.logger = pino({ level: 'info' });
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  public info(msg: string, meta?: object): void {
    this.logger.info(meta ?? {}, msg);
  }

  public warn(msg: string, meta?: object): void {
    this.logger.warn(meta ?? {}, msg);
  }

  public error(msg: string, meta?: object): void {
    this.logger.error(meta ?? {}, msg);
  }

  public debug(msg: string, meta?: object): void {
    this.logger.debug(meta ?? {}, msg);
  }

  public trace(msg: string, meta?: object): void {
    this.logger.trace(meta ?? {}, msg);
  }
}

export const logger = Logger.getInstance();
