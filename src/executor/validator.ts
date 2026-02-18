/**
 * Security validation for AppleScript execution
 *
 * This module implements multi-layer security validation to prevent:
 * - Arbitrary code execution via shell scripts
 * - Targeting unauthorized applications
 * - File system manipulation
 * - Privilege escalation
 * - Keystroke injection attacks
 */

import { SecurityError } from '../shared/errors.js';
import { logger } from '../shared/logger.js';
import { ALLOWED_APPS, FORBIDDEN_PATTERNS, type AllowedApp } from './types.js';

/**
 * Validates that the script is safe to execute
 *
 * @throws {SecurityError} If validation fails
 */
export function validateScript(script: string, targetApp: string): void {
  logger.debug('Validating script', { app: targetApp, scriptLength: script.length });

  // Layer 1: Script must not be empty
  if (!script || script.trim().length === 0) {
    throw new SecurityError('Script cannot be empty');
  }

  // Layer 2: Script must not be excessively long (prevent DoS)
  const maxLength = 50000; // 50KB
  if (script.length > maxLength) {
    throw new SecurityError(`Script exceeds maximum length of ${maxLength} characters`, {
      actualLength: script.length,
    });
  }

  // Layer 3: Target app must be in whitelist
  if (!isAllowedApp(targetApp)) {
    throw new SecurityError(`Application "${targetApp}" is not in the allowed list`, {
      app: targetApp,
      allowedApps: ALLOWED_APPS,
    });
  }

  // Layer 4: Script must target the declared application
  if (!scriptTargetsApp(script, targetApp)) {
    throw new SecurityError(
      `Script does not target the declared application "${targetApp}"`,
      {
        app: targetApp,
      }
    );
  }

  // Layer 5: Check for forbidden patterns
  const forbiddenMatch = findForbiddenPattern(script);
  if (forbiddenMatch) {
    throw new SecurityError(
      `Script contains forbidden pattern: "${forbiddenMatch}"`,
      {
        pattern: forbiddenMatch,
        app: targetApp,
      }
    );
  }

  // Layer 6: Ensure script starts with "tell application"
  if (!startsWithTellApplication(script)) {
    throw new SecurityError(
      'Script must start with "tell application" statement',
      {
        app: targetApp,
      }
    );
  }

  logger.debug('Script validation passed', { app: targetApp });
}

/**
 * Checks if an app name is in the allowed list
 */
function isAllowedApp(app: string): app is AllowedApp {
  return ALLOWED_APPS.includes(app as AllowedApp);
}

/**
 * Checks if script targets the declared application
 */
function scriptTargetsApp(script: string, targetApp: string): boolean {
  // Match: tell application "AppName" or tell application 'AppName'
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

/**
 * Finds forbidden patterns in the script
 * Returns the first forbidden pattern found, or null if none
 */
function findForbiddenPattern(script: string): string | null {
  const lowerScript = script.toLowerCase();

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (lowerScript.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }

  return null;
}

/**
 * Checks if script starts with a "tell application" statement
 */
function startsWithTellApplication(script: string): boolean {
  const trimmed = script.trim();
  const tellPattern = /^tell\s+application\s+["']/i;
  return tellPattern.test(trimmed);
}

/**
 * Sanitizes user input for use in AppleScript strings
 * This is a helper for script generation, not validation
 */
export function sanitizeForAppleScript(input: string): string {
  // Escape backslashes first, then quotes
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Validates that a list name is safe
 */
export function validateListName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new SecurityError('List name cannot be empty');
  }

  if (name.length > 255) {
    throw new SecurityError('List name is too long (max 255 characters)');
  }

  // Check for suspicious characters
  if (/[<>:"|?*\x00-\x1F]/.test(name)) {
    throw new SecurityError('List name contains invalid characters');
  }
}

/**
 * Validates that a calendar name is safe
 */
export function validateCalendarName(name: string): void {
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

/**
 * Validates that a notes folder name is safe
 */
export function validateFolderName(name: string): void {
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
