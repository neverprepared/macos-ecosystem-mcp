#!/usr/bin/env node
import { config } from 'dotenv';
import { startServer } from './server.js';
import { logger } from './shared/logger.js';
config();
async function main() {
    try {
        logger.info('Initializing macOS Ecosystem MCP Server');
        logger.debug('Configuration', {
            logLevel: process.env['LOG_LEVEL'] || 'info',
            scriptTimeout: process.env['SCRIPT_TIMEOUT'] || '30000',
            securityValidation: process.env['ENABLE_SECURITY_VALIDATION'] !== 'false',
        });
        await startServer();
    }
    catch (error) {
        logger.error('Failed to start server', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map