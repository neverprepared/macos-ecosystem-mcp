/**
 * Zod validation schemas for Reminders app tools
 */

import { z } from 'zod';

/**
 * Priority enum for reminders
 */
export const ReminderPrioritySchema = z.enum(['none', 'low', 'medium', 'high']);

/**
 * Schema for adding a new reminder
 */
export const AddReminderInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(500, 'Title cannot exceed 500 characters'),
  list: z.string().default('Reminders'),
  notes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional(),
  dueDate: z.string().datetime().optional(),
  priority: ReminderPrioritySchema.default('none'),
  flagged: z.boolean().default(false),
});

export type AddReminderInput = z.infer<typeof AddReminderInputSchema>;

/**
 * Schema for listing reminders
 */
export const ListRemindersInputSchema = z.object({
  list: z.string().optional(),
  includeCompleted: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListRemindersInput = z.infer<typeof ListRemindersInputSchema>;

/**
 * Schema for completing a reminder
 */
export const CompleteReminderInputSchema = z.object({
  reminderId: z.string().optional(),
  title: z.string().optional(),
  list: z.string().optional(),
}).refine(
  (data) => data.reminderId || data.title,
  {
    message: 'Either reminderId or title must be provided',
  }
);

export type CompleteReminderInput = z.infer<typeof CompleteReminderInputSchema>;

/**
 * Schema for searching reminders
 */
export const SearchRemindersInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  list: z.string().optional(),
  includeCompleted: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchRemindersInput = z.infer<typeof SearchRemindersInputSchema>;
