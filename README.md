# macOS Ecosystem MCP Server

A fast, native Model Context Protocol (MCP) server for Claude that provides direct access to macOS productivity apps: **Reminders**, **Calendar**, and **Notes**.

## Why This Rewrite?

The original Node.js/TypeScript server shelled out to `osascript` for **every** tool call — adding 300–800 ms of process-startup overhead each time.

This Swift rewrite:
- Uses **EventKit** natively for Reminders and Calendar (no subprocess)
- Only shells out to `osascript` for Notes (Notes.framework is private)
- Compiles to a **single self-contained binary** — no Node.js runtime required
- Speaks the MCP stdio protocol directly via the [official Swift SDK](https://github.com/modelcontextprotocol/swift-sdk)

## Features

### 🗓️ Reminders (4 tools — EventKit)
- `reminders_add` — Create reminders with title, notes, due date, priority
- `reminders_list` — List reminders, filter by list and completion status
- `reminders_complete` — Mark a reminder as completed (by ID or title)
- `reminders_search` — Search reminders by keyword

### 📅 Calendar (5 tools — EventKit)
- `calendar_create_event` — Create events with location, notes, alerts
- `calendar_list_events` — List events within a date range
- `calendar_find_free_time` — Find available time slots
- `calendar_update_event` — Modify existing events
- `calendar_delete_event` — Delete events

### 📝 Notes (3 tools — osascript)
- `notes_create` — Create notes with title and body (HTML supported)
- `notes_append` — Append content to existing notes
- `notes_search` — Search notes by keyword

## Requirements

- macOS 13 Ventura or later
- Xcode 15+ / Swift 5.9+ (build only)
- Reminders, Calendar, and Notes access granted in **System Settings → Privacy & Security**

## Build from Source

```bash
git clone https://github.com/neverprepared/macos-ecosystem-mcp.git
cd macos-ecosystem-mcp
swift build -c release
```

The binary is placed at:
```
.build/release/macos-mcp
```

Install it system-wide:
```bash
sudo cp .build/release/macos-mcp /usr/local/bin/macos-mcp
```

## macOS Permissions

The first time the binary runs it will request access. You can also grant it in advance:

1. **System Settings → Privacy & Security → Reminders** — add `macos-mcp`
2. **System Settings → Privacy & Security → Calendars** — add `macos-mcp`
3. **System Settings → Privacy & Security → Automation → Notes** — add `macos-mcp`

## Claude Desktop Configuration

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/usr/local/bin/macos-mcp"
    }
  }
}
```

Or using the local build path:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/path/to/macos-ecosystem-mcp/.build/release/macos-mcp"
    }
  }
}
```

Restart Claude Desktop after editing the config.

## Tool Reference

### reminders_add
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| title | string | ✓ | — | Reminder title |
| list | string | | "Reminders" | List name |
| notes | string | | — | Body text |
| dueDate | string | | — | ISO 8601 date-time |
| priority | none\|low\|medium\|high | | "none" | Priority |

### reminders_list
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| list | string | | — | Filter by list |
| includeCompleted | boolean | | false | Include completed |
| limit | integer | | 50 | Max results (1–100) |

### reminders_complete
| Parameter | Type | Required | Description |
|---|---|---|---|
| reminderId | string | (one of) | EventKit calendarItemIdentifier |
| title | string | (one of) | Reminder title |
| list | string | | Narrow search to list |

### reminders_search
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| query | string | ✓ | — | Search keyword |
| list | string | | — | Restrict to list |
| includeCompleted | boolean | | false | Include completed |
| limit | integer | | 20 | Max results |

### calendar_create_event
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| title | string | ✓ | — | Event title |
| startDate | string | ✓ | — | ISO 8601 start |
| endDate | string | ✓ | — | ISO 8601 end |
| calendar | string | | system default | Calendar name |
| location | string | | — | Location |
| notes | string | | — | Description |
| allDay | boolean | | false | All-day event |
| alerts | integer[] | | — | Alert offsets in minutes |

### calendar_list_events
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| startDate | string | ✓ | — | ISO 8601 range start |
| endDate | string | ✓ | — | ISO 8601 range end |
| calendar | string | | — | Filter by calendar |
| limit | integer | | 50 | Max results |

### calendar_find_free_time
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| date | string | ✓ | — | ISO 8601 day to search |
| duration | integer | ✓ | — | Required slot (15–480 min) |
| workingHoursStart | integer | | 9 | Start hour (0–23) |
| workingHoursEnd | integer | | 17 | End hour (0–23) |
| calendar | string | | — | Restrict to calendar |

### calendar_update_event
| Parameter | Type | Required | Description |
|---|---|---|---|
| eventId | string | ✓ | EKEvent eventIdentifier |
| title | string | | New title |
| startDate | string | | New ISO 8601 start |
| endDate | string | | New ISO 8601 end |
| location | string | | New location |
| notes | string | | New description |

### calendar_delete_event
| Parameter | Type | Required | Description |
|---|---|---|---|
| eventId | string | (one of) | EKEvent eventIdentifier |
| title | string | (one of) | Event title |
| date | string | | ISO 8601 date to narrow search |

### notes_create
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| title | string | ✓ | — | Note title |
| body | string | ✓ | — | Note body |
| folder | string | | "Notes" | Folder name |

### notes_append
| Parameter | Type | Required | Description |
|---|---|---|---|
| noteId | string | (one of) | AppleScript note ID |
| title | string | (one of) | Note title |
| folder | string | | Narrow search |
| content | string | ✓ | Content to append |

### notes_search
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| query | string | ✓ | — | Search keyword |
| folder | string | | — | Restrict to folder |
| limit | integer | | 20 | Max results |

## Architecture

```
Sources/macos-mcp/
├── App.swift              # @main entry — MCP server setup and tool dispatcher
├── ToolDefinitions.swift  # JSON Schema definitions for all 12 tools
├── EventKitManager.swift  # Swift actor wrapping EKEventStore (reminders + calendar)
└── NotesHandler.swift     # osascript runner for Notes operations
```

## Notes on Flagged Reminders

EventKit does not expose the "flagged" status of reminders (it is a Reminders-app-specific attribute not in the EventKit API). The `flagged` parameter is accepted but silently ignored when creating reminders.

## License

MIT
