/**
 * Structured logging utility for macOS MCP Server
 *
 * IMPORTANT: All logs must go to stderr to avoid interfering with MCP stdio protocol
 * The MCP server communicates with clients via stdout, so stdout must remain clean.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    const envLevel = process.env['LOG_LEVEL']?.toLowerCase() as LogLevel | undefined;
    this.level = envLevel && envLevel in this.levels ? envLevel : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);

    let output = `[${timestamp}] ${levelStr} ${message}`;

    if (context && Object.keys(context).length > 0) {
      try {
        // Pretty print context with indentation
        const contextStr = JSON.stringify(context, null, 2)
          .split('\n')
          .map((line, idx) => (idx === 0 ? ` ${line}` : `  ${line}`))
          .join('\n');
        output += contextStr;
      } catch (err) {
        output += ` [context serialization error: ${String(err)}]`;
      }
    }

    return output;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, context);

    // Always write to stderr for MCP compatibility
    process.stderr.write(formatted + '\n');
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

// Export singleton instance
export const logger = new Logger();
