export interface CalendarEvent {
    id: string;
    title: string;
    calendar: string;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    attendees?: string[];
    allDay: boolean;
    url?: string;
}
export interface CreateEventParams {
    title: string;
    startDate: string;
    endDate: string;
    calendar: string;
    location?: string;
    notes?: string;
    attendees?: string[];
    allDay: boolean;
    alerts?: number[];
}
export interface ListEventsParams {
    startDate: string;
    endDate: string;
    calendar?: string;
    limit: number;
}
export interface FindFreeTimeParams {
    date: string;
    duration: number;
    workingHoursStart: number;
    workingHoursEnd: number;
    calendar?: string;
}
export interface UpdateEventParams {
    eventId: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    notes?: string;
}
export interface DeleteEventParams {
    eventId?: string;
    title?: string;
    date?: string;
}
export interface FreeTimeSlot {
    start: string;
    end: string;
    duration: number;
}
//# sourceMappingURL=types.d.ts.map