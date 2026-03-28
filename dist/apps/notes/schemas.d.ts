import { z } from 'zod';
export declare const CreateNoteInputSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    folder: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    body: string;
    folder: string;
}, {
    title: string;
    body: string;
    folder?: string | undefined;
}>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export declare const AppendNoteInputSchema: z.ZodEffects<z.ZodObject<{
    noteId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    folder: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    title?: string | undefined;
    folder?: string | undefined;
    noteId?: string | undefined;
}, {
    content: string;
    title?: string | undefined;
    folder?: string | undefined;
    noteId?: string | undefined;
}>, {
    content: string;
    title?: string | undefined;
    folder?: string | undefined;
    noteId?: string | undefined;
}, {
    content: string;
    title?: string | undefined;
    folder?: string | undefined;
    noteId?: string | undefined;
}>;
export type AppendNoteInput = z.infer<typeof AppendNoteInputSchema>;
export declare const SearchNotesInputSchema: z.ZodObject<{
    query: z.ZodString;
    folder: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    folder?: string | undefined;
}, {
    query: string;
    limit?: number | undefined;
    folder?: string | undefined;
}>;
export type SearchNotesInput = z.infer<typeof SearchNotesInputSchema>;
//# sourceMappingURL=schemas.d.ts.map