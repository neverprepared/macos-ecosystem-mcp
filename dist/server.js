import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { logger } from './shared/logger.js';
import { handleRemindersTool, getRemindersToolDefinitions, } from './apps/reminders/index.js';
import { handleCalendarTool, getCalendarToolDefinitions, } from './apps/calendar/index.js';
import { handleNotesTool, getNotesToolDefinitions, } from './apps/notes/index.js';
const SERVER_INFO = {
    name: 'macos-ecosystem-mcp',
    version: '0.1.0',
    description: 'Secure, semantic MCP server for macOS application ecosystem (Reminders, Calendar, Notes)',
};
export async function startServer() {
    logger.info('Starting macOS Ecosystem MCP Server', {
        version: SERVER_INFO.version,
    });
    const server = new Server({
        name: SERVER_INFO.name,
        version: SERVER_INFO.version,
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        logger.debug('Listing available tools');
        const allTools = [
            ...getRemindersToolDefinitions(),
            ...getCalendarToolDefinitions(),
            ...getNotesToolDefinitions(),
        ];
        logger.debug('Registered tools', { count: allTools.length });
        return {
            tools: allTools,
        };
    });
    logger.info('Registering app tools');
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params.name;
        logger.debug('Tool call received', { tool: toolName });
        if (toolName.startsWith('reminders_')) {
            return handleRemindersTool(request);
        }
        else if (toolName.startsWith('calendar_')) {
            return handleCalendarTool(request);
        }
        else if (toolName.startsWith('notes_')) {
            return handleNotesTool(request);
        }
        logger.warn('Unknown tool requested', { tool: toolName });
        return {
            content: [
                {
                    type: 'text',
                    text: `Unknown tool: ${toolName}`,
                },
            ],
            isError: true,
        };
    });
    logger.info('All tools registered successfully', { totalTools: 12 });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Server connected and ready', {
        transport: 'stdio',
        tools: 12,
    });
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully');
        await server.close();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully');
        await server.close();
        process.exit(0);
    });
}
//# sourceMappingURL=server.js.map