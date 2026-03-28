import { SecurityError } from '../shared/errors.js';
import { logger } from '../shared/logger.js';
import { ALLOWED_APPS, FORBIDDEN_PATTERNS } from './types.js';
export function validateScript(script, targetApp) {
    logger.debug('Validating script', { app: targetApp, scriptLength: script.length });
    if (!script || script.trim().length === 0) {
        throw new SecurityError('Script cannot be empty');
    }
    const maxLength = 50000;
    if (script.length > maxLength) {
        throw new SecurityError(`Script exceeds maximum length of ${maxLength} characters`, {
            actualLength: script.length,
        });
    }
    if (!isAllowedApp(targetApp)) {
        throw new SecurityError(`Application "${targetApp}" is not in the allowed list`, {
            app: targetApp,
            allowedApps: ALLOWED_APPS,
        });
    }
    if (!scriptTargetsApp(script, targetApp)) {
        throw new SecurityError(`Script does not target the declared application "${targetApp}"`, {
            app: targetApp,
        });
    }
    const forbiddenMatch = findForbiddenPattern(script);
    if (forbiddenMatch) {
        throw new SecurityError(`Script contains forbidden pattern: "${forbiddenMatch}"`, {
            pattern: forbiddenMatch,
            app: targetApp,
        });
    }
    if (!startsWithTellApplication(script)) {
        throw new SecurityError('Script must start with "tell application" statement', {
            app: targetApp,
        });
    }
    logger.debug('Script validation passed', { app: targetApp });
}
function isAllowedApp(app) {
    return ALLOWED_APPS.includes(app);
}
function scriptTargetsApp(script, targetApp) {
    const tellPattern = /tell\s+application\s+["']([^"']+)["']/gi;
    const matches = script.matchAll(tellPattern);
    for (const match of matches) {
        const declaredApp = match[1];
        if (declaredApp && declaredApp.toLowerCase() === targetApp.toLowerCase()) {
            return true;
        }
    }
    return false;
}
function findForbiddenPattern(script) {
    const lowerScript = script.toLowerCase();
    for (const pattern of FORBIDDEN_PATTERNS) {
        if (lowerScript.includes(pattern.toLowerCase())) {
            return pattern;
        }
    }
    return null;
}
function startsWithTellApplication(script) {
    const trimmed = script.trim();
    const tellPattern = /^tell\s+application\s+["']/i;
    return tellPattern.test(trimmed);
}
export function sanitizeForAppleScript(input) {
    return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
export function validateListName(name) {
    if (!name || name.trim().length === 0) {
        throw new SecurityError('List name cannot be empty');
    }
    if (name.length > 255) {
        throw new SecurityError('List name is too long (max 255 characters)');
    }
    if (/[<>:"|?*\x00-\x1F]/.test(name)) {
        throw new SecurityError('List name contains invalid characters');
    }
}
export function validateCalendarName(name) {
    if (!name || name.trim().length === 0) {
        throw new SecurityError('Calendar name cannot be empty');
    }
    if (name.length > 255) {
        throw new SecurityError('Calendar name is too long (max 255 characters)');
    }
    if (/[<>:"|?*\x00-\x1F]/.test(name)) {
        throw new SecurityError('Calendar name contains invalid characters');
    }
}
export function validateFolderName(name) {
    if (!name || name.trim().length === 0) {
        throw new SecurityError('Folder name cannot be empty');
    }
    if (name.length > 255) {
        throw new SecurityError('Folder name is too long (max 255 characters)');
    }
    if (/[<>:"|?*\x00-\x1F]/.test(name)) {
        throw new SecurityError('Folder name contains invalid characters');
    }
}
//# sourceMappingURL=validator.js.map