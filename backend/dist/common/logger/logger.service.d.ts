import { LoggerService } from '@nestjs/common';
export declare class AppLogger implements LoggerService {
    private readonly winstonLogger;
    private context?;
    constructor(context?: string);
    setContext(context: string): void;
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    logRequest(method: string, url: string, statusCode: number, duration: number, requestId: string): void;
}
