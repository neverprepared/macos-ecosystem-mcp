/**
 * Notes app MCP tool registrations
 */

import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeScript } from '../../executor/applescript.js';
import { logger } from '../../shared/logger.js';
import { truncate } from '../../shared/utils.js';
import {
  CreateNoteInputSchema,
  AppendNoteInputSchema,
  SearchNotesInputSchema,
} from './schemas.js';
import {
  generateCreateNoteScript,
  generateAppendNoteScript,
  generateSearchNotesScript,
} from './scripts.js';
import type { Note } from './types.js';

/**
 * Parses note search output from AppleScript
 * Format: id||name||folder||excerpt||created||modified
 */
function parseNoteOutput(output: string): Note[] {
  const lines = output.trim().split('\\n').filter(Boolean);
  const notes: Note[] = [];

  for (const line of lines) {
    const parts = line.split('||');
    if (parts.length < 6) continue;

    const [id, title, folder, body, createdDate, modifiedDate] = parts;

    notes.push({
      id: id || '',
      title: title || '',
      folder: folder || '',
      body: body || '',
      createdDate: createdDate || undefined,
      modifiedDate: modifiedDate || undefined,
    });
  }

  return notes;
}

/**
 * Strips HTML tags from Notes app HTML content
 */
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&') // Replace &amp;
    .replace(/&lt;/g, '<') // Replace &lt;
    .replace(/&gt;/g, '>') // Replace &gt;
    .trim();
}

/**
 * Handles all Notes app tool calls
 */
export async function handleNotesTool(
  request: CallToolRequest
): Promise<CallToolResult> {
  // Tool 1: Create Note
  if (request.params.name === 'notes_create') {
      try {
        const input = CreateNoteInputSchema.parse(request.params.arguments);

        logger.info('Creating note', { title: input.title, folder: input.folder });

        const script = generateCreateNoteScript({
          title: input.title,
          body: input.body,
          folder: input.folder,
        });

        const result = await executeScript({
          script,
          app: 'Notes',
          operation: 'create',
          timeout: 10000,
        });

        const [, title, folder] = result.split('|');

        return {
          content: [
            {
              type: 'text',
              text: `✓ Created note "${title}" in folder "${folder}"`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to create note', { error });
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

    // Tool 2: Append to Note
    if (request.params.name === 'notes_append') {
      try {
        const input = AppendNoteInputSchema.parse(request.params.arguments);

        logger.info('Appending to note', {
          noteId: input.noteId,
          title: input.title,
        });

        const script = generateAppendNoteScript({
          noteId: input.noteId,
          title: input.title,
          folder: input.folder,
          content: input.content,
        });

        const result = await executeScript({
          script,
          app: 'Notes',
          operation: 'append',
          timeout: 10000,
        });

        const [, title] = result.split('|');

        return {
          content: [
            {
              type: 'text',
              text: `✓ Appended content to note "${title}"`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to append to note', { error });
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

    // Tool 3: Search Notes
    if (request.params.name === 'notes_search') {
      try {
        const input = SearchNotesInputSchema.parse(request.params.arguments);

        logger.info('Searching notes', { query: input.query });

        const script = generateSearchNotesScript({
          query: input.query,
          folder: input.folder,
          limit: input.limit,
        });

        const result = await executeScript({
          script,
          app: 'Notes',
          operation: 'search',
          timeout: 15000,
        });

        const notes = parseNoteOutput(result).slice(0, input.limit);

        if (notes.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No notes found matching "${input.query}"`,
              },
            ],
          };
        }

        let output = `Found ${notes.length} note(s) matching "${input.query}":\n\n`;
        for (const note of notes) {
          output += `📝 ${note.title}\n`;
          output += `   Folder: ${note.folder}\n`;

          // Show excerpt (cleaned up)
          const cleanExcerpt = stripHTML(note.body);
          output += `   Excerpt: ${truncate(cleanExcerpt, 150)}\n`;

          if (note.modifiedDate) {
            output += `   Modified: ${note.modifiedDate}\n`;
          }

          output += '\n';
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
        logger.error('Failed to search notes', { error });
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
 * Returns tool definitions for Notes app
 */
export function getNotesToolDefinitions() {
  return [
    {
      name: 'notes_create',
      description:
        'Create a new note in Apple Notes app with title and body content. Supports HTML formatting in the body.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Note title (1-500 characters)',
          },
          body: {
            type: 'string',
            description: 'Note body content (max 100,000 characters). Can include HTML formatting.',
          },
          folder: {
            type: 'string',
            description: 'Folder name to create the note in (default: "Notes")',
            default: 'Notes',
          },
        },
        required: ['title', 'body'],
      },
    },
    {
      name: 'notes_append',
      description:
        'Append content to an existing note. Can find by note ID (most reliable) or by title with optional folder filter.',
      inputSchema: {
        type: 'object',
        properties: {
          noteId: {
            type: 'string',
            description: 'Note ID to append to (most reliable)',
          },
          title: {
            type: 'string',
            description: 'Note title to search for (alternative to noteId)',
          },
          folder: {
            type: 'string',
            description: 'Optional folder name to narrow search when using title',
          },
          content: {
            type: 'string',
            description: 'Content to append (max 100,000 characters). Can include HTML.',
          },
        },
        required: ['content'],
      },
    },
    {
      name: 'notes_search',
      description:
        'Search notes by keyword in title or body. Supports filtering by folder. Returns up to 100 notes with excerpts.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to match in note title or body',
          },
          folder: {
            type: 'string',
            description: 'Optional folder name to filter search results',
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
