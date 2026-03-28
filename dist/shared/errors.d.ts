export declare class MacOSMCPError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
    toJSON(): {
        name: string;
        message: string;
        code: string;
        details: Record<string, unknown> | undefined;
    };
}
export declare class SecurityError extends MacOSMCPError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class PermissionError extends MacOSMCPError {
    constructor(app: string, details?: Record<string, unknown>);
}
export declare class AppNotFoundError extends MacOSMCPError {
    constructor(app: string, details?: Record<string, unknown>);
}
export declare class ExecutionTimeoutError extends MacOSMCPError {
    constructor(timeout: number, details?: Record<string, unknown>);
}
export declare class ValidationError extends MacOSMCPError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class ScriptExecutionError extends MacOSMCPError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare function isPermissionError(errorMessage: string): boolean;
export declare function isAppNotFoundError(errorMessage: string): boolean;
//# sourceMappingURL=errors.d.ts.map