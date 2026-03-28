export interface ExecutionContext {
    script: string;
    app: string;
    operation: string;
    timeout?: number;
    skipValidation?: boolean;
}
export interface ExecutionResult {
    output: string;
    duration: number;
    success: boolean;
}
export interface ExecutorOptions {
    defaultTimeout?: number;
    enableValidation?: boolean;
    maxScriptLength?: number;
}
export declare const ALLOWED_APPS: readonly ["Reminders", "Calendar", "Notes", "Mail", "Messages", "Safari", "Music", "Photos", "Shortcuts", "Contacts", "Finder"];
export type AllowedApp = (typeof ALLOWED_APPS)[number];
export declare const FORBIDDEN_PATTERNS: readonly ["do shell script", "sudo", "rm -rf", "delete file", "delete folder", "System Events", "keystroke", "key code", "administrator privileges", "with administrator", "curl", "wget", "python", "ruby", "perl", "bash", "zsh", "sh -c"];
//# sourceMappingURL=types.d.ts.map