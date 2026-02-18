#!/usr/bin/env node

/**
 * CLI entry point for macOS Ecosystem MCP Server
 */

import { config } from 'dotenv';
import { startServer } from './server.js';
import { logger } from './shared/logger.js';

// Load environment variables
config();

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    logger.info('Initializing macOS Ecosystem MCP Server');

    // Log environment configuration
    logger.debug('Configuration', {
      logLevel: process.env['LOG_LEVEL'] || 'info',
      scriptTimeout: process.env['SCRIPT_TIMEOUT'] || '30000',
      securityValidation: process.env['ENABLE_SECURITY_VALIDATION'] !== 'false',
    });

    // Start the server
    await startServer();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    process.exit(1);
  }
}

// Run main function
main();
