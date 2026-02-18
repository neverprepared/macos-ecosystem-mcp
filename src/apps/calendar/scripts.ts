/**
 * AppleScript template generators for Calendar app
 */

import {
  escapeAppleScriptString,
  formatAppleScriptDate,
  parseISODate,
} from '../../shared/utils.js';
import type {
  CreateEventParams,
  ListEventsParams,
  FindFreeTimeParams,
  UpdateEventParams,
  DeleteEventParams,
} from './types.js';

/**
 * Generates script to create a calendar event
 */
export function generateCreateEventScript(params: CreateEventParams): string {
  const sanitizedTitle = escapeAppleScriptString(params.title);
  const sanitizedCalendar = escapeAppleScriptString(params.calendar);

  const startDate = parseISODate(params.startDate);
  const endDate = parseISODate(params.endDate);

  const appleStartDate = formatAppleScriptDate(startDate);
  const appleEndDate = formatAppleScriptDate(endDate);

  let script = `
tell application "Calendar"
    set targetCalendar to calendar "${sanitizedCalendar}"
    set newEvent to make new event at end of events of targetCalendar
    set summary of newEvent to "${sanitizedTitle}"
    set start date of newEvent to date "${appleStartDate}"
    set end date of newEvent to date "${appleEndDate}"
    set allday event of newEvent to ${params.allDay}
`;

  // Add optional location
  if (params.location) {
    const sanitizedLocation = escapeAppleScriptString(params.location);
    script += `    set location of newEvent to "${sanitizedLocation}"\n`;
  }

  // Add optional notes
  if (params.notes) {
    const sanitizedNotes = escapeAppleScriptString(params.notes);
    script += `    set description of newEvent to "${sanitizedNotes}"\n`;
  }

  // Add alerts
  if (params.alerts && params.alerts.length > 0) {
    for (const minutes of params.alerts) {
      script += `    make new sound alarm at end of sound alarms of newEvent with properties {trigger interval:-${minutes}}\n`;
    }
  }

  script += `
    return uid of newEvent & "|" & summary of newEvent & "|" & name of targetCalendar
end tell
  `;

  return script.trim();
}

/**
 * Generates script to list calendar events
 */
export function generateListEventsScript(params: ListEventsParams): string {
  const startDate = parseISODate(params.startDate);
  const endDate = parseISODate(params.endDate);

  const appleStartDate = formatAppleScriptDate(startDate);
  const appleEndDate = formatAppleScriptDate(endDate);

  if (params.calendar) {
    const sanitizedCalendar = escapeAppleScriptString(params.calendar);
    return `
tell application "Calendar"
    set targetCalendar to calendar "${sanitizedCalendar}"
    set startDate to date "${appleStartDate}"
    set endDate to date "${appleEndDate}"

    set eventList to (events of targetCalendar whose start date ≥ startDate and start date ≤ endDate)
    set output to ""

    repeat with evt in eventList
        set eventId to uid of evt
        set eventTitle to summary of evt
        set eventStart to start date of evt as string
        set eventEnd to end date of evt as string
        set eventAllDay to allday event of evt

        set eventLocation to ""
        try
            set eventLocation to location of evt
        end try

        set eventNotes to ""
        try
            set eventNotes to description of evt
        end try

        set output to output & eventId & "||" & eventTitle & "||" & eventStart & "||" & eventEnd & "||" & eventAllDay & "||" & eventLocation & "||" & eventNotes & "||" & name of targetCalendar & "\\n"
    end repeat

    return output
end tell
    `.trim();
  } else {
    return `
tell application "Calendar"
    set startDate to date "${appleStartDate}"
    set endDate to date "${appleEndDate}"
    set allCalendars to calendars
    set output to ""

    repeat with cal in allCalendars
        set eventList to (events of cal whose start date ≥ startDate and start date ≤ endDate)

        repeat with evt in eventList
            set eventId to uid of evt
            set eventTitle to summary of evt
            set eventStart to start date of evt as string
            set eventEnd to end date of evt as string
            set eventAllDay to allday event of evt

            set eventLocation to ""
            try
                set eventLocation to location of evt
            end try

            set eventNotes to ""
            try
                set eventNotes to description of evt
            end try

            set output to output & eventId & "||" & eventTitle & "||" & eventStart & "||" & eventEnd & "||" & eventAllDay & "||" & eventLocation & "||" & eventNotes & "||" & name of cal & "\\n"
        end repeat
    end repeat

    return output
end tell
    `.trim();
  }
}

/**
 * Generates script to find free time slots
 */
