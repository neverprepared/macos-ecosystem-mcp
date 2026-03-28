import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare function handleCalendarTool(request: CallToolRequest): Promise<CallToolResult>;
export declare function getCalendarToolDefinitions(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                description: string;
            };
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            calendar: {
                type: string;
                description: string;
                default: string;
            };
            location: {
                type: string;
                description: string;
            };
            notes: {
                type: string;
                description: string;
            };
            attendees: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            allDay: {
                type: string;
                description: string;
                default: boolean;
            };
            alerts: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit?: undefined;
            date?: undefined;
            duration?: undefined;
            workingHoursStart?: undefined;
            workingHoursEnd?: undefined;
            eventId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            calendar: {
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
            location?: undefined;
            notes?: undefined;
            attendees?: undefined;
            allDay?: undefined;
            alerts?: undefined;
            date?: undefined;
            duration?: undefined;
            workingHoursStart?: undefined;
            workingHoursEnd?: undefined;
            eventId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            date: {
                type: string;
                description: string;
            };
            duration: {
                type: string;
                description: string;
            };
            workingHoursStart: {
                type: string;
                description: string;
                default: number;
            };
            workingHoursEnd: {
                type: string;
                description: string;
                default: number;
            };
            calendar: {
                type: string;
                description: string;
                default?: undefined;
            };
            title?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            location?: undefined;
            notes?: undefined;
            attendees?: undefined;
            allDay?: undefined;
            alerts?: undefined;
            limit?: undefined;
            eventId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            eventId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            location: {
                type: string;
                description: string;
            };
            notes: {
                type: string;
                description: string;
            };
            calendar?: undefined;
            attendees?: undefined;
            allDay?: undefined;
            alerts?: undefined;
            limit?: undefined;
            date?: undefined;
            duration?: undefined;
            workingHoursStart?: undefined;
            workingHoursEnd?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            eventId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            date: {
                type: string;
                description: string;
            };
            startDate?: undefined;
            endDate?: undefined;
            calendar?: undefined;
            location?: undefined;
            notes?: undefined;
            attendees?: undefined;
            allDay?: undefined;
            alerts?: undefined;
            limit?: undefined;
            duration?: undefined;
            workingHoursStart?: undefined;
            workingHoursEnd?: undefined;
        };
        required?: undefined;
    };
})[];
//# sourceMappingURL=index.d.ts.map