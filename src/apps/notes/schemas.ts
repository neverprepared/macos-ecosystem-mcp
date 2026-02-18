/**
 * Zod validation schemas for Notes app tools
 */

import { z } from 'zod';

/**
 * Schema for creating a note
 */
export const CreateNoteInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(500, 'Title cannot exceed 500 characters'),
  body: z
    .string()
    .max(100000, 'Body cannot exceed 100,000 characters'),
  folder: z.string().default('Notes'),
});

export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;

/**
 * Schema for appending to a note
 */
export const AppendNoteInputSchema = z.object({
  noteId: z.string().optional(),
  title: z.string().optional(),
  folder: z.string().optional(),
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(100000, 'Content cannot exceed 100,000 characters'),
}).refine(
  (data) => data.noteId || data.title,
  {
    message: 'Either noteId or title must be provided',
  }
);

export type AppendNoteInput = z.infer<typeof AppendNoteInputSchema>;

/**
 * Schema for searching notes
 */
export const SearchNotesInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  folder: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchNotesInput = z.infer<typeof SearchNotesInputSchema>;
