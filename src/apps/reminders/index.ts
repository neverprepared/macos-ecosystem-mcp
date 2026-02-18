/**
 * Reminders app MCP tool registrations
 */

import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeScript } from '../../executor/applescript.js';
import { logger } from '../../shared/logger.js';
import { appleScriptToPriority } from '../../shared/utils.js';
import {
  AddReminderInputSchema,
  ListRemindersInputSchema,
  CompleteReminderInputSchema,
  SearchRemindersInputSchema,
} from './schemas.js';
import {
  generateAddReminderScript,
  generateListRemindersScript,
  generateCompleteReminderScript,
  generateSearchRemindersScript,
} from './scripts.js';
import type { Reminder } from './types.js';

/**
 * Parses reminder output from AppleScript
 * Format: id||name||completed||priority||flagged||notes||dueDate||listName
 */
function parseReminderOutput(output: string): Reminder[] {
  const lines = output.trim().split('\\n').filter(Boolean);
  const reminders: Reminder[] = [];

  for (const line of lines) {
    const parts = line.split('||');
    if (parts.length < 8) continue;

    const [id, title, completedStr, priorityStr, flaggedStr, notes, dueDate, list] = parts;

    reminders.push({
      id: id || '',
      title: title || '',
      list: list || '',
      completed: completedStr === 'true',
      priority: appleScriptToPriority(parseInt(priorityStr || '0', 10)),
      flagged: flaggedStr === 'true',
      notes: notes || undefined,
      dueDate: dueDate || undefined,
    });
  }

  return reminders;
}

/**
 * Handles all Reminders app tool calls
 */
