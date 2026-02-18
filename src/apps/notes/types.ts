/**
 * TypeScript types for Notes app tools
 */

export interface Note {
  id: string;
  title: string; // First line of the note
  folder: string;
  body: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface CreateNoteParams {
  title: string;
  body: string;
  folder: string;
}

export interface AppendNoteParams {
  noteId?: string;
  title?: string;
  folder?: string;
  content: string;
}

export interface SearchNotesParams {
  query: string;
  folder?: string;
  limit: number;
}
