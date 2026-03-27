import MCP

/// All 12 tool definitions exposed by this server.
/// Parameter names and types match the original TypeScript schemas exactly.
let allTools: [Tool] = [

    // ── Reminders ────────────────────────────────────────────────────────────

    Tool(
        name: "reminders_add",
        description: "Create a new reminder in the macOS Reminders app.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "title": .object([
                    "type": .string("string"),
                    "description": .string("The reminder title (required, 1–500 chars)")
                ]),
                "list": .object([
                    "type": .string("string"),
                    "description": .string("Name of the reminder list / calendar. Defaults to 'Reminders'"),
                    "default": .string("Reminders")
                ]),
                "notes": .object([
                    "type": .string("string"),
                    "description": .string("Optional notes / body text (max 5000 chars)")
                ]),
                "dueDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 due date, e.g. '2025-06-15T09:00:00Z'")
                ]),
                "priority": .object([
                    "type": .string("string"),
                    "enum": .array([.string("none"), .string("low"), .string("medium"), .string("high")]),
                    "description": .string("Reminder priority. Defaults to 'none'"),
                    "default": .string("none")
                ]),
                "flagged": .object([
                    "type": .string("boolean"),
                    "description": .string("Whether to flag the reminder. Note: flagged status is not available via EventKit and will be ignored."),
                    "default": .bool(false)
                ])
            ]),
            "required": .array([.string("title")])
        ])
    ),

    Tool(
        name: "reminders_list",
        description: "List reminders from the macOS Reminders app, optionally filtered by list and completion status.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "list": .object([
                    "type": .string("string"),
                    "description": .string("Filter by list name. If omitted, all lists are included.")
                ]),
                "includeCompleted": .object([
                    "type": .string("boolean"),
                    "description": .string("Include completed reminders. Defaults to false."),
                    "default": .bool(false)
                ]),
                "limit": .object([
                    "type": .string("integer"),
                    "description": .string("Maximum number of reminders to return (1–100). Defaults to 50."),
                    "minimum": .int(1),
                    "maximum": .int(100),
                    "default": .int(50)
                ])
            ]),
            "required": .array([])
        ])
    ),

    Tool(
        name: "reminders_complete",
        description: "Mark a reminder as completed. Identify by reminderId or title (with optional list filter).",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "reminderId": .object([
                    "type": .string("string"),
                    "description": .string("The EventKit calendarItemIdentifier of the reminder (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Title of the reminder to complete (used when reminderId is absent).")
                ]),
                "list": .object([
                    "type": .string("string"),
                    "description": .string("Narrow the title search to a specific list.")
                ])
            ]),
            "required": .array([])
        ])
    ),

    Tool(
        name: "reminders_search",
        description: "Search reminders by keyword in title or notes.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "query": .object([
                    "type": .string("string"),
                    "description": .string("Search keyword (case-insensitive match against title and notes).")
                ]),
                "list": .object([
                    "type": .string("string"),
                    "description": .string("Restrict search to this list.")
                ]),
                "includeCompleted": .object([
                    "type": .string("boolean"),
                    "description": .string("Include completed reminders. Defaults to false."),
                    "default": .bool(false)
                ]),
                "limit": .object([
                    "type": .string("integer"),
                    "description": .string("Maximum results (1–100). Defaults to 20."),
                    "minimum": .int(1),
                    "maximum": .int(100),
                    "default": .int(20)
                ])
            ]),
            "required": .array([.string("query")])
        ])
    ),

    // ── Calendar ─────────────────────────────────────────────────────────────

    Tool(
        name: "calendar_create_event",
        description: "Create a new event in the macOS Calendar app.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Event title (required, 1–500 chars).")
                ]),
                "startDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 start date-time, e.g. '2025-06-15T09:00:00Z'.")
                ]),
                "endDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 end date-time. Must be after startDate.")
                ]),
                "calendar": .object([
                    "type": .string("string"),
                    "description": .string("Calendar name. Defaults to the system default calendar."),
                    "default": .string("Calendar")
                ]),
                "location": .object([
                    "type": .string("string"),
                    "description": .string("Event location (max 500 chars).")
                ]),
                "notes": .object([
                    "type": .string("string"),
                    "description": .string("Event notes / description (max 5000 chars).")
                ]),
                "allDay": .object([
                    "type": .string("boolean"),
                    "description": .string("Create as an all-day event. Defaults to false."),
                    "default": .bool(false)
                ]),
                "alerts": .object([
                    "type": .string("array"),
                    "description": .string("Alert offsets in minutes before the event (0–10080)."),
                    "items": .object([
                        "type": .string("integer"),
                        "minimum": .int(0),
                        "maximum": .int(10080)
                    ])
                ])
            ]),
            "required": .array([.string("title"), .string("startDate"), .string("endDate")])
        ])
    ),

    Tool(
        name: "calendar_list_events",
        description: "List calendar events within a date range.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "startDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 start of the range (required).")
                ]),
                "endDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 end of the range (required).")
                ]),
                "calendar": .object([
                    "type": .string("string"),
                    "description": .string("Filter by calendar name. Omit to include all calendars.")
                ]),
                "limit": .object([
                    "type": .string("integer"),
                    "description": .string("Maximum events to return (1–100). Defaults to 50."),
                    "minimum": .int(1),
                    "maximum": .int(100),
                    "default": .int(50)
                ])
            ]),
            "required": .array([.string("startDate"), .string("endDate")])
        ])
    ),

    Tool(
        name: "calendar_find_free_time",
        description: "Find free time slots on a given day within working hours.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "date": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 date-time for the day to search.")
                ]),
                "duration": .object([
                    "type": .string("integer"),
                    "description": .string("Required slot duration in minutes (15–480)."),
                    "minimum": .int(15),
                    "maximum": .int(480)
                ]),
                "workingHoursStart": .object([
                    "type": .string("integer"),
                    "description": .string("Start of working hours (0–23). Defaults to 9."),
                    "minimum": .int(0),
                    "maximum": .int(23),
                    "default": .int(9)
                ]),
                "workingHoursEnd": .object([
                    "type": .string("integer"),
                    "description": .string("End of working hours (0–23). Defaults to 17."),
                    "minimum": .int(0),
                    "maximum": .int(23),
                    "default": .int(17)
                ]),
                "calendar": .object([
                    "type": .string("string"),
                    "description": .string("Restrict search to a specific calendar. Omit to check all.")
                ])
            ]),
            "required": .array([.string("date"), .string("duration")])
        ])
    ),

    Tool(
        name: "calendar_update_event",
        description: "Update an existing calendar event by its eventIdentifier.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "eventId": .object([
                    "type": .string("string"),
                    "description": .string("The EKEvent eventIdentifier (required).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("New title (1–500 chars).")
                ]),
                "startDate": .object([
                    "type": .string("string"),
                    "description": .string("New ISO 8601 start date-time.")
                ]),
                "endDate": .object([
                    "type": .string("string"),
                    "description": .string("New ISO 8601 end date-time.")
                ]),
                "location": .object([
                    "type": .string("string"),
                    "description": .string("New location (max 500 chars).")
                ]),
                "notes": .object([
                    "type": .string("string"),
                    "description": .string("New notes / description (max 5000 chars).")
                ])
            ]),
            "required": .array([.string("eventId")])
        ])
    ),

    Tool(
        name: "calendar_delete_event",
        description: "Delete a calendar event by its eventIdentifier or title.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "eventId": .object([
                    "type": .string("string"),
                    "description": .string("The EKEvent eventIdentifier (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Title of the event to delete (used when eventId is absent).")
                ]),
                "date": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 date to narrow the title search.")
                ])
            ]),
            "required": .array([])
        ])
    ),

    // ── Notes ─────────────────────────────────────────────────────────────────

    Tool(
        name: "notes_create",
        description: "Create a new note in the macOS Notes app (uses osascript).",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Note title (required, 1–500 chars).")
                ]),
                "body": .object([
                    "type": .string("string"),
                    "description": .string("Note body / content (max 100,000 chars).")
                ]),
                "folder": .object([
                    "type": .string("string"),
                    "description": .string("Notes folder. Defaults to 'Notes'."),
                    "default": .string("Notes")
                ])
            ]),
            "required": .array([.string("title"), .string("body")])
        ])
    ),

    Tool(
        name: "notes_append",
        description: "Append content to an existing note (uses osascript). Identify by noteId or title.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "noteId": .object([
                    "type": .string("string"),
                    "description": .string("AppleScript note ID (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Title of the note (used when noteId is absent).")
                ]),
                "folder": .object([
                    "type": .string("string"),
                    "description": .string("Folder to narrow the title search.")
                ]),
                "content": .object([
                    "type": .string("string"),
                    "description": .string("Content to append (required, 1–100,000 chars).")
                ])
            ]),
            "required": .array([.string("content")])
        ])
    ),

    Tool(
        name: "notes_search",
        description: "Search notes by keyword in title or body (uses osascript).",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "query": .object([
                    "type": .string("string"),
                    "description": .string("Search keyword (required).")
                ]),
                "folder": .object([
                    "type": .string("string"),
                    "description": .string("Restrict to a specific folder.")
                ]),
                "limit": .object([
                    "type": .string("integer"),
                    "description": .string("Maximum results (1–100). Defaults to 20."),
                    "minimum": .int(1),
                    "maximum": .int(100),
                    "default": .int(20)
                ])
            ]),
            "required": .array([.string("query")])
        ])
    )
]