export async function handleRemindersTool(
  request: CallToolRequest
): Promise<CallToolResult> {
  // Tool 1: Add Reminder
  if (request.params.name === 'reminders_add') {
    try {
      const input = AddReminderInputSchema.parse(request.params.arguments);

        logger.info('Adding reminder', { title: input.title, list: input.list });

        const script = generateAddReminderScript({
          title: input.title,
          list: input.list,
          notes: input.notes,
          dueDate: input.dueDate,
          priority: input.priority,
          flagged: input.flagged,
        });

        const result = await executeScript({
          script,
          app: 'Reminders',
          operation: 'add',
          timeout: 10000,
        });

        // Parse result: id|title|listName
        const [, title, listName] = result.split('|');

        return {
          content: [
            {
              type: 'text',
              text: `✓ Created reminder "${title}" in list "${listName}"`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to add reminder', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    // Tool 2: List Reminders
    if (request.params.name === 'reminders_list') {
      try {
        const input = ListRemindersInputSchema.parse(request.params.arguments);

        logger.info('Listing reminders', { list: input.list, limit: input.limit });

        const script = generateListRemindersScript({
          list: input.list,
          includeCompleted: input.includeCompleted,
          limit: input.limit,
        });

        const result = await executeScript({
          script,
          app: 'Reminders',
          operation: 'list',
          timeout: 15000,
        });

        const reminders = parseReminderOutput(result).slice(0, input.limit);

        if (reminders.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No reminders found',
              },
            ],
          };
        }

        // Format output
        let output = `Found ${reminders.length} reminder(s):\n\n`;
        for (const r of reminders) {
          output += `• ${r.completed ? '✓' : '○'} ${r.title}`;
          if (r.flagged) output += ' 🚩';
          if (r.priority !== 'none') output += ` [${r.priority}]`;
          if (r.dueDate) output += ` (Due: ${r.dueDate})`;
          output += `\n  List: ${r.list}`;
          if (r.notes) output += `\n  Notes: ${r.notes}`;
          output += '\n\n';
        }

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to list reminders', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    // Tool 3: Complete Reminder
    if (request.params.name === 'reminders_complete') {
      try {
        const input = CompleteReminderInputSchema.parse(request.params.arguments);

        logger.info('Completing reminder', {
          reminderId: input.reminderId,
          title: input.title,
        });

        const script = generateCompleteReminderScript({
          reminderId: input.reminderId,
          title: input.title,
          list: input.list,
        });

        const result = await executeScript({
          script,
          app: 'Reminders',
          operation: 'complete',
          timeout: 10000,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✓ ${result}`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to complete reminder', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    // Tool 4: Search Reminders
    if (request.params.name === 'reminders_search') {
      try {
        const input = SearchRemindersInputSchema.parse(request.params.arguments);

        logger.info('Searching reminders', { query: input.query });

        const script = generateSearchRemindersScript({
          query: input.query,
          list: input.list,
          includeCompleted: input.includeCompleted,
          limit: input.limit,
        });

        const result = await executeScript({
          script,
          app: 'Reminders',
          operation: 'search',
          timeout: 15000,
        });

        const reminders = parseReminderOutput(result).slice(0, input.limit);

        if (reminders.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No reminders found matching "${input.query}"`,
              },
            ],
          };
        }

        // Format output
        let output = `Found ${reminders.length} reminder(s) matching "${input.query}":\n\n`;
        for (const r of reminders) {
          output += `• ${r.completed ? '✓' : '○'} ${r.title}`;
          if (r.flagged) output += ' 🚩';
          if (r.priority !== 'none') output += ` [${r.priority}]`;
          if (r.dueDate) output += ` (Due: ${r.dueDate})`;
          output += `\n  List: ${r.list}`;
          if (r.notes) output += `\n  Notes: ${r.notes}`;
          output += '\n\n';
        }

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to search reminders', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

  // If we get here, the tool wasn't handled
  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
    isError: true,
  };
}

/**
 * Returns tool definitions for Reminders app
 */
export function getRemindersToolDefinitions() {
  return [
    {
      name: 'reminders_add',
      description:
        'Create a new reminder in Apple Reminders app. Supports title, list, notes, due date, priority (none/low/medium/high), and flagged status.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The reminder title (1-500 characters)',
          },
          list: {
            type: 'string',
            description: 'The list name to add the reminder to (default: "Reminders")',
            default: 'Reminders',
          },
          notes: {
            type: 'string',
            description: 'Optional notes/description for the reminder (max 5000 characters)',
          },
          dueDate: {
            type: 'string',
            description: 'Optional due date in ISO 8601 format (e.g., "2026-02-18T14:00:00Z")',
          },
          priority: {
            type: 'string',
            enum: ['none', 'low', 'medium', 'high'],
            description: 'Priority level (default: "none")',
            default: 'none',
          },
          flagged: {
            type: 'boolean',
            description: 'Whether to flag the reminder (default: false)',
            default: false,
          },
        },
        required: ['title'],
      },
    },
    {
      name: 'reminders_list',
      description:
        'List reminders from Apple Reminders app with optional filtering by list name and completion status. Returns up to 100 reminders.',
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'Optional list name to filter by. If not specified, shows all lists.',
          },
          includeCompleted: {
            type: 'boolean',
            description: 'Whether to include completed reminders (default: false)',
            default: false,
          },
          limit: {
            type: 'number',
            description: 'Maximum number of reminders to return (1-100, default: 50)',
            default: 50,
          },
        },
      },
    },
    {
      name: 'reminders_complete',
      description:
        'Mark a reminder as completed. Can find by reminder ID (most reliable) or by title with optional list filter.',
      inputSchema: {
        type: 'object',
        properties: {
          reminderId: {
            type: 'string',
            description: 'The reminder ID (most reliable method)',
          },
          title: {
            type: 'string',
            description: 'The reminder title to search for (alternative to reminderId)',
          },
          list: {
            type: 'string',
            description: 'Optional list name to narrow search when using title',
          },
        },
      },
    },
    {
      name: 'reminders_search',
      description:
        'Search reminders by keyword in title or notes. Supports filtering by list and completion status.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to match in reminder title or notes',
          },
          list: {
            type: 'string',
            description: 'Optional list name to filter search results',
          },
          includeCompleted: {
            type: 'boolean',
            description: 'Whether to include completed reminders (default: false)',
            default: false,
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (1-100, default: 20)',
            default: 20,
          },
        },
        required: ['query'],
      },
    },
  ];
}
