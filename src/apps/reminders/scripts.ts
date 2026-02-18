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
 * Helper to generate the batch property fetch + assembly block for a single list.
 * Uses inline batch property access to avoid 'repeat with r in reminders' which
 * hangs when osascript is launched from Node.js child_process.
 */
function generateBatchFetchBlock(
  listRef: string,
  listNameExpr: string,
  completedFilter: string,
  indent: string
): string {
  const filter = completedFilter ? ` ${completedFilter}` : '';
  const remRef = `reminders of ${listRef}${filter}`;
  return `${indent}set c to count of (${remRef})
${indent}if c > 0 then
${indent}    set theIds to id of ${remRef}
${indent}    set theNames to name of ${remRef}
${indent}    set theCompleted to completed of ${remRef}
${indent}    set thePriorities to priority of ${remRef}
${indent}    set theFlagged to flagged of ${remRef}
${indent}    set theBodies to body of ${remRef}
${indent}    set theDueDates to due date of ${remRef}
${indent}    set listName to ${listNameExpr}
${indent}    repeat with j from 1 to c
${indent}        set reminderDueDate to ""
${indent}        set d to item j of theDueDates
${indent}        if d is not missing value then
${indent}            set reminderDueDate to short date string of d & " " & time string of d
${indent}        end if
${indent}        set reminderNotes to item j of theBodies
${indent}        if reminderNotes is missing value then set reminderNotes to ""
${indent}        set end of outputList to (item j of theIds) & "||" & (item j of theNames) & "||" & (item j of theCompleted) & "||" & (item j of thePriorities) & "||" & (item j of theFlagged) & "||" & reminderNotes & "||" & reminderDueDate & "||" & listName
${indent}    end repeat
${indent}end if`;
}

/**
 * Generates script to list reminders
 */
export function generateListRemindersScript(params: ListRemindersParams): string {
  const completedFilter = params.includeCompleted ? '' : 'whose completed is false';

  let script = '';

  if (params.list) {
    const sanitizedList = escapeAppleScriptString(params.list);
    const fetchBlock = generateBatchFetchBlock(
      `targetList`,
      'name of targetList',
      completedFilter,
      '    '
    );
    script = `
tell application "Reminders"
    set targetList to list "${sanitizedList}"
    set outputList to {}
${fetchBlock}
    set AppleScript's text item delimiters to "\\n"
    set outputText to outputList as text
    set AppleScript's text item delimiters to ""
    return outputText
end tell
    `;
  } else {
    const fetchBlock = generateBatchFetchBlock(
      'lst',
      'name of lst',
      completedFilter,
      '        '
    );
    script = `
tell application "Reminders"
    set allLists to lists
    set outputList to {}
    set listCount to count of allLists
    repeat with i from 1 to listCount
        set lst to item i of allLists
${fetchBlock}
    end repeat
    set AppleScript's text item delimiters to "\\n"
    set outputText to outputList as text
    set AppleScript's text item delimiters to ""
    return outputText
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
    set listCount to count of allLists

    repeat with i from 1 to listCount
        set lst to item i of allLists
        set matchingReminders to (reminders of lst whose name is "${sanitizedTitle}" and completed is false)

        if (count of matchingReminders) > 0 then
            set targetReminder to item 1 of matchingReminders
            set completed of targetReminder to true
            return "Completed: " & name of targetReminder & " in " & name of lst
        end if
    end repeat

    error "No incomplete reminder found with title: ${sanitizedTitle}"
end tell
      `.trim();
    }
  }
}

/**
 * Helper to generate a search block for a single list using batch property access.
 * Fetches names and bodies in batch, filters by query match using index-based loop,
 * then fetches remaining properties for matching reminders.
 */
function generateSearchBlock(
  listRef: string,
  listNameExpr: string,
  sanitizedQuery: string,
  completedFilter: string,
  indent: string
): string {
  // For search, we need to fetch names/bodies to check matches, then get full details for matches.
  // We use 'whose name contains' filter when possible to reduce the dataset from AppleScript side.
  // Since body search can't be done via 'whose', we fetch all and filter in the loop.
  const filter = completedFilter ? ` ${completedFilter}` : '';
  const remRef = `reminders of ${listRef}${filter}`;
  return `${indent}set c to count of (${remRef})
${indent}if c > 0 then
${indent}    set theIds to id of ${remRef}
${indent}    set theNames to name of ${remRef}
${indent}    set theCompleted to completed of ${remRef}
${indent}    set thePriorities to priority of ${remRef}
${indent}    set theFlagged to flagged of ${remRef}
${indent}    set theBodies to body of ${remRef}
${indent}    set theDueDates to due date of ${remRef}
${indent}    set listName to ${listNameExpr}
${indent}    repeat with j from 1 to c
${indent}        set reminderName to item j of theNames
${indent}        set reminderNotes to item j of theBodies
${indent}        if reminderNotes is missing value then set reminderNotes to ""
${indent}        if (reminderName contains "${sanitizedQuery}" or reminderNotes contains "${sanitizedQuery}") then
${indent}            set reminderDueDate to ""
${indent}            set d to item j of theDueDates
${indent}            if d is not missing value then
${indent}                set reminderDueDate to short date string of d & " " & time string of d
${indent}            end if
${indent}            set end of outputList to (item j of theIds) & "||" & reminderName & "||" & (item j of theCompleted) & "||" & (item j of thePriorities) & "||" & (item j of theFlagged) & "||" & reminderNotes & "||" & reminderDueDate & "||" & listName
${indent}        end if
${indent}    end repeat
${indent}end if`;
}

/**
 * Generates script to search reminders
 */
export function generateSearchRemindersScript(params: SearchRemindersParams): string {
  const sanitizedQuery = escapeAppleScriptString(params.query);
  // For search, we apply the completed filter at the query level (not as an additional condition)
  const completedFilter = params.includeCompleted ? '' : 'whose completed is false';

  if (params.list) {
    const sanitizedList = escapeAppleScriptString(params.list);
    const searchBlock = generateSearchBlock(
      'targetList',
      'name of targetList',
      sanitizedQuery,
      completedFilter,
      '    '
    );
    return `
tell application "Reminders"
    set targetList to list "${sanitizedList}"
    set outputList to {}
${searchBlock}
    set AppleScript's text item delimiters to "\\n"
    set outputText to outputList as text
    set AppleScript's text item delimiters to ""
    return outputText
end tell
    `.trim();
  } else {
    const searchBlock = generateSearchBlock(
      'lst',
      'name of lst',
      sanitizedQuery,
      completedFilter,
      '        '
    );
    return `
tell application "Reminders"
    set allLists to lists
    set outputList to {}
    set listCount to count of allLists
    repeat with i from 1 to listCount
        set lst to item i of allLists
${searchBlock}
    end repeat
    set AppleScript's text item delimiters to "\\n"
    set outputText to outputList as text
    set AppleScript's text item delimiters to ""
    return outputText
end tell
    `.trim();
  }
}
