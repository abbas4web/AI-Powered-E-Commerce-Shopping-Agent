import { LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';

/**
 * AppLogger — Winston-backed logger.
 *
 * Deliberately NOT decorated with @Injectable() to avoid NestJS emitting
 * constructor parameter metadata (which would cause a DI resolution error
 * for the optional `context: string` parameter).
 *
 * Used in two ways:
 *   1. Injected via LoggerModule (provided as a factory, no constructor args).
 *   2. Instantiated directly: `new AppLogger('MyService')`.
 */
export class AppLogger implements LoggerService {
  private readonly winstonLogger: Logger;
  private context?: string;

  constructor(context?: string) {
    this.context = context;

    this.winstonLogger = createLogger({
      level: process.env.LOG_LEVEL ?? 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: { service: 'smartshop-api' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(
              ({ timestamp, level, message, context: msgCtx, requestId, ...meta }) => {
                const ctx = (msgCtx ?? this.context ?? 'App') as string;
                const rid = requestId ? ` [${requestId}]` : '';
                const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}] [${ctx}]${rid} ${message}${extra}`;
              },
            ),
          ),
        }),
      ],
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.winstonLogger.info(message, { context: context ?? this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.winstonLogger.error(message, { context: context ?? this.context, trace });
  }

  warn(message: string, context?: string) {
    this.winstonLogger.warn(message, { context: context ?? this.context });
  }

  debug(message: string, context?: string) {
    this.winstonLogger.debug(message, { context: context ?? this.context });
  }

  verbose(message: string, context?: string) {
    this.winstonLogger.verbose(message, { context: context ?? this.context });
  }

  /** Structured HTTP request log — used by LoggingInterceptor */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
  ) {
    this.winstonLogger.info('HTTP Request', {
      context: 'HTTP',
      requestId,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    });
  }
}
