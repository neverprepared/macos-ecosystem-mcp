import { format } from 'date-fns';
export function escapeAppleScriptString(input) {
    return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
export function formatAppleScriptDate(date) {
    return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm:ss a');
}
export function parseISODate(isoString) {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${isoString}`);
    }
    return date;
}
export function truncate(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - 3) + '...';
}
export function priorityToAppleScript(priority) {
    const priorityMap = {
        none: 0,
        low: 1,
        medium: 5,
        high: 9,
    };
    return priorityMap[priority] ?? 0;
}
export function appleScriptToPriority(value) {
    if (value >= 9)
        return 'high';
    if (value >= 5)
        return 'medium';
    if (value >= 1)
        return 'low';
    return 'none';
}
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function retry(fn, options = {}) {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffMultiplier = 2, } = options;
    let lastError;
    let currentDelay = initialDelay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                await delay(Math.min(currentDelay, maxDelay));
                currentDelay *= backoffMultiplier;
            }
        }
    }
    throw lastError;
}
export function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
export function timeout(promise, ms, errorMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage ?? `Timeout after ${ms}ms`)), ms)),
    ]);
}
//# sourceMappingURL=utils.js.map