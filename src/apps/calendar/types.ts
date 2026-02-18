/**
 * TypeScript types for Calendar app tools
 */

export interface CalendarEvent {
  id: string;
  title: string;
  calendar: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  location?: string;
  notes?: string;
  attendees?: string[]; // Email addresses
  allDay: boolean;
  url?: string;
}

export interface CreateEventParams {
  title: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  calendar: string;
  location?: string;
  notes?: string;
  attendees?: string[]; // Email addresses
  allDay: boolean;
  alerts?: number[]; // Minutes before event
}

export interface ListEventsParams {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  calendar?: string;
  limit: number;
}

export interface FindFreeTimeParams {
  date: string; // ISO 8601 date
  duration: number; // Minutes
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
  calendar?: string;
}

export interface UpdateEventParams {
  eventId: string;
  title?: string;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  location?: string;
  notes?: string;
}

export interface DeleteEventParams {
  eventId?: string;
  title?: string;
  date?: string; // ISO 8601 for narrowing search
}

export interface FreeTimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  duration: number; // Minutes
}
