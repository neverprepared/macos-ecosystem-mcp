/**
 * AppleScript template generators for Notes app
 */

import { escapeAppleScriptString } from '../../shared/utils.js';
import type {
  CreateNoteParams,
  AppendNoteParams,
  SearchNotesParams,
} from './types.js';

/**
 * Generates script to create a new note
 */
export function generateCreateNoteScript(params: CreateNoteParams): string {
  const sanitizedTitle = escapeAppleScriptString(params.title);
  const sanitizedBody = escapeAppleScriptString(params.body);
  const sanitizedFolder = escapeAppleScriptString(params.folder);

  // In Notes app, the title is the first line, so we combine title + body
  const fullContent = `<h1>${sanitizedTitle}</h1><div>${sanitizedBody}</div>`;

  return `
tell application "Notes"
    set targetFolder to folder "${sanitizedFolder}"
    set newNote to make new note at targetFolder with properties {body:"${fullContent}"}
    return id of newNote & "|" & name of newNote & "|" & name of targetFolder
end tell
  `.trim();
}

/**
 * Generates script to append content to a note
 */
export function generateAppendNoteScript(params: AppendNoteParams): string {
  const sanitizedContent = escapeAppleScriptString(params.content);

  if (params.noteId) {
    // Append by ID (most reliable)
    const sanitizedId = escapeAppleScriptString(params.noteId);

    return `
tell application "Notes"
    set targetNote to note id "${sanitizedId}"
    set currentBody to body of targetNote
    set body of targetNote to currentBody & "<div>${sanitizedContent}</div>"
    return id of targetNote & "|" & name of targetNote
end tell
    `.trim();
  } else {
    // Append by title (with optional folder filter)
    const sanitizedTitle = escapeAppleScriptString(params.title!);

    if (params.folder) {
      const sanitizedFolder = escapeAppleScriptString(params.folder);

      return `
tell application "Notes"
    set targetFolder to folder "${sanitizedFolder}"
    set matchingNotes to (notes of targetFolder whose name is "${sanitizedTitle}")

    if (count of matchingNotes) > 0 then
        set targetNote to item 1 of matchingNotes
        set currentBody to body of targetNote
        set body of targetNote to currentBody & "<div>${sanitizedContent}</div>"
        return id of targetNote & "|" & name of targetNote
    else
        error "No note found with title: ${sanitizedTitle} in folder ${sanitizedFolder}"
    end if
end tell
      `.trim();
    } else {
      return `
tell application "Notes"
    set allFolders to folders
    set folderCount to count of allFolders

    repeat with i from 1 to folderCount
        set fld to item i of allFolders
        set matchingNotes to (notes of fld whose name is "${sanitizedTitle}")

        if (count of matchingNotes) > 0 then
            set targetNote to item 1 of matchingNotes
            set currentBody to body of targetNote
            set body of targetNote to currentBody & "<div>${sanitizedContent}</div>"
            return id of targetNote & "|" & name of targetNote
        end if
    end repeat

    error "No note found with title: ${sanitizedTitle}"
end tell
      `.trim();
    }
  }
}

/**
 * Generates script to search notes
 */
export function generateSearchNotesScript(params: SearchNotesParams): string {
  const sanitizedQuery = escapeAppleScriptString(params.query);

  if (params.folder) {
    const sanitizedFolder = escapeAppleScriptString(params.folder);

    return `
tell application "Notes"
    set targetFolder to folder "${sanitizedFolder}"
    set folderName to name of targetFolder
    set c to count of notes of targetFolder
    set outputList to {}

    if c > 0 then
        set theIds to id of notes of targetFolder
        set theNames to name of notes of targetFolder
        set theBodies to body of notes of targetFolder
        set theCreated to creation date of notes of targetFolder
        set theModified to modification date of notes of targetFolder

        repeat with j from 1 to c
            set noteName to item j of theNames
            set noteBody to item j of theBodies

            -- Check if query appears in name or body
            if (noteName contains "${sanitizedQuery}" or noteBody contains "${sanitizedQuery}") then
                set noteCreated to ""
                try
                    set noteCreated to short date string of (item j of theCreated) & " " & time string of (item j of theCreated)
                end try
                set noteModified to ""
                try
                    set noteModified to short date string of (item j of theModified) & " " & time string of (item j of theModified)
                end try

                -- Get excerpt (first 200 chars of body)
                set excerpt to noteBody
                if (count of excerpt) > 200 then
                    set excerpt to text 1 thru 200 of excerpt
                end if

                set end of outputList to (item j of theIds) & "||" & noteName & "||" & folderName & "||" & excerpt & "||" & noteCreated & "||" & noteModified
            end if
        end repeat
    end if

    set AppleScript's text item delimiters to "\\n"
    set outputText to outputList as text
    set AppleScript's text item delimiters to ""
    return outputText
end tell
    `.trim();
  } else {
    return `
tell application "Notes"
    set allFolders to folders
    set outputList to {}
    set folderCount to count of allFolders

    repeat with i from 1 to folderCount
        set fld to item i of allFolders
        set folderName to name of fld
        set c to count of notes of fld

        if c > 0 then
            set theIds to id of notes of fld
            set theNames to name of notes of fld
            set theBodies to body of notes of fld
            set theCreated to creation date of notes of fld
            set theModified to modification date of notes of fld

            repeat with j from 1 to c
                set noteName to item j of theNames
                set noteBody to item j of theBodies

                -- Check if query appears in name or body
                if (noteName contains "${sanitizedQuery}" or noteBody contains "${sanitizedQuery}") then
                    set noteCreated to ""
                    try
                        set noteCreated to short date string of (item j of theCreated) & " " & time string of (item j of theCreated)
                    end try
                    set noteModified to ""
                    try
                        set noteModified to short date string of (item j of theModified) & " " & time string of (item j of theModified)
                    end try

                    -- Get excerpt (first 200 chars of body)
                    set excerpt to noteBody
                    if (count of excerpt) > 200 then
                        set excerpt to text 1 thru 200 of excerpt
                    end if

                    set end of outputList to (item j of theIds) & "||" & noteName & "||" & folderName & "||" & excerpt & "||" & noteCreated & "||" & noteModified
                end if
            end repeat
        end if
    end repeat

    set AppleScript's text item delimiters to "\\n"
    set outputText to outputList as text
    set AppleScript's text item delimiters to ""
    return outputText
end tell
    `.trim();
  }
}
