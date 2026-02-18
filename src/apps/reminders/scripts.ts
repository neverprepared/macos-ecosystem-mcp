/**
 * AppleScript template generators for Reminders app
 */

import {
  escapeAppleScriptString,
  formatAppleScriptDate,
  parseISODate,
  priorityToAppleScript,
} from '../../shared/utils.js';
import type {
  AddReminderParams,
  ListRemindersParams,
  CompleteReminderParams,
  SearchRemindersParams,
} from './types.js';

/**
 * Generates script to add a new reminder
 */
export function generateAddReminderScript(params: AddReminderParams): string {
  const sanitizedTitle = escapeAppleScriptString(params.title);
  const sanitizedList = escapeAppleScriptString(params.list);
  const priorityValue = priorityToAppleScript(params.priority);

  let script = `
tell application "Reminders"
    set targetList to list "${sanitizedList}"
    set newReminder to make new reminder at end of targetList
    set name of newReminder to "${sanitizedTitle}"
    set priority of newReminder to ${priorityValue}
    set flagged of newReminder to ${params.flagged}
`;

  // Add optional notes
  if (params.notes) {
    const sanitizedNotes = escapeAppleScriptString(params.notes);
    script += `    set body of newReminder to "${sanitizedNotes}"\n`;
  }

  // Add optional due date
  if (params.dueDate) {
    const date = parseISODate(params.dueDate);
    const appleScriptDate = formatAppleScriptDate(date);
    script += `    set due date of newReminder to date "${appleScriptDate}"\n`;
  }

  script += `
    return id of newReminder & "|" & name of newReminder & "|" & name of targetList
end tell
  `;

  return script.trim();
}

/**
 * Generates script to list reminders
 */
export function generateListRemindersScript(params: ListRemindersParams): string {
  const completedFilter = params.includeCompleted ? '' : 'whose completed is false';

  let script = '';

  if (params.list) {
    const sanitizedList = escapeAppleScriptString(params.list);
    script = `
tell application "Reminders"
    set targetList to list "${sanitizedList}"
    set allReminders to reminders of targetList ${completedFilter}
    set output to ""

    repeat with r in allReminders
        set reminderId to id of r
        set reminderName to name of r
        set reminderCompleted to completed of r
        set reminderPriority to priority of r
        set reminderFlagged to flagged of r

        set reminderNotes to ""
        try
            set reminderNotes to body of r
        end try

        set reminderDueDate to ""
        try
            if due date of r is not missing value then
                set reminderDueDate to due date of r as string
            end if
        end try

        set output to output & reminderId & "||" & reminderName & "||" & reminderCompleted & "||" & reminderPriority & "||" & reminderFlagged & "||" & reminderNotes & "||" & reminderDueDate & "||" & name of targetList & "\\n"
    end repeat

    return output
end tell
    `;
  } else {
    script = `
tell application "Reminders"
    set allLists to lists
    set output to ""

    repeat with lst in allLists
        set allReminders to reminders of lst ${completedFilter}

        repeat with r in allReminders
            set reminderId to id of r
            set reminderName to name of r
            set reminderCompleted to completed of r
            set reminderPriority to priority of r
            set reminderFlagged to flagged of r

            set reminderNotes to ""
            try
                set reminderNotes to body of r
            end try

            set reminderDueDate to ""
            try
                if due date of r is not missing value then
                    set reminderDueDate to due date of r as string
                end if
            end try

            set output to output & reminderId & "||" & reminderName & "||" & reminderCompleted & "||" & reminderPriority & "||" & reminderFlagged & "||" & reminderNotes & "||" & reminderDueDate & "||" & name of lst & "\\n"
        end repeat
    end repeat

    return output
end tell
    `;
  }

  return script.trim();
}

/**
 * Generates script to complete a reminder
 */
