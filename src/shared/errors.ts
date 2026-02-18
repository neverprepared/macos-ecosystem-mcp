/**
 * Custom error classes for macOS MCP Server
 * Provides semantic error types with additional context
 */

export class MacOSMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
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

/**
 * Thrown when security validation fails
 * Used by the validator to prevent unsafe script execution
 */
export class SecurityError extends MacOSMCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SECURITY_VIOLATION', details);
    this.name = 'SecurityError';
  }
}

/**
 * Thrown when macOS denies permission to control an application
 * Provides helpful guidance to the user
 */
export class PermissionError extends MacOSMCPError {
  constructor(app: string, details?: Record<string, unknown>) {
    super(
      `Permission denied for "${app}". Please grant access in System Settings > Privacy & Security > Automation`,
      'PERMISSION_DENIED',
      { app, ...details }
    );
    this.name = 'PermissionError';
  }
}

/**
 * Thrown when target application is not found or not installed
 */
export class AppNotFoundError extends MacOSMCPError {
  constructor(app: string, details?: Record<string, unknown>) {
    super(
      `Application not found: "${app}". Please ensure it is installed.`,
      'APP_NOT_FOUND',
      { app, ...details }
    );
    this.name = 'AppNotFoundError';
  }
}

/**
 * Thrown when script execution times out
 */
export class ExecutionTimeoutError extends MacOSMCPError {
  constructor(timeout: number, details?: Record<string, unknown>) {
    super(
      `Script execution timed out after ${timeout}ms`,
      'EXECUTION_TIMEOUT',
      { timeout, ...details }
    );
    this.name = 'ExecutionTimeoutError';
  }
}

/**
 * Thrown when input validation fails
 */
export class ValidationError extends MacOSMCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when AppleScript execution fails
 */
export class ScriptExecutionError extends MacOSMCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SCRIPT_EXECUTION_ERROR', details);
    this.name = 'ScriptExecutionError';
  }
}

/**
 * Helper to detect permission errors from AppleScript error messages
 */
export function isPermissionError(errorMessage: string): boolean {
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

/**
 * Helper to detect app not found errors
 */
export function isAppNotFoundError(errorMessage: string): boolean {
  const notFoundKeywords = [
    'application isn\'t running',
    'application is not running',
    'can\'t get application',
    'no application',
  ];

  const lowerMessage = errorMessage.toLowerCase();
  return notFoundKeywords.some((keyword) => lowerMessage.includes(keyword));
}
