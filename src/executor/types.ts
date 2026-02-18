/**
 * Type definitions for AppleScript executor
 */

/**
 * Context required for executing an AppleScript
 */
export interface ExecutionContext {
  /** The AppleScript code to execute */
  script: string;

  /** Target application name (must be in whitelist) */
  app: string;

  /** Operation being performed (for logging/auditing) */
  operation: string;

  /** Optional timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Whether to skip security validation (dangerous, only for testing) */
  skipValidation?: boolean;
}

/**
 * Result from AppleScript execution
 */
export interface ExecutionResult {
  /** Raw output from the script */
  output: string;

  /** Execution duration in milliseconds */
  duration: number;

  /** Whether the script executed successfully */
  success: boolean;
}

/**
 * Options for the AppleScript executor
 */
export interface ExecutorOptions {
  /** Default timeout for all executions */
  defaultTimeout?: number;

  /** Whether to enable security validation */
  enableValidation?: boolean;

  /** Maximum script length in characters */
  maxScriptLength?: number;
}

/**
 * Whitelisted macOS applications
 */
export const ALLOWED_APPS = [
  'Reminders',
  'Calendar',
  'Notes',
  'Mail',
  'Messages',
  'Safari',
  'Music',
  'Photos',
  'Shortcuts',
  'Contacts',
  'Finder',
] as const;

export type AllowedApp = (typeof ALLOWED_APPS)[number];

/**
 * Forbidden AppleScript patterns for security
 */
export const FORBIDDEN_PATTERNS = [
  'do shell script',
  'sudo',
  'rm -rf',
  'delete file',
  'delete folder',
  'System Events',
  'keystroke',
  'key code',
  'administrator privileges',
  'with administrator',
  'curl',
  'wget',
  'python',
  'ruby',
  'perl',
  'bash',
  'zsh',
  'sh -c',
] as const;