export function generateCompleteReminderScript(params: CompleteReminderParams): string {
  if (params.reminderId) {
    // Complete by ID (more reliable)
    const sanitizedId = escapeAppleScriptString(params.reminderId);
    return `
tell application "Reminders"
    set targetReminder to reminder id "${sanitizedId}"
    set completed of targetReminder to true
    return "Completed: " & name of targetReminder
end tell
    `.trim();
  } else {
    // Complete by title (with optional list filter)
    const sanitizedTitle = escapeAppleScriptString(params.title!);

    if (params.list) {
      const sanitizedList = escapeAppleScriptString(params.list);
      return `
tell application "Reminders"
    set targetList to list "${sanitizedList}"
    set matchingReminders to (reminders of targetList whose name is "${sanitizedTitle}" and completed is false)

    if (count of matchingReminders) > 0 then
        set targetReminder to item 1 of matchingReminders
        set completed of targetReminder to true
        return "Completed: " & name of targetReminder & " in " & name of targetList
    else
        error "No incomplete reminder found with title: ${sanitizedTitle}"
    end if
end tell
      `.trim();
    } else {
      return `
tell application "Reminders"
    set allLists to lists
    set found to false

    repeat with lst in allLists
        set matchingReminders to (reminders of lst whose name is "${sanitizedTitle}" and completed is false)

        if (count of matchingReminders) > 0 then
            set targetReminder to item 1 of matchingReminders
            set completed of targetReminder to true
            set found to true
            return "Completed: " & name of targetReminder & " in " & name of lst
            exit repeat
        end if
    end repeat

    if not found then
        error "No incomplete reminder found with title: ${sanitizedTitle}"
    end if
end tell
      `.trim();
    }
  }
}

/**
 * Generates script to search reminders
 */
export function generateSearchRemindersScript(params: SearchRemindersParams): string {
  const sanitizedQuery = escapeAppleScriptString(params.query);
  const completedFilter = params.includeCompleted ? '' : 'and completed is false';

  if (params.list) {
    const sanitizedList = escapeAppleScriptString(params.list);
    return `
tell application "Reminders"
    set targetList to list "${sanitizedList}"
    set allReminders to reminders of targetList
    set output to ""

    repeat with r in allReminders
        set reminderName to name of r
        set reminderNotes to ""
        try
            set reminderNotes to body of r
        end try

        -- Check if query appears in name or notes
        if (reminderName contains "${sanitizedQuery}" or reminderNotes contains "${sanitizedQuery}") ${completedFilter} then
            set reminderId to id of r
            set reminderCompleted to completed of r
            set reminderPriority to priority of r
            set reminderFlagged to flagged of r

            set reminderDueDate to ""
            try
                if due date of r is not missing value then
                    set reminderDueDate to due date of r as string
                end if
            end try

            set output to output & reminderId & "||" & reminderName & "||" & reminderCompleted & "||" & reminderPriority & "||" & reminderFlagged & "||" & reminderNotes & "||" & reminderDueDate & "||" & name of targetList & "\\n"
        end if
    end repeat

    return output
end tell
    `.trim();
  } else {
    return `
tell application "Reminders"
    set allLists to lists
    set output to ""

    repeat with lst in allLists
        set allReminders to reminders of lst

        repeat with r in allReminders
            set reminderName to name of r
            set reminderNotes to ""
            try
                set reminderNotes to body of r
            end try

            -- Check if query appears in name or notes
            if (reminderName contains "${sanitizedQuery}" or reminderNotes contains "${sanitizedQuery}") ${completedFilter} then
                set reminderId to id of r
                set reminderCompleted to completed of r
                set reminderPriority to priority of r
                set reminderFlagged to flagged of r

                set reminderDueDate to ""
                try
                    if due date of r is not missing value then
                        set reminderDueDate to due date of r as string
                    end if
                end try

                set output to output & reminderId & "||" & reminderName & "||" & reminderCompleted & "||" & reminderPriority & "||" & reminderFlagged & "||" & reminderNotes & "||" & reminderDueDate & "||" & name of lst & "\\n"
            end if
        end repeat
    end repeat

    return output
end tell
    `.trim();
  }
}
