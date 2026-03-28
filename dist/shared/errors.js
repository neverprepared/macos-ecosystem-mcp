export class MacOSMCPError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MacOSMCPError';
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
        };
    }
}
export class SecurityError extends MacOSMCPError {
    constructor(message, details) {
        super(message, 'SECURITY_VIOLATION', details);
        this.name = 'SecurityError';
    }
}
export class PermissionError extends MacOSMCPError {
    constructor(app, details) {
        super(`Permission denied for "${app}". Please grant access in System Settings > Privacy & Security > Automation`, 'PERMISSION_DENIED', { app, ...details });
        this.name = 'PermissionError';
    }
}
export class AppNotFoundError extends MacOSMCPError {
    constructor(app, details) {
        super(`Application not found: "${app}". Please ensure it is installed.`, 'APP_NOT_FOUND', { app, ...details });
        this.name = 'AppNotFoundError';
    }
}
export class ExecutionTimeoutError extends MacOSMCPError {
    constructor(timeout, details) {
        super(`Script execution timed out after ${timeout}ms`, 'EXECUTION_TIMEOUT', { timeout, ...details });
        this.name = 'ExecutionTimeoutError';
    }
}
export class ValidationError extends MacOSMCPError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
export class ScriptExecutionError extends MacOSMCPError {
    constructor(message, details) {
        super(message, 'SCRIPT_EXECUTION_ERROR', details);
        this.name = 'ScriptExecutionError';
    }
}
export function isPermissionError(errorMessage) {
    const permissionKeywords = [
        'not allowed',
        'authorization',
        'not authorized',
        'permission denied',
        'access denied',
        'not permitted',
    ];
    const lowerMessage = errorMessage.toLowerCase();
    return permissionKeywords.some((keyword) => lowerMessage.includes(keyword));
}
export function isAppNotFoundError(errorMessage) {
    const notFoundKeywords = [
        'application isn\'t running',
        'application is not running',
        'can\'t get application',
        'no application',
    ];
    const lowerMessage = errorMessage.toLowerCase();
    return notFoundKeywords.some((keyword) => lowerMessage.includes(keyword));
}
//# sourceMappingURL=errors.js.map