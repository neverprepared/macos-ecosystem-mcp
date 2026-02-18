/**
 * Calendar app MCP tool registrations
 */

import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeScript } from '../../executor/applescript.js';
import { logger } from '../../shared/logger.js';
import {
  CreateEventInputSchema,
  ListEventsInputSchema,
  FindFreeTimeInputSchema,
  UpdateEventInputSchema,
  DeleteEventInputSchema,
} from './schemas.js';
import {
  generateCreateEventScript,
  generateListEventsScript,
  generateFindFreeTimeScript,
  generateUpdateEventScript,
  generateDeleteEventScript,
} from './scripts.js';
import type { CalendarEvent, FreeTimeSlot } from './types.js';

/**
 * Parses calendar event output from AppleScript
 * Format: id||title||start||end||allDay||location||notes||calendar
 */
function parseEventOutput(output: string): CalendarEvent[] {
  const lines = output.trim().split('\\n').filter(Boolean);
  const events: CalendarEvent[] = [];

  for (const line of lines) {
    const parts = line.split('||');
    if (parts.length < 8) continue;

    const [id, title, startDate, endDate, allDayStr, location, notes, calendar] = parts;

    events.push({
      id: id || '',
      title: title || '',
      calendar: calendar || '',
      startDate: startDate || '',
      endDate: endDate || '',
      allDay: allDayStr === 'true',
      location: location || undefined,
      notes: notes || undefined,
    });
  }

  return events;
}

/**
 * Parses free time slot output from AppleScript
 * Format: start||end||durationMinutes
 */
function parseFreeTimeOutput(output: string): FreeTimeSlot[] {
  const lines = output.trim().split('\\n').filter(Boolean);
  const slots: FreeTimeSlot[] = [];

  for (const line of lines) {
    const parts = line.split('||');
    if (parts.length < 3) continue;

    const [start, end, durationStr] = parts;

    slots.push({
      start: start || '',
      end: end || '',
      duration: parseInt(durationStr || '0', 10),
    });
  }

  return slots;
}

/**
 * Handles all Calendar app tool calls
 */
