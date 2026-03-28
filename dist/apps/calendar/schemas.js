import { z } from 'zod';
export const CreateEventInputSchema = z.object({
    title: z
        .string()
        .min(1, 'Title cannot be empty')
        .max(500, 'Title cannot exceed 500 characters'),
    startDate: z.string().datetime('Start date must be in ISO 8601 format'),
    endDate: z.string().datetime('End date must be in ISO 8601 format'),
    calendar: z.string().default('Calendar'),
    location: z.string().max(500).optional(),
    notes: z.string().max(5000).optional(),
    attendees: z.array(z.string().email()).optional(),
    allDay: z.boolean().default(false),
    alerts: z.array(z.number().int().min(0).max(10080)).optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
});
export const ListEventsInputSchema = z.object({
    startDate: z.string().datetime('Start date must be in ISO 8601 format'),
    endDate: z.string().datetime('End date must be in ISO 8601 format'),
    calendar: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be at or after start date',
    path: ['endDate'],
});
export const FindFreeTimeInputSchema = z.object({
    date: z.string().datetime('Date must be in ISO 8601 format'),
    duration: z.number().int().min(15).max(480),
    workingHoursStart: z.number().int().min(0).max(23).default(9),
    workingHoursEnd: z.number().int().min(0).max(23).default(17),
    calendar: z.string().optional(),
}).refine((data) => data.workingHoursEnd > data.workingHoursStart, {
    message: 'Working hours end must be after start',
    path: ['workingHoursEnd'],
});
export const UpdateEventInputSchema = z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    title: z.string().min(1).max(500).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    location: z.string().max(500).optional(),
    notes: z.string().max(5000).optional(),
});
export const DeleteEventInputSchema = z.object({
    eventId: z.string().optional(),
    title: z.string().optional(),
    date: z.string().datetime().optional(),
}).refine((data) => data.eventId || data.title, {
    message: 'Either eventId or title must be provided',
});
//# sourceMappingURL=schemas.js.map