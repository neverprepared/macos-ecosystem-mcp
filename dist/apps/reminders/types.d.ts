export type ReminderPriority = 'none' | 'low' | 'medium' | 'high';
export interface Reminder {
    id: string;
    title: string;
    list: string;
    completed: boolean;
    priority: ReminderPriority;
    notes?: string;
    dueDate?: string;
    flagged: boolean;
    createdDate?: string;
    completionDate?: string;
}
export interface AddReminderParams {
    title: string;
    list: string;
    notes?: string;
    dueDate?: string;
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
//# sourceMappingURL=types.d.ts.map