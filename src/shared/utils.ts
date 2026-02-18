/**
 * Shared utility functions for macOS MCP Server
 */

import { format } from 'date-fns';

/**
 * Escapes double quotes in strings for AppleScript
 * Example: 'Task with "quotes"' -> 'Task with \"quotes\"'
 */
export function escapeAppleScriptString(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Formats a JavaScript Date object as an AppleScript date string
 * AppleScript format: "Tuesday, January 24, 2023 at 2:30:00 PM"
 */
export function formatAppleScriptDate(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm:ss a');
}

/**
 * Parses an ISO 8601 date string to a Date object
 * Validates the date is valid before returning
 */
export function parseISODate(isoString: string): Date {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${isoString}`);
  }

  return date;
}

/**
 * Safely truncates a string to a maximum length
 * Adds ellipsis if truncated
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Converts priority string to AppleScript priority value
 * none: 0, low: 1, medium: 5, high: 9
 */
export function priorityToAppleScript(priority: 'none' | 'low' | 'medium' | 'high'): number {
  const priorityMap: Record<string, number> = {
    none: 0,
    low: 1,
    medium: 5,
    high: 9,
  };

  return priorityMap[priority] ?? 0;
}

/**
 * Converts AppleScript priority value to string
 */
export function appleScriptToPriority(value: number): 'none' | 'low' | 'medium' | 'high' {
  if (value >= 9) return 'high';
  if (value >= 5) return 'medium';
  if (value >= 1) return 'low';
  return 'none';
}

/**
 * Delays execution for the specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | undefined;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        await delay(Math.min(currentDelay, maxDelay));
        currentDelay *= backoffMultiplier;
      }
    }
  }

  throw lastError;
}

/**
 * Checks if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Creates a timeout promise that rejects after specified ms
 */
export function timeout<T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage ?? `Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
