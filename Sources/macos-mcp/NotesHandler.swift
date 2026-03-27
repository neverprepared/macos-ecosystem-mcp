import MCP
import Foundation

/// Notes operations are implemented via `osascript` because Notes.framework is private.
/// Scripts are piped to osascript via stdin to avoid shell-escaping issues.
enum NotesHandler {

    // MARK: - Tool handlers

    static func createNote(args: [String: Value]) async throws -> String {
        guard let title = args["title"]?.stringValue, !title.isEmpty else {
            throw notesError("'title' is required")
        }
        guard let body = args["body"]?.stringValue else {
            throw notesError("'body' is required")
        }
        let folder = args["folder"]?.stringValue ?? "Notes"

        let safeTitle  = escapeAppleScript(title)
        let safeBody   = escapeAppleScript(body)
        let safeFolder = escapeAppleScript(folder)

        // The first line of a note's body becomes its title in Notes.
        let content = "<h1>\(safeTitle)</h1><div>\(safeBody)</div>"

        let script = """
tell application "Notes"
    set targetFolder to folder "\(safeFolder)"
    set newNote to make new note at targetFolder with properties {body:"\(content)"}
    return id of newNote & "|" & name of newNote & "|" & name of targetFolder
end tell
"""
        let result = try await runAppleScript(script)
        let parts  = result.split(separator: "|", maxSplits: 2).map(String.init)
        let noteId   = parts.count > 0 ? parts[0] : "?"
        let noteName = parts.count > 1 ? parts[1] : title
        let folName  = parts.count > 2 ? parts[2] : folder
        return "✓ Created note \"\(noteName)\" in folder \"\(folName)\"\n  ID: \(noteId)"
    }

    static func appendNote(args: [String: Value]) async throws -> String {
        guard let content = args["content"]?.stringValue, !content.isEmpty else {
            throw notesError("'content' is required")
        }
        let noteId   = args["noteId"]?.stringValue
        let titleArg = args["title"]?.stringValue
        let folderArg = args["folder"]?.stringValue

        guard noteId != nil || titleArg != nil else {
            throw notesError("Either 'noteId' or 'title' must be provided")
        }

        let safeContent = escapeAppleScript(content)
        let script: String

        if let nid = noteId {
            let safeId = escapeAppleScript(nid)
            script = """
tell application "Notes"
    set targetNote to note id "\(safeId)"
    set currentBody to body of targetNote
    set body of targetNote to currentBody & "<div>\(safeContent)</div>"
    return id of targetNote & "|" & name of targetNote
end tell
"""
        } else {
            let safeTitle = escapeAppleScript(titleArg!)
            if let folder = folderArg {
                let safeFolder = escapeAppleScript(folder)
                script = """
tell application "Notes"
    set targetFolder to folder "\(safeFolder)"
    set matchingNotes to (notes of targetFolder whose name is "\(safeTitle)")
    if (count of matchingNotes) > 0 then
        set targetNote to item 1 of matchingNotes
        set currentBody to body of targetNote
        set body of targetNote to currentBody & "<div>\(safeContent)</div>"
        return id of targetNote & "|" & name of targetNote
    else
        error "No note found with title: \(safeTitle) in folder \(safeFolder)"
    end if
end tell
"""
            } else {
                script = """
tell application "Notes"
    set allFolders to folders
    set found to false
    repeat with fld in allFolders
        set matchingNotes to (notes of fld whose name is "\(safeTitle)")
        if (count of matchingNotes) > 0 then
            set targetNote to item 1 of matchingNotes
            set currentBody to body of targetNote
            set body of targetNote to currentBody & "<div>\(safeContent)</div>"
            set found to true
            return id of targetNote & "|" & name of targetNote
            exit repeat
        end if
    end repeat
    if not found then
        error "No note found with title: \(safeTitle)"
    end if
end tell
"""
            }
        }

        let result = try await runAppleScript(script)
        let parts  = result.split(separator: "|", maxSplits: 1).map(String.init)
        let noteName = parts.count > 1 ? parts[1] : (titleArg ?? "note")
        return "✓ Appended content to note \"\(noteName)\""
    }