export function generateFindFreeTimeScript(params: FindFreeTimeParams): string {
  const targetDate = parseISODate(params.date);

  // Create start and end of working day
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  const workStart = new Date(year, month, day, params.workingHoursStart, 0, 0);
  const workEnd = new Date(year, month, day, params.workingHoursEnd, 0, 0);

  const appleWorkStart = formatAppleScriptDate(workStart);
  const appleWorkEnd = formatAppleScriptDate(workEnd);

  const calendarFilter = params.calendar
    ? `calendar "${escapeAppleScriptString(params.calendar)}"`
    : 'calendars';

  return `
tell application "Calendar"
    set workStart to date "${appleWorkStart}"
    set workEnd to date "${appleWorkEnd}"
    set requiredDuration to ${params.duration}

    -- Get events for the day
    set dayEvents to (events of ${calendarFilter} whose start date ≥ workStart and start date < workEnd)

    -- Sort events by start time (simple bubble sort)
    set sortedEvents to {}
    repeat with evt in dayEvents
        set end of sortedEvents to {start date of evt, end date of evt}
    end repeat

    -- Find gaps between events
    set output to ""
    set currentTime to workStart

    repeat with eventPair in sortedEvents
        set eventStart to item 1 of eventPair
        set eventEnd to item 2 of eventPair

        -- Calculate gap before this event
        set gapMinutes to (eventStart - currentTime) / 60

        if gapMinutes ≥ requiredDuration then
            set output to output & (currentTime as string) & "||" & (eventStart as string) & "||" & gapMinutes & "\\n"
        end if

        -- Move current time to end of this event
        if eventEnd > currentTime then
            set currentTime to eventEnd
        end if
    end repeat

    -- Check final gap until end of working day
    set finalGapMinutes to (workEnd - currentTime) / 60
    if finalGapMinutes ≥ requiredDuration then
        set output to output & (currentTime as string) & "||" & (workEnd as string) & "||" & finalGapMinutes & "\\n"
    end if

    return output
end tell
  `.trim();
}

/**
 * Generates script to update a calendar event
 */
export function generateUpdateEventScript(params: UpdateEventParams): string {
  const sanitizedEventId = escapeAppleScriptString(params.eventId);

  let script = `
tell application "Calendar"
    set targetEvent to first event whose uid is "${sanitizedEventId}"
`;

  if (params.title) {
    const sanitizedTitle = escapeAppleScriptString(params.title);
    script += `    set summary of targetEvent to "${sanitizedTitle}"\n`;
  }

  if (params.startDate) {
    const startDate = parseISODate(params.startDate);
    const appleStartDate = formatAppleScriptDate(startDate);
    script += `    set start date of targetEvent to date "${appleStartDate}"\n`;
  }

  if (params.endDate) {
    const endDate = parseISODate(params.endDate);
    const appleEndDate = formatAppleScriptDate(endDate);
    script += `    set end date of targetEvent to date "${appleEndDate}"\n`;
  }

  if (params.location !== undefined) {
    const sanitizedLocation = escapeAppleScriptString(params.location);
    script += `    set location of targetEvent to "${sanitizedLocation}"\n`;
  }

  if (params.notes !== undefined) {
    const sanitizedNotes = escapeAppleScriptString(params.notes);
    script += `    set description of targetEvent to "${sanitizedNotes}"\n`;
  }

  script += `
    return "Updated: " & summary of targetEvent
end tell
  `;

  return script.trim();
}

/**
 * Generates script to delete a calendar event
 */
export function generateDeleteEventScript(params: DeleteEventParams): string {
  if (params.eventId) {
    const sanitizedEventId = escapeAppleScriptString(params.eventId);
    return `
tell application "Calendar"
    set targetEvent to first event whose uid is "${sanitizedEventId}"
    set eventTitle to summary of targetEvent
    delete targetEvent
    return "Deleted: " & eventTitle
end tell
    `.trim();
  } else {
    // Delete by title with optional date filter
    const sanitizedTitle = escapeAppleScriptString(params.title!);

    if (params.date) {
      const date = parseISODate(params.date);
      const appleDate = formatAppleScriptDate(date);

      return `
tell application "Calendar"
    set targetDate to date "${appleDate}"
    set matchingEvents to (events whose summary is "${sanitizedTitle}" and start date contains targetDate)

    if (count of matchingEvents) > 0 then
        set targetEvent to item 1 of matchingEvents
        set eventTitle to summary of targetEvent
        delete targetEvent
        return "Deleted: " & eventTitle
    else
        error "No event found with title: ${sanitizedTitle} on specified date"
    end if
end tell
      `.trim();
    } else {
      return `
tell application "Calendar"
    set matchingEvents to (events whose summary is "${sanitizedTitle}")

    if (count of matchingEvents) > 0 then
        set targetEvent to item 1 of matchingEvents
        set eventTitle to summary of targetEvent
        delete targetEvent
        return "Deleted: " & eventTitle
    else
        error "No event found with title: ${sanitizedTitle}"
    end if
end tell
      `.trim();
    }
  }
}
