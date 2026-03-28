import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare function handleRemindersTool(request: CallToolRequest): Promise<CallToolResult>;
export declare function getRemindersToolDefinitions(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                description: string;
            };
            list: {
                type: string;
                description: string;
                default: string;
            };
            notes: {
                type: string;
                description: string;
            };
            dueDate: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            flagged: {
                type: string;
                description: string;
                default: boolean;
            };
            includeCompleted?: undefined;
            limit?: undefined;
            reminderId?: undefined;
            query?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            list: {
                type: string;
                description: string;
                default?: undefined;
            };
            includeCompleted: {
                type: string;
                description: string;
                default: boolean;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            title?: undefined;
            notes?: undefined;
            dueDate?: undefined;
            priority?: undefined;
            flagged?: undefined;
            reminderId?: undefined;
            query?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            reminderId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            list: {
                type: string;
                description: string;
                default?: undefined;
            };
            notes?: undefined;
            dueDate?: undefined;
            priority?: undefined;
            flagged?: undefined;
            includeCompleted?: undefined;
            limit?: undefined;
            query?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            list: {
                type: string;
                description: string;
                default?: undefined;
            };
            includeCompleted: {
                type: string;
                description: string;
                default: boolean;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            title?: undefined;
            notes?: undefined;
            dueDate?: undefined;
            priority?: undefined;
            flagged?: undefined;
            reminderId?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=index.d.ts.map