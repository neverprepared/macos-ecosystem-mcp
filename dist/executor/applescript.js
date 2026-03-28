import { runAppleScript } from 'run-applescript';
import { logger } from '../shared/logger.js';
import { MacOSMCPError, PermissionError, AppNotFoundError, ExecutionTimeoutError, ScriptExecutionError, isPermissionError, isAppNotFoundError, } from '../shared/errors.js';
import { validateScript } from './validator.js';
import { timeout } from '../shared/utils.js';
const DEFAULT_TIMEOUT = 30000;
export async function executeScript(ctx) {
    const startTime = Date.now();
    const scriptTimeout = ctx.timeout ?? DEFAULT_TIMEOUT;
    logger.info('Executing AppleScript', {
        app: ctx.app,
        operation: ctx.operation,
        timeout: scriptTimeout,
        scriptLength: ctx.script.length,
    });
    try {
        if (!ctx.skipValidation) {
            validateScript(ctx.script, ctx.app);
        }
        else {
            logger.warn('⚠️  Security validation skipped', { app: ctx.app });
        }
        const result = await timeout(runAppleScript(ctx.script), scriptTimeout, `Script execution timed out after ${scriptTimeout}ms`);
        const duration = Date.now() - startTime;
        logger.info('Script executed successfully', {
            app: ctx.app,
            operation: ctx.operation,
            duration,
            outputLength: result.length,
        });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Script execution failed', {
            app: ctx.app,
            operation: ctx.operation,
            duration,
            error: error instanceof Error ? error.message : String(error),
        });
        if (error instanceof MacOSMCPError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('timed out') || errorMessage.includes('Timeout')) {
            throw new ExecutionTimeoutError(scriptTimeout, {
                app: ctx.app,
                operation: ctx.operation,
            });
        }
        if (isPermissionError(errorMessage)) {
            throw new PermissionError(ctx.app, {
                operation: ctx.operation,
                originalError: errorMessage,
            });
        }
        if (isAppNotFoundError(errorMessage)) {
            throw new AppNotFoundError(ctx.app, {
                operation: ctx.operation,
                originalError: errorMessage,
            });
        }
        throw new ScriptExecutionError(errorMessage, {
            app: ctx.app,
            operation: ctx.operation,
            duration,
        });
    }
}
export async function executeScriptWithResult(ctx) {
    const startTime = Date.now();
    try {
        const output = await executeScript(ctx);
        const duration = Date.now() - startTime;
        return {
            output,
            duration,
            success: true,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        return {
            output: error instanceof Error ? error.message : String(error),
            duration,
            success: false,
        };
    }
}
export async function testAppAccess(appName) {
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
    }
    catch (error) {
        logger.warn('App access test failed', {
            app: appName,
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
export async function isAppRunning(appName) {
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
            skipValidation: true,
        });
        return result.trim() === 'true';
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=applescript.js.map