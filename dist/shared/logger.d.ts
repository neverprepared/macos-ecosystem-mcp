type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogContext {
    [key: string]: unknown;
}
declare class Logger {
    private level;
    private readonly levels;
    constructor();
    private shouldLog;
    private formatMessage;
    private log;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map