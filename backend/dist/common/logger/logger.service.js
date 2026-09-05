"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const winston_1 = require("winston");
class AppLogger {
    constructor(context) {
        this.context = context;
        this.winstonLogger = (0, winston_1.createLogger)({
            level: process.env.LOG_LEVEL ?? 'debug',
            format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.json()),
            defaultMeta: { service: 'smartshop-api' },
            transports: [
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, context: msgCtx, requestId, ...meta }) => {
                        const ctx = (msgCtx ?? this.context ?? 'App');
                        const rid = requestId ? ` [${requestId}]` : '';
                        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        return `${timestamp} [${level}] [${ctx}]${rid} ${message}${extra}`;
                    })),
                }),
            ],
        });
    }
    setContext(context) {
        this.context = context;
    }
    log(message, context) {
        this.winstonLogger.info(message, { context: context ?? this.context });
    }
    error(message, trace, context) {
        this.winstonLogger.error(message, { context: context ?? this.context, trace });
    }
    warn(message, context) {
        this.winstonLogger.warn(message, { context: context ?? this.context });
    }
    debug(message, context) {
        this.winstonLogger.debug(message, { context: context ?? this.context });
    }
    verbose(message, context) {
        this.winstonLogger.verbose(message, { context: context ?? this.context });
    }
    logRequest(method, url, statusCode, duration, requestId) {
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
exports.AppLogger = AppLogger;
//# sourceMappingURL=logger.service.js.map