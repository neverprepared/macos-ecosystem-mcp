import MCP

/// All 24 tool definitions exposed by this server.
/// Parameter names and types match the original TypeScript schemas exactly.
let allTools: [Tool] = [

    // ── Reminder Lists ────────────────────────────────────────────────────────

    Tool(
        name: "reminders_list_lists",
        description: "List all reminder lists (calendars) available in the macOS Reminders app.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([:]),
            "required": .array([])
        ])
    ),

    Tool(
        name: "reminders_create_list",
        description: "Create a new reminder list in the macOS Reminders app.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Name of the new list (required).")
                ])
            ]),
            "required": .array([.string("title")])
        ])
    ),

    Tool(
        name: "reminders_delete_list",
        description: "Delete a reminder list and all its reminders. Identify by listId or title.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "listId": .object([
                    "type": .string("string"),
                    "description": .string("The EKCalendar calendarIdentifier (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Name of the list to delete (used when listId is absent).")
                ])
            ]),
            "required": .array([])
        ])
    ),

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
                "url": .object([
                    "type": .string("string"),
                    "description": .string("Optional URL to attach to the reminder.")
                ]),
                "alarms": .object([
                    "type": .string("array"),
                    "description": .string("Alert offsets in minutes before due date (e.g. [15, 60])."),
                    "items": .object(["type": .string("integer")])
                ]),
                "recurrenceFrequency": .object([
                    "type": .string("string"),
                    "enum": .array([.string("daily"), .string("weekly"), .string("monthly"), .string("yearly")]),
                    "description": .string("Recurrence frequency.")
                ]),
                "recurrenceInterval": .object([
                    "type": .string("integer"),
                    "description": .string("Repeat every N frequency units. Defaults to 1."),
                    "default": .int(1),
                    "minimum": .int(1)
                ]),
                "recurrenceEndDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 date when recurrence ends (optional).")
                ]),
                "recurrenceOccurrences": .object([
                    "type": .string("integer"),
                    "description": .string("Stop after this many occurrences (optional).")
                ]),
                "locationName": .object([
                    "type": .string("string"),
                    "description": .string("Display name of the location for a proximity alarm.")
                ]),
                "locationLatitude": .object([
                    "type": .string("number"),
                    "description": .string("Latitude for the location alarm.")
                ]),
                "locationLongitude": .object([
                    "type": .string("number"),
                    "description": .string("Longitude for the location alarm.")
                ]),
                "locationRadius": .object([
                    "type": .string("number"),
                    "description": .string("Geofence radius in metres. Defaults to 100."),
                    "default": .int(100)
                ]),
                "locationProximity": .object([
                    "type": .string("string"),
                    "enum": .array([.string("arrive"), .string("leave")]),
                    "description": .string("Trigger when arriving at or leaving the location. Defaults to 'arrive'."),
                    "default": .string("arrive")
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
                ]),
                "offset": .object([
                    "type": .string("integer"),
                    "description": .string("Number of reminders to skip for pagination. Defaults to 0."),
                    "minimum": .int(0),
                    "default": .int(0)
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

    Tool(
        name: "reminders_update",
        description: "Update an existing reminder's title, notes, due date, priority, list, URL, alarms, recurrence, or location alarm.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "reminderId": .object([
                    "type": .string("string"),
                    "description": .string("The EventKit calendarItemIdentifier of the reminder (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Current title to look up when reminderId is absent.")
                ]),
                "list": .object([
                    "type": .string("string"),
                    "description": .string("Narrow the title search to a specific list.")
                ]),
                "newTitle": .object([
                    "type": .string("string"),
                    "description": .string("New title to set (1–500 chars).")
                ]),
                "notes": .object([
                    "type": .string("string"),
                    "description": .string("New notes to set (max 5000 chars).")
                ]),
                "dueDate": .object([
                    "type": .string("string"),
                    "description": .string("New ISO 8601 due date. Pass empty string to clear.")
                ]),
                "priority": .object([
                    "type": .string("string"),
                    "enum": .array([.string("none"), .string("low"), .string("medium"), .string("high")]),
                    "description": .string("New priority level.")
                ]),
                "newList": .object([
                    "type": .string("string"),
                    "description": .string("Move reminder to this list.")
                ]),
                "url": .object([
                    "type": .string("string"),
                    "description": .string("New URL. Pass empty string to clear.")
                ]),
                "alarms": .object([
                    "type": .string("array"),
                    "description": .string("Replace time-based alarms with these minute offsets before due date. Pass [] to clear."),
                    "items": .object(["type": .string("integer")])
                ]),
                "clearAlarms": .object([
                    "type": .string("boolean"),
                    "description": .string("Set true to remove all time-based alarms.")
                ]),
                "recurrenceFrequency": .object([
                    "type": .string("string"),
                    "enum": .array([.string("daily"), .string("weekly"), .string("monthly"), .string("yearly")]),
                    "description": .string("Set or replace recurrence frequency.")
                ]),
                "recurrenceInterval": .object([
                    "type": .string("integer"),
                    "description": .string("Repeat every N units. Defaults to 1."),
                    "default": .int(1)
                ]),
                "recurrenceEndDate": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 date when recurrence ends.")
                ]),
                "recurrenceOccurrences": .object([
                    "type": .string("integer"),
                    "description": .string("Stop after this many occurrences.")
                ]),
                "clearRecurrence": .object([
                    "type": .string("boolean"),
                    "description": .string("Set true to remove the recurrence rule.")
                ]),
                "locationName": .object([
                    "type": .string("string"),
                    "description": .string("Set or replace location alarm. Pass empty string to clear.")
                ]),
                "locationLatitude": .object([
                    "type": .string("number"),
                    "description": .string("Latitude for the location alarm.")
                ]),
                "locationLongitude": .object([
                    "type": .string("number"),
                    "description": .string("Longitude for the location alarm.")
                ]),
                "locationRadius": .object([
                    "type": .string("number"),
                    "description": .string("Geofence radius in metres. Defaults to 100.")
                ]),
                "locationProximity": .object([
                    "type": .string("string"),
                    "enum": .array([.string("arrive"), .string("leave")]),
                    "description": .string("Trigger on arrive or leave. Defaults to 'arrive'.")
                ]),
                "clearLocationAlarm": .object([
                    "type": .string("boolean"),
                    "description": .string("Set true to remove the location alarm.")
                ])
            ]),
            "required": .array([])
        ])
    ),

    Tool(
        name: "reminders_delete",
        description: "Permanently delete a reminder. Identify by reminderId or title.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "reminderId": .object([
                    "type": .string("string"),
                    "description": .string("The EventKit calendarItemIdentifier of the reminder (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Title of the reminder to delete (used when reminderId is absent).")
                ]),
                "list": .object([
                    "type": .string("string"),
                    "description": .string("Narrow the title search to a specific list.")
                ])
            ]),
            "required": .array([])
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

    // ── Contacts ─────────────────────────────────────────────────────────────

    Tool(
        name: "contacts_list_accounts",
        description: "List all contact accounts/containers (iCloud, Exchange/OWA, On My Mac, etc.).",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([:]),
            "required": .array([])
        ])
    ),

    Tool(
        name: "contacts_search",
        description: "Search contacts by name, email address, or phone number.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "query": .object([
                    "type": .string("string"),
                    "description": .string("Name, email, or phone to search for (required).")
                ]),
                "limit": .object([
                    "type": .string("integer"),
                    "description": .string("Maximum results (1–100). Defaults to 20."),
                    "minimum": .int(1),
                    "maximum": .int(100),
                    "default": .int(20)
                ]),
                "account": .object([
                    "type": .string("string"),
                    "description": .string("Filter by account name (e.g. 'iCloud', 'OWA'). Use contacts_list_accounts to see available accounts. Pass '*' as query to list all contacts in the account.")
                ])
            ]),
            "required": .array([.string("query")])
        ])
    ),

    Tool(
        name: "contacts_get",
        description: "Get full details for a contact by their contactId.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "contactId": .object([
                    "type": .string("string"),
                    "description": .string("The CNContact identifier (required).")
                ])
            ]),
            "required": .array([.string("contactId")])
        ])
    ),

    Tool(
        name: "contacts_add",
        description: "Create a new contact in the macOS Contacts app.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "givenName": .object([
                    "type": .string("string"),
                    "description": .string("First name (required).")
                ]),
                "familyName": .object([
                    "type": .string("string"),
                    "description": .string("Last name.")
                ]),
                "middleName": .object([
                    "type": .string("string"),
                    "description": .string("Middle name.")
                ]),
                "nickname": .object([
                    "type": .string("string"),
                    "description": .string("Nickname.")
                ]),
                "organizationName": .object([
                    "type": .string("string"),
                    "description": .string("Company or organization name.")
                ]),
                "jobTitle": .object([
                    "type": .string("string"),
                    "description": .string("Job title.")
                ]),
                "phones": .object([
                    "type": .string("array"),
                    "description": .string("List of phone numbers."),
                    "items": .object(["type": .string("string")])
                ]),
                "phoneLabels": .object([
                    "type": .string("array"),
                    "description": .string("Labels for each phone (e.g. 'mobile', 'work', 'home'). Parallel to phones."),
                    "items": .object(["type": .string("string")])
                ]),
                "emails": .object([
                    "type": .string("array"),
                    "description": .string("List of email addresses."),
                    "items": .object(["type": .string("string")])
                ]),
                "emailLabels": .object([
                    "type": .string("array"),
                    "description": .string("Labels for each email (e.g. 'work', 'home'). Parallel to emails."),
                    "items": .object(["type": .string("string")])
                ]),
                "addressStreet": .object([
                    "type": .string("string"),
                    "description": .string("Street address.")
                ]),
                "addressCity": .object([
                    "type": .string("string"),
                    "description": .string("City.")
                ]),
                "addressState": .object([
                    "type": .string("string"),
                    "description": .string("State or province.")
                ]),
                "addressZip": .object([
                    "type": .string("string"),
                    "description": .string("Postal / ZIP code.")
                ]),
                "addressCountry": .object([
                    "type": .string("string"),
                    "description": .string("Country.")
                ]),
                "birthday": .object([
                    "type": .string("string"),
                    "description": .string("ISO 8601 date, e.g. '1990-06-15'.")
                ]),
                "note": .object([
                    "type": .string("string"),
                    "description": .string("Free-form note.")
                ])
            ]),
            "required": .array([.string("givenName")])
        ])
    ),

    Tool(
        name: "contacts_update",
        description: "Update an existing contact by contactId. Only supplied fields are changed.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "contactId": .object([
                    "type": .string("string"),
                    "description": .string("The CNContact identifier (required).")
                ]),
                "givenName": .object([
                    "type": .string("string"),
                    "description": .string("New first name.")
                ]),
                "familyName": .object([
                    "type": .string("string"),
                    "description": .string("New last name.")
                ]),
                "middleName": .object([
                    "type": .string("string"),
                    "description": .string("New middle name.")
                ]),
                "nickname": .object([
                    "type": .string("string"),
                    "description": .string("New nickname.")
                ]),
                "organizationName": .object([
                    "type": .string("string"),
                    "description": .string("New organization name.")
                ]),
                "jobTitle": .object([
                    "type": .string("string"),
                    "description": .string("New job title.")
                ]),
                "phones": .object([
                    "type": .string("array"),
                    "description": .string("Replace all phone numbers with this list."),
                    "items": .object(["type": .string("string")])
                ]),
                "phoneLabels": .object([
                    "type": .string("array"),
                    "description": .string("Labels for each phone. Parallel to phones."),
                    "items": .object(["type": .string("string")])
                ]),
                "emails": .object([
                    "type": .string("array"),
                    "description": .string("Replace all email addresses with this list."),
                    "items": .object(["type": .string("string")])
                ]),
                "emailLabels": .object([
                    "type": .string("array"),
                    "description": .string("Labels for each email. Parallel to emails."),
                    "items": .object(["type": .string("string")])
                ]),
                "birthday": .object([
                    "type": .string("string"),
                    "description": .string("New birthday (ISO 8601). Pass empty string to clear.")
                ]),
                "note": .object([
                    "type": .string("string"),
                    "description": .string("New note.")
                ])
            ]),
            "required": .array([.string("contactId")])
        ])
    ),

    Tool(
        name: "contacts_delete",
        description: "Permanently delete a contact by contactId.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "contactId": .object([
                    "type": .string("string"),
                    "description": .string("The CNContact identifier (required).")
                ])
            ]),
            "required": .array([.string("contactId")])
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
        name: "notes_delete",
        description: "Delete a note from the macOS Notes app (uses osascript). Identify by noteId or title.",
        inputSchema: .object([
            "type": .string("object"),
            "properties": .object([
                "noteId": .object([
                    "type": .string("string"),
                    "description": .string("AppleScript note ID (preferred).")
                ]),
                "title": .object([
                    "type": .string("string"),
                    "description": .string("Title of the note to delete (used when noteId is absent).")
                ]),
                "folder": .object([
                    "type": .string("string"),
                    "description": .string("Narrow the title search to a specific folder.")
                ])
            ]),
            "required": .array([])
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