export async function handleCalendarTool(
  request: CallToolRequest
): Promise<CallToolResult> {
  // Tool 1: Create Event
  if (request.params.name === 'calendar_create_event') {
      try {
        const input = CreateEventInputSchema.parse(request.params.arguments);

        logger.info('Creating calendar event', {
          title: input.title,
          calendar: input.calendar,
        });

        const script = generateCreateEventScript({
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          calendar: input.calendar,
          location: input.location,
          notes: input.notes,
          allDay: input.allDay,
          alerts: input.alerts,
        });

        const result = await executeScript({
          script,
          app: 'Calendar',
          operation: 'create_event',
          timeout: 10000,
        });

        const [, title, calendarName] = result.split('|');

        return {
          content: [
            {
              type: 'text',
              text: `✓ Created event "${title}" in calendar "${calendarName}"`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to create event', { error });
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

    // Tool 2: List Events
    if (request.params.name === 'calendar_list_events') {
      try {
        const input = ListEventsInputSchema.parse(request.params.arguments);

        logger.info('Listing calendar events', {
          startDate: input.startDate,
          endDate: input.endDate,
          calendar: input.calendar,
        });

        const script = generateListEventsScript({
          startDate: input.startDate,
          endDate: input.endDate,
          calendar: input.calendar,
          limit: input.limit,
        });

        const result = await executeScript({
          script,
          app: 'Calendar',
          operation: 'list_events',
          timeout: 15000,
        });

        const events = parseEventOutput(result).slice(0, input.limit);

        if (events.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No events found in the specified date range',
              },
            ],
          };
        }

        let output = `Found ${events.length} event(s):\n\n`;
        for (const evt of events) {
          output += `📅 ${evt.title}`;
          if (evt.allDay) output += ' (All Day)';
          output += `\n  When: ${evt.startDate}`;
          if (!evt.allDay) output += ` - ${evt.endDate}`;
          if (evt.location) output += `\n  Location: ${evt.location}`;
          if (evt.notes) output += `\n  Notes: ${evt.notes}`;
          output += `\n  Calendar: ${evt.calendar}`;
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
        logger.error('Failed to list events', { error });
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

    // Tool 3: Find Free Time
    if (request.params.name === 'calendar_find_free_time') {
      try {
        const input = FindFreeTimeInputSchema.parse(request.params.arguments);

        logger.info('Finding free time', {
          date: input.date,
          duration: input.duration,
        });

        const script = generateFindFreeTimeScript({
          date: input.date,
          duration: input.duration,
          workingHoursStart: input.workingHoursStart,
          workingHoursEnd: input.workingHoursEnd,
          calendar: input.calendar,
        });

        const result = await executeScript({
          script,
          app: 'Calendar',
          operation: 'find_free_time',
          timeout: 15000,
        });

        const slots = parseFreeTimeOutput(result);

        if (slots.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No free time slots of ${input.duration} minutes found`,
              },
            ],
          };
        }

        let output = `Found ${slots.length} free time slot(s) of at least ${input.duration} minutes:\n\n`;
        for (const slot of slots) {
          output += `⏰ ${slot.start} - ${slot.end}\n`;
          output += `   Duration: ${Math.floor(slot.duration)} minutes\n\n`;
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
        logger.error('Failed to find free time', { error });
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

    // Tool 4: Update Event
    if (request.params.name === 'calendar_update_event') {
      try {
        const input = UpdateEventInputSchema.parse(request.params.arguments);

        logger.info('Updating calendar event', { eventId: input.eventId });

        const script = generateUpdateEventScript({
          eventId: input.eventId,
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          location: input.location,
          notes: input.notes,
        });

        const result = await executeScript({
          script,
          app: 'Calendar',
          operation: 'update_event',
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
        logger.error('Failed to update event', { error });
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

    // Tool 5: Delete Event
    if (request.params.name === 'calendar_delete_event') {
      try {
        const input = DeleteEventInputSchema.parse(request.params.arguments);

        logger.info('Deleting calendar event', {
          eventId: input.eventId,
          title: input.title,
        });

        const script = generateDeleteEventScript({
          eventId: input.eventId,
          title: input.title,
          date: input.date,
        });

        const result = await executeScript({
          script,
          app: 'Calendar',
          operation: 'delete_event',
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
        logger.error('Failed to delete event', { error });
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
 * Returns tool definitions for Calendar app
 */
export function getCalendarToolDefinitions() {
  return [
    {
      name: 'calendar_create_event',
      description:
        'Create a new event in Apple Calendar. Supports all-day and timed events with optional location, notes, attendees, and alerts.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Event title (1-500 characters)',
          },
          startDate: {
            type: 'string',
            description: 'Start date/time in ISO 8601 format (e.g., "2026-02-18T14:00:00Z")',
          },
          endDate: {
            type: 'string',
            description: 'End date/time in ISO 8601 format',
          },
          calendar: {
            type: 'string',
            description: 'Calendar name (default: "Calendar")',
            default: 'Calendar',
          },
          location: {
            type: 'string',
            description: 'Event location (max 500 characters)',
          },
          notes: {
            type: 'string',
            description: 'Event notes/description (max 5000 characters)',
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of attendee email addresses',
          },
          allDay: {
            type: 'boolean',
            description: 'Whether this is an all-day event (default: false)',
            default: false,
          },
          alerts: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of alert times in minutes before event (e.g., [15, 60] for 15 min and 1 hour)',
          },
        },
        required: ['title', 'startDate', 'endDate'],
      },
    },
    {
      name: 'calendar_list_events',
      description:
        'List calendar events within a date range. Can filter by specific calendar. Returns up to 100 events.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start of date range in ISO 8601 format',
          },
          endDate: {
            type: 'string',
            description: 'End of date range in ISO 8601 format',
          },
          calendar: {
            type: 'string',
            description: 'Optional calendar name to filter by',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of events to return (1-100, default: 50)',
            default: 50,
          },
        },
        required: ['startDate', 'endDate'],
      },
    },
    {
      name: 'calendar_find_free_time',
      description:
        'Find available time slots in your calendar for scheduling meetings. Analyzes existing events and returns free gaps.',
      inputSchema: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Target date to analyze in ISO 8601 format',
          },
          duration: {
            type: 'number',
            description: 'Required duration in minutes (15-480)',
          },
          workingHoursStart: {
            type: 'number',
            description: 'Start of working hours (0-23, default: 9)',
            default: 9,
          },
          workingHoursEnd: {
            type: 'number',
            description: 'End of working hours (0-23, default: 17)',
            default: 17,
          },
          calendar: {
            type: 'string',
            description: 'Optional calendar name to analyze',
          },
        },
        required: ['date', 'duration'],
      },
    },
    {
      name: 'calendar_update_event',
      description:
        'Update an existing calendar event. Can modify title, dates, location, or notes.',
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'Event UID to update',
          },
          title: {
            type: 'string',
            description: 'New event title',
          },
          startDate: {
            type: 'string',
            description: 'New start date/time in ISO 8601 format',
          },
          endDate: {
            type: 'string',
            description: 'New end date/time in ISO 8601 format',
          },
          location: {
            type: 'string',
            description: 'New location',
          },
          notes: {
            type: 'string',
            description: 'New notes/description',
          },
        },
        required: ['eventId'],
      },
    },
    {
      name: 'calendar_delete_event',
      description:
        'Delete a calendar event. Can find by event ID (most reliable) or by title with optional date filter.',
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'Event UID to delete (most reliable)',
          },
          title: {
            type: 'string',
            description: 'Event title to search for (alternative to eventId)',
          },
          date: {
            type: 'string',
            description: 'Optional date filter when using title search (ISO 8601)',
          },
        },
      },
    },
  ];
}
