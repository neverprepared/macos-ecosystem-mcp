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
    set found to false

    repeat with fld in allFolders
        set matchingNotes to (notes of fld whose name is "${sanitizedTitle}")

        if (count of matchingNotes) > 0 then
            set targetNote to item 1 of matchingNotes
            set currentBody to body of targetNote
            set body of targetNote to currentBody & "<div>${sanitizedContent}</div>"
            set found to true
            return id of targetNote & "|" & name of targetNote
            exit repeat
        end if
    end repeat

    if not found then
        error "No note found with title: ${sanitizedTitle}"
    end if
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
    set allNotes to notes of targetFolder
    set output to ""

    repeat with n in allNotes
        set noteName to name of n
        set noteBody to body of n

        -- Check if query appears in name or body
        if (noteName contains "${sanitizedQuery}" or noteBody contains "${sanitizedQuery}") then
            set noteId to id of n
            set noteCreated to ""
            try
                set noteCreated to creation date of n as string
            end try

            set noteModified to ""
            try
                set noteModified to modification date of n as string
            end try

            -- Get excerpt (first 200 chars of body, stripped of HTML)
            set excerpt to text 1 thru (count of noteBody) of noteBody
            if (count of excerpt) > 200 then
                set excerpt to text 1 thru 200 of excerpt
            end if

            set output to output & noteId & "||" & noteName & "||" & name of targetFolder & "||" & excerpt & "||" & noteCreated & "||" & noteModified & "\\n"
        end if
    end repeat

    return output
end tell
    `.trim();
  } else {
    return `
tell application "Notes"
    set allFolders to folders
    set output to ""

    repeat with fld in allFolders
        set allNotes to notes of fld

        repeat with n in allNotes
            set noteName to name of n
            set noteBody to body of n

            -- Check if query appears in name or body
            if (noteName contains "${sanitizedQuery}" or noteBody contains "${sanitizedQuery}") then
                set noteId to id of n
                set noteCreated to ""
                try
                    set noteCreated to creation date of n as string
                end try

                set noteModified to ""
                try
                    set noteModified to modification date of n as string
                end try

                -- Get excerpt (first 200 chars of body, stripped of HTML)
                set excerpt to text 1 thru (count of noteBody) of noteBody
                if (count of excerpt) > 200 then
                    set excerpt to text 1 thru 200 of excerpt
                end if

                set output to output & noteId & "||" & noteName & "||" & name of fld & "||" & excerpt & "||" & noteCreated & "||" & noteModified & "\\n"
            end if
        end repeat
    end repeat

    return output
end tell
    `.trim();
  }
}
