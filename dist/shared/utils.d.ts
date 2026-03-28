export declare function escapeAppleScriptString(input: string): string;
export declare function formatAppleScriptDate(date: Date): string;
export declare function parseISODate(isoString: string): Date;
export declare function truncate(str: string, maxLength: number): string;
export declare function priorityToAppleScript(priority: 'none' | 'low' | 'medium' | 'high'): number;
export declare function appleScriptToPriority(value: number): 'none' | 'low' | 'medium' | 'high';
export declare function delay(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
}): Promise<T>;
export declare function isNonEmptyString(value: unknown): value is string;
export declare function safeJsonParse<T>(json: string, fallback: T): T;
export declare function timeout<T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T>;
//# sourceMappingURL=utils.d.ts.map