    static func searchNotes(args: [String: Value]) async throws -> String {
        guard let query = args["query"]?.stringValue, !query.isEmpty else {
            throw notesError("'query' is required")
        }
        let folderArg = args["folder"]?.stringValue
        let limit     = args["limit"].asInt ?? 20

        let safeQuery = escapeAppleScript(query)
        let script: String

        if let folder = folderArg {
            let safeFolder = escapeAppleScript(folder)
            script = """
tell application "Notes"
    set targetFolder to folder "\(safeFolder)"
    set allNotes to notes of targetFolder
    set output to ""
    repeat with n in allNotes
        set noteName to name of n
        set noteBody to body of n
        if (noteName contains "\(safeQuery)" or noteBody contains "\(safeQuery)") then
            set noteId to id of n
            set noteCreated to ""
            try
                set noteCreated to creation date of n as string
            end try
            set noteModified to ""
            try
                set noteModified to modification date of n as string
            end try
            set excerpt to noteBody
            if (count of excerpt) > 200 then
                set excerpt to text 1 thru 200 of excerpt
            end if
            set output to output & noteId & "||" & noteName & "||" & name of targetFolder & "||" & excerpt & "||" & noteCreated & "||" & noteModified & "\\n"
        end if
    end repeat
    return output
end tell
"""
        } else {
            script = """
tell application "Notes"
    set allFolders to folders
    set output to ""
    repeat with fld in allFolders
        set allNotes to notes of fld
        repeat with n in allNotes
            set noteName to name of n
            set noteBody to body of n
            if (noteName contains "\(safeQuery)" or noteBody contains "\(safeQuery)") then
                set noteId to id of n
                set noteCreated to ""
                try
                    set noteCreated to creation date of n as string
                end try
                set noteModified to ""
                try
                    set noteModified to modification date of n as string
                end try
                set excerpt to noteBody
                if (count of excerpt) > 200 then
                    set excerpt to text 1 thru 200 of excerpt
                end if
                set output to output & noteId & "||" & noteName & "||" & name of fld & "||" & excerpt & "||" & noteCreated & "||" & noteModified & "\\n"
            end if
        end repeat
    end repeat
    return output
end tell
"""
        }

        let rawOutput = try await runAppleScript(script)
        let lines = rawOutput.split(separator: "\n", omittingEmptySubsequences: true)
        let limited = Array(lines.prefix(limit))

        guard !limited.isEmpty else {
            return "No notes matching \"\(query)\"."
        }

        var out = "Found \(limited.count) note(s) matching \"\(query)\":\n\n"
        for line in limited {
            let parts = line.split(separator: "||", maxSplits: 5, omittingEmptySubsequences: false).map(String.init)
            let noteId   = parts.count > 0 ? parts[0] : "?"
            let name     = parts.count > 1 ? parts[1] : "?"
            let folder   = parts.count > 2 ? parts[2] : "?"
            let excerpt  = parts.count > 3 ? parts[3].trimmingCharacters(in: .whitespacesAndNewlines) : ""
            let modified = parts.count > 5 ? parts[5] : ""
            out += "• \"\(name)\" (folder: \(folder))"
            if !modified.isEmpty { out += "\n  Modified: \(modified)" }
            if !excerpt.isEmpty  { out += "\n  Preview: \(String(excerpt.prefix(150)))" }
            out += "\n  ID: \(noteId)\n\n"
        }
        return out
    }

    // MARK: - AppleScript runner

    /// Pipes `script` to `/usr/bin/osascript` via stdin. This avoids shell escaping the
    /// script itself; only the embedded user-data strings need AppleScript-level escaping.
    static func runAppleScript(_ script: String) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let process = Process()
                process.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")

                let stdinPipe  = Pipe()
                let stdoutPipe = Pipe()
                let stderrPipe = Pipe()
                process.standardInput  = stdinPipe
                process.standardOutput = stdoutPipe
                process.standardError  = stderrPipe

                do {
                    try process.run()
                    if let data = script.data(using: .utf8) {
                        stdinPipe.fileHandleForWriting.write(data)
                    }
                    stdinPipe.fileHandleForWriting.closeFile()
                    process.waitUntilExit()

                    let outData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
                    let errData = stderrPipe.fileHandleForReading.readDataToEndOfFile()

                    if process.terminationStatus == 0 {
                        let output = String(data: outData, encoding: .utf8) ?? ""
                        continuation.resume(returning: output.trimmingCharacters(in: .whitespacesAndNewlines))
                    } else {
                        let errMsg = String(data: errData, encoding: .utf8) ?? "osascript error"
                        continuation.resume(throwing: notesError(errMsg.trimmingCharacters(in: .whitespacesAndNewlines)))
                    }
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    // MARK: - String escaping

    /// Escapes a Swift string for safe embedding inside an AppleScript double-quoted string.
    ///
    /// Rules:
    ///   - `"` becomes `" & quote & "` (AppleScript string concatenation with the `quote` constant)
    ///   - Literal newlines become `" & return & "` so they are preserved as line breaks
    ///   - Carriage returns are dropped (CR+LF → LF)
    static func escapeAppleScript(_ input: String) -> String {
        var s = input
        s = s.replacingOccurrences(of: "\r\n", with: "\n")
        s = s.replacingOccurrences(of: "\r",   with: "\n")
        s = s.replacingOccurrences(of: "\"",   with: "\" & quote & \"")
        s = s.replacingOccurrences(of: "\n",   with: "\" & return & \"")
        return s
    }
}

// MARK: - Helpers

private func notesError(_ message: String) -> NSError {
    NSError(domain: "macos-mcp.Notes", code: 1,
            userInfo: [NSLocalizedDescriptionKey: message])
}

private extension Optional where Wrapped == Value {
    var asInt: Int? {
        switch self {
        case .some(let v): return v.asInt
        case .none:        return nil
        }
    }
}
