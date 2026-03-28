import MCP
import Foundation

@main
struct MacOSMCPApp {
    static func main() async throws {
        log("Starting macOS Ecosystem MCP Server v0.5.1 (Swift/EventKit/Contacts)")

        // Initialise EventKit and request permissions before handling any requests
        let ekManager = EventKitManager()
        let cnManager = ContactsManager()
        await ekManager.requestPermissions()
        await cnManager.requestPermissions()

        log("EventKit ready, registering tools")

        let server = Server(
            name: "macos-ecosystem-mcp",
            version: "0.5.1",
            capabilities: Server.Capabilities(
                tools: .init(listChanged: false)
            )
        )

        await server.withMethodHandler(ListTools.self) { _ in
            ListTools.Result(tools: allTools)
        }

        await server.withMethodHandler(CallTool.self) { params in
            await dispatch(params: params, ekManager: ekManager, cnManager: cnManager)
        }

        log("All 24 tools registered, connecting stdio transport")

        let transport = StdioTransport()
        try await server.start(transport: transport)
        await server.waitUntilCompleted()
    }
}

// MARK: - Tool dispatcher

private func dispatch(params: CallTool.Parameters, ekManager: EventKitManager, cnManager: ContactsManager) async -> CallTool.Result {
    do {
        let text: String = try await {
            switch params.name {
            // ── Reminder Lists ─────────────────────────────────────────────
            case "reminders_list_lists":
                return try await ekManager.listReminderLists(args: params.arguments ?? [:])
            case "reminders_create_list":
                return try await ekManager.createReminderList(args: params.arguments ?? [:])
            case "reminders_delete_list":
                return try await ekManager.deleteReminderList(args: params.arguments ?? [:])

            // ── Reminders ──────────────────────────────────────────────────
            case "reminders_list":
                return try await ekManager.listReminders(args: params.arguments ?? [:])
            case "reminders_add":
                return try await ekManager.addReminder(args: params.arguments ?? [:])
            case "reminders_complete":
                return try await ekManager.completeReminder(args: params.arguments ?? [:])
            case "reminders_update":
                return try await ekManager.updateReminder(args: params.arguments ?? [:])
            case "reminders_delete":
                return try await ekManager.deleteReminder(args: params.arguments ?? [:])
            case "reminders_search":
                return try await ekManager.searchReminders(args: params.arguments ?? [:])

            // ── Calendar ───────────────────────────────────────────────────
            case "calendar_list_events":
                return try await ekManager.listEvents(args: params.arguments ?? [:])
            case "calendar_create_event":
                return try await ekManager.createEvent(args: params.arguments ?? [:])
            case "calendar_update_event":
                return try await ekManager.updateEvent(args: params.arguments ?? [:])
            case "calendar_delete_event":
                return try await ekManager.deleteEvent(args: params.arguments ?? [:])
            case "calendar_find_free_time":
                return try await ekManager.findFreeTime(args: params.arguments ?? [:])

            // ── Contacts ───────────────────────────────────────────────────
            case "contacts_list_accounts":
                return try await cnManager.listAccounts(args: params.arguments ?? [:])
            case "contacts_search":
                return try await cnManager.searchContacts(args: params.arguments ?? [:])
            case "contacts_get":
                return try await cnManager.getContact(args: params.arguments ?? [:])
            case "contacts_add":
                return try await cnManager.addContact(args: params.arguments ?? [:])
            case "contacts_update":
                return try await cnManager.updateContact(args: params.arguments ?? [:])
            case "contacts_delete":
                return try await cnManager.deleteContact(args: params.arguments ?? [:])

            // ── Notes (osascript) ──────────────────────────────────────────
            case "notes_create":
                return try await NotesHandler.createNote(args: params.arguments ?? [:])
            case "notes_append":
                return try await NotesHandler.appendNote(args: params.arguments ?? [:])
            case "notes_delete":
                return try await NotesHandler.deleteNote(args: params.arguments ?? [:])
            case "notes_search":
                return try await NotesHandler.searchNotes(args: params.arguments ?? [:])

            default:
                return "Unknown tool: \(params.name)"
            }
        }()

        return CallTool.Result(
            content: [.text(text: text, annotations: nil, _meta: nil)],
            isError: false
        )
    } catch {
        log("Tool error (\(params.name)): \(error)")
        return CallTool.Result(
            content: [.text(text: "Error: \(error.localizedDescription)", annotations: nil, _meta: nil)],
            isError: true
        )
    }
}

// MARK: - Logging helper (all output goes to stderr; stdout is reserved for MCP protocol)

func log(_ message: String) {
    fputs("[macos-mcp] \(message)\n", stderr)
}
