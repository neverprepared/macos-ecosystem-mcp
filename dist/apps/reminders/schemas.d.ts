import { z } from 'zod';
export declare const ReminderPrioritySchema: z.ZodEnum<["none", "low", "medium", "high"]>;
export declare const AddReminderInputSchema: z.ZodObject<{
    title: z.ZodString;
    list: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["none", "low", "medium", "high"]>>;
    flagged: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    list: string;
    priority: "none" | "low" | "medium" | "high";
    flagged: boolean;
    notes?: string | undefined;
    dueDate?: string | undefined;
}, {
    title: string;
    list?: string | undefined;
    notes?: string | undefined;
    dueDate?: string | undefined;
    priority?: "none" | "low" | "medium" | "high" | undefined;
    flagged?: boolean | undefined;
}>;
export type AddReminderInput = z.infer<typeof AddReminderInputSchema>;
export declare const ListRemindersInputSchema: z.ZodObject<{
    list: z.ZodOptional<z.ZodString>;
    includeCompleted: z.ZodDefault<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    includeCompleted: boolean;
    limit: number;
    list?: string | undefined;
}, {
    list?: string | undefined;
    includeCompleted?: boolean | undefined;
    limit?: number | undefined;
}>;
export type ListRemindersInput = z.infer<typeof ListRemindersInputSchema>;
export declare const CompleteReminderInputSchema: z.ZodEffects<z.ZodObject<{
    reminderId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    list: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    list?: string | undefined;
    reminderId?: string | undefined;
}, {
    title?: string | undefined;
    list?: string | undefined;
    reminderId?: string | undefined;
}>, {
    title?: string | undefined;
    list?: string | undefined;
    reminderId?: string | undefined;
}, {
    title?: string | undefined;
    list?: string | undefined;
    reminderId?: string | undefined;
}>;
export type CompleteReminderInput = z.infer<typeof CompleteReminderInputSchema>;
export declare const SearchRemindersInputSchema: z.ZodObject<{
    query: z.ZodString;
    list: z.ZodOptional<z.ZodString>;
    includeCompleted: z.ZodDefault<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    includeCompleted: boolean;
    limit: number;
    query: string;
    list?: string | undefined;
}, {
    query: string;
    list?: string | undefined;
    includeCompleted?: boolean | undefined;
    limit?: number | undefined;
}>;
export type SearchRemindersInput = z.infer<typeof SearchRemindersInputSchema>;
//# sourceMappingURL=schemas.d.ts.map