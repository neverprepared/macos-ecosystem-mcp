import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare function handleNotesTool(request: CallToolRequest): Promise<CallToolResult>;
export declare function getNotesToolDefinitions(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            folder: {
                type: string;
                description: string;
                default: string;
            };
            noteId?: undefined;
            content?: undefined;
            query?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            noteId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            folder: {
                type: string;
                description: string;
                default?: undefined;
            };
            content: {
                type: string;
                description: string;
            };
            body?: undefined;
            query?: undefined;
            limit?: undefined;
        };
        required: string[];
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
            folder: {
                type: string;
                description: string;
                default?: undefined;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            title?: undefined;
            body?: undefined;
            noteId?: undefined;
            content?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=index.d.ts.map