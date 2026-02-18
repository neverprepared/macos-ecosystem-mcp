/**
 * TypeScript types for Reminders app tools
 */

export type ReminderPriority = 'none' | 'low' | 'medium' | 'high';

export interface Reminder {
  id: string;
  title: string;
  list: string;
  completed: boolean;
  priority: ReminderPriority;
  notes?: string;
  dueDate?: string; // ISO 8601
  flagged: boolean;
  createdDate?: string; // ISO 8601
  completionDate?: string; // ISO 8601
}

export interface AddReminderParams {
  title: string;
  list: string;
  notes?: string;
  dueDate?: string; // ISO 8601
  priority: ReminderPriority;
  flagged: boolean;
}

export interface ListRemindersParams {
  list?: string;
  includeCompleted: boolean;
  limit: number;
}

export interface CompleteReminderParams {
  reminderId?: string;
  title?: string;
  list?: string;
}

export interface SearchRemindersParams {
  query: string;
  list?: string;
  includeCompleted: boolean;
  limit: number;
}
