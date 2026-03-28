import { z } from 'zod';
export declare const CreateEventInputSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    calendar: z.ZodDefault<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    attendees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allDay: z.ZodDefault<z.ZodBoolean>;
    alerts: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    startDate: string;
    endDate: string;
    calendar: string;
    allDay: boolean;
    notes?: string | undefined;
    location?: string | undefined;
    attendees?: string[] | undefined;
    alerts?: number[] | undefined;
}, {
    title: string;
    startDate: string;
    endDate: string;
    notes?: string | undefined;
    calendar?: string | undefined;
    location?: string | undefined;
    attendees?: string[] | undefined;
    allDay?: boolean | undefined;
    alerts?: number[] | undefined;
}>, {
    title: string;
    startDate: string;
    endDate: string;
    calendar: string;
    allDay: boolean;
    notes?: string | undefined;
    location?: string | undefined;
    attendees?: string[] | undefined;
    alerts?: number[] | undefined;
}, {
    title: string;
    startDate: string;
    endDate: string;
    notes?: string | undefined;
    calendar?: string | undefined;
    location?: string | undefined;
    attendees?: string[] | undefined;
    allDay?: boolean | undefined;
    alerts?: number[] | undefined;
}>;
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
export declare const ListEventsInputSchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
    calendar: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    startDate: string;
    endDate: string;
    calendar?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    limit?: number | undefined;
    calendar?: string | undefined;
}>, {
    limit: number;
    startDate: string;
    endDate: string;
    calendar?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    limit?: number | undefined;
    calendar?: string | undefined;
}>;
export type ListEventsInput = z.infer<typeof ListEventsInputSchema>;
export declare const FindFreeTimeInputSchema: z.ZodEffects<z.ZodObject<{
    date: z.ZodString;
    duration: z.ZodNumber;
    workingHoursStart: z.ZodDefault<z.ZodNumber>;
    workingHoursEnd: z.ZodDefault<z.ZodNumber>;
    calendar: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    duration: number;
    date: string;
    workingHoursStart: number;
    workingHoursEnd: number;
    calendar?: string | undefined;
}, {
    duration: number;
    date: string;
    calendar?: string | undefined;
    workingHoursStart?: number | undefined;
    workingHoursEnd?: number | undefined;
}>, {
    duration: number;
    date: string;
    workingHoursStart: number;
    workingHoursEnd: number;
    calendar?: string | undefined;
}, {
    duration: number;
    date: string;
    calendar?: string | undefined;
    workingHoursStart?: number | undefined;
    workingHoursEnd?: number | undefined;
}>;
export type FindFreeTimeInput = z.infer<typeof FindFreeTimeInputSchema>;
export declare const UpdateEventInputSchema: z.ZodObject<{
    eventId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    eventId: string;
    title?: string | undefined;
    notes?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
}, {
    eventId: string;
    title?: string | undefined;
    notes?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
}>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
export declare const DeleteEventInputSchema: z.ZodEffects<z.ZodObject<{
    eventId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    date?: string | undefined;
    eventId?: string | undefined;
}, {
    title?: string | undefined;
    date?: string | undefined;
    eventId?: string | undefined;
}>, {
    title?: string | undefined;
    date?: string | undefined;
    eventId?: string | undefined;
}, {
    title?: string | undefined;
    date?: string | undefined;
    eventId?: string | undefined;
}>;
export type DeleteEventInput = z.infer<typeof DeleteEventInputSchema>;
//# sourceMappingURL=schemas.d.ts.map