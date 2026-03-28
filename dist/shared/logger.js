class Logger {
    level;
    levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };
    constructor() {
        const envLevel = process.env['LOG_LEVEL']?.toLowerCase();
        this.level = envLevel && envLevel in this.levels ? envLevel : 'info';
    }
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(5);
        let output = `[${timestamp}] ${levelStr} ${message}`;
        if (context && Object.keys(context).length > 0) {
            try {
                const contextStr = JSON.stringify(context, null, 2)
                    .split('\n')
                    .map((line, idx) => (idx === 0 ? ` ${line}` : `  ${line}`))
                    .join('\n');
                output += contextStr;
            }
            catch (err) {
                output += ` [context serialization error: ${String(err)}]`;
            }
        }
        return output;
    }
    log(level, message, context) {
        if (!this.shouldLog(level)) {
            return;
        }
        const formatted = this.formatMessage(level, message, context);
        process.stderr.write(formatted + '\n');
    }
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, context) {
        this.log('error', message, context);
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map