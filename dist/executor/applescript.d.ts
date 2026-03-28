import type { ExecutionContext, ExecutionResult } from './types.js';
export declare function executeScript(ctx: ExecutionContext): Promise<string>;
export declare function executeScriptWithResult(ctx: ExecutionContext): Promise<ExecutionResult>;
export declare function testAppAccess(appName: string): Promise<boolean>;
export declare function isAppRunning(appName: string): Promise<boolean>;
//# sourceMappingURL=applescript.d.ts.map