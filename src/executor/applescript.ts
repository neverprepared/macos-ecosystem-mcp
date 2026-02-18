/**
 * AppleScript execution wrapper with security, timeout, and error handling
 */

import { runAppleScript } from 'run-applescript';
import { logger } from '../shared/logger.js';
import {
  MacOSMCPError,
  PermissionError,
  AppNotFoundError,
  ExecutionTimeoutError,
  ScriptExecutionError,
  isPermissionError,
  isAppNotFoundError,
} from '../shared/errors.js';
import { validateScript } from './validator.js';
import { timeout } from '../shared/utils.js';
import type { ExecutionContext, ExecutionResult } from './types.js';

/**
 * Default timeout for script execution (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Executes an AppleScript with security validation and timeout
 *
 * @param ctx - Execution context including script, app, operation
 * @returns Promise resolving to the script output
 * @throws {SecurityError} If validation fails
 * @throws {PermissionError} If macOS denies permission
 * @throws {AppNotFoundError} If target app is not found
 * @throws {ExecutionTimeoutError} If execution exceeds timeout
 * @throws {ScriptExecutionError} For other execution failures
 */
export async function executeScript(ctx: ExecutionContext): Promise<string> {
  const startTime = Date.now();
  const scriptTimeout = ctx.timeout ?? DEFAULT_TIMEOUT;

  logger.info('Executing AppleScript', {
    app: ctx.app,
    operation: ctx.operation,
    timeout: scriptTimeout,
    scriptLength: ctx.script.length,
  });

  try {
    // Security validation (unless explicitly skipped)
    if (!ctx.skipValidation) {
      validateScript(ctx.script, ctx.app);
    } else {
      logger.warn('⚠️  Security validation skipped', { app: ctx.app });
    }

    // Execute with timeout
    const result = await timeout(
      runAppleScript(ctx.script),
      scriptTimeout,
      `Script execution timed out after ${scriptTimeout}ms`
    );

    const duration = Date.now() - startTime;

    logger.info('Script executed successfully', {
      app: ctx.app,
      operation: ctx.operation,
      duration,
      outputLength: result.length,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Script execution failed', {
      app: ctx.app,
      operation: ctx.operation,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });

    // Re-throw if already our custom error type
    if (error instanceof MacOSMCPError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Detect timeout errors
    if (errorMessage.includes('timed out') || errorMessage.includes('Timeout')) {
      throw new ExecutionTimeoutError(scriptTimeout, {
        app: ctx.app,
        operation: ctx.operation,
      });
    }

    // Detect permission errors
    if (isPermissionError(errorMessage)) {
      throw new PermissionError(ctx.app, {
        operation: ctx.operation,
        originalError: errorMessage,
      });
    }

    // Detect app not found errors
    if (isAppNotFoundError(errorMessage)) {
      throw new AppNotFoundError(ctx.app, {
        operation: ctx.operation,
        originalError: errorMessage,
      });
    }

    // Generic execution error
    throw new ScriptExecutionError(errorMessage, {
      app: ctx.app,
      operation: ctx.operation,
      duration,
    });
  }
}

/**
 * Executes a script and returns a structured result with metadata
 */
export async function executeScriptWithResult(
  ctx: ExecutionContext
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const output = await executeScript(ctx);
    const duration = Date.now() - startTime;

    return {
      output,
      duration,
      success: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      output: error instanceof Error ? error.message : String(error),
      duration,
      success: false,
    };
  }
}

/**
 * Tests if an application is accessible (has required permissions)
 *
 * @param appName - Name of the application to test
 * @returns Promise resolving to true if accessible, false otherwise
 */
export async function testAppAccess(appName: string): Promise<boolean> {
  const testScript = `
tell application "${appName}"
  return "success"
end tell
  `.trim();

  try {
    await executeScript({
      script: testScript,
      app: appName,
      operation: 'test_access',
      timeout: 5000,
    });

    logger.info('App access test successful', { app: appName });
    return true;
  } catch (error) {
    logger.warn('App access test failed', {
      app: appName,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Checks if an application is running
 *
 * @param appName - Name of the application
 * @returns Promise resolving to true if running, false otherwise
 */
export async function isAppRunning(appName: string): Promise<boolean> {
  const script = `
tell application "System Events"
  return (name of processes) contains "${appName}"
end tell
  `.trim();

  try {
    const result = await executeScript({
      script,
      app: 'System Events',
      operation: 'check_running',
      timeout: 5000,
      skipValidation: true, // System Events check is safe
    });

    return result.trim() === 'true';
  } catch {
    return false;
  }
}
