# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

`macos-ecosystem-mcp` is a native **Swift** Model Context Protocol (MCP) server that
exposes macOS productivity apps — Reminders, Calendar, Contacts, Notes and iMessage — to
MCP clients over **stdio**. It compiles to a single self-contained binary (`macos-mcp`);
there is no Node.js runtime at run time.

- Package name: `macos-mcp` (executable target of the same name)
- Server identity: `macos-ecosystem-mcp`, version `0.7.0` (hard-coded in `App.swift`)
- Platform: **macOS 13+**, Swift tools 5.9
- Sole dependency: [`modelcontextprotocol/swift-sdk`](https://github.com/modelcontextprotocol/swift-sdk) (`from: 0.9.0`)
- Linked: `CoreLocation`, `Contacts` frameworks + `sqlite3`

## Architecture

All source lives in one flat target: `Sources/macos-mcp/`.

| File | Role |
|---|---|
| `App.swift` | `@main` entry point. Boots managers, requests permissions, registers `ListTools`/`CallTool` handlers, and contains the single `switch` **tool dispatcher**. Also defines `log()`. |
| `ToolDefinitions.swift` | `let allTools: [Tool]` — every tool's name, description and JSON input schema. |
| `EventKitManager.swift` | Reminders + Calendar via **EventKit** (no subprocess). |
| `ContactsManager.swift` | Contacts via the **Contacts** framework. |
| `NotesHandler.swift` | Notes via **`osascript`** (Notes.framework is private). Static methods, no instance. |
| `MessagesManager.swift` | iMessage: reads query `~/Library/Messages/chat.db` (SQLite, read-only); sends go through `osascript`. |

Design notes worth knowing before editing:

- **stdout is reserved for the MCP protocol.** All diagnostics go to stderr via `log()`.
  Never `print()` to stdout.
- Every tool handler has the shape `func name(args: [String: Value]) async throws -> String`
  and returns a plain-text string; `dispatch` in `App.swift` wraps it in `CallTool.Result`
  and converts thrown errors into `isError: true` results.
- Permissions (`EventKit`, `Contacts`) are requested once at startup, before any request
  is served.
- iMessage sending is **fail-closed**: it is disabled until an allowlist is configured via
  the `MACOS_MCP_IMESSAGE_ALLOWLIST` env var (comma-separated) and/or
  `~/.config/macos-mcp/imessage-allowlist.json` (`{"allow": [...]}`). Phone numbers match
  on the last 10 digits. Attachments from `~/.config/macos-mcp` and `~/Library/Messages`
  are refused. Reading `chat.db` and sending both require **Full Disk Access**.

## Tools (33 total)

Names are identical in `allTools` and the `dispatch` switch — **adding a tool means
editing both files**, or it will be listed but unroutable (or routable but invisible).

- **Reminder lists (3)**: `reminders_list_lists`, `reminders_create_list`, `reminders_delete_list`
- **Reminders (8)**: `reminders_list`, `reminders_get`, `reminders_add`, `reminders_complete`,
  `reminders_uncomplete`, `reminders_update`, `reminders_delete`, `reminders_search`
- **Calendar (6)**: `calendar_list_calendars`, `calendar_list_events`, `calendar_create_event`,
  `calendar_update_event`, `calendar_delete_event`, `calendar_find_free_time`
- **Contacts (6)**: `contacts_list_accounts`, `contacts_search`, `contacts_get`, `contacts_add`,
  `contacts_update`, `contacts_delete`
- **Notes (6)**: `notes_list`, `notes_get`, `notes_create`, `notes_append`, `notes_delete`, `notes_search`
- **iMessage (4)**: `imessage_list_chats`, `imessage_read`, `imessage_search`, `imessage_send`

No MCP resources or prompts are exposed — tools only (`Server.Capabilities(tools:)`).

## Commands

```bash
swift build                     # debug build
swift build -c release          # release build -> .build/release/macos-mcp
swift run macos-mcp             # run the server (stdio; expects an MCP client on stdin)
```

- **Tests: none exist.** There is no test target in `Package.swift` and no `Tests/`
  directory. `swift test` will fail. If you add behaviour, adding a test target is a
  genuine improvement — say so rather than claiming coverage.
- **Lint: none configured.** No SwiftLint/SwiftFormat config in the repo. Match the
  surrounding style instead.
- Builds require macOS — EventKit/Contacts/Messages are unavailable on Linux.

## Release

`.github/workflows/release.yml` runs **only on `v*` tags** (or `workflow_dispatch`) —
there is **no CI on pull requests**. It builds release, codesigns, notarizes, publishes a
GitHub Release, then rewrites `Formula/macos-ecosystem-mcp.rb` (version + sha256) and
pushes to `main`. The version string appears in `App.swift` (twice: log line and `Server`)
and in the formula — keep them in sync when bumping.

## Conventions

- Swift 5.9, `async`/`await` throughout; managers are classes, `NotesHandler` is static.
- Tool arguments arrive as `[String: Value]` from the MCP SDK — read defensively and
  default rather than force-unwrap.
- Return human-readable text from handlers; errors surface via `throw`.
- Anything touching `chat.db`, contacts, or sending messages is privacy-sensitive: keep
  the allowlist fail-closed and never widen path checks casually.

## Known documentation drift

- `docs/ARCHITECTURE.md` and `CLAUDE_CODE_SETUP.md` describe the **removed** Node.js/
  TypeScript implementation (`src/`, Zod schemas, `pnpm build`, `start.sh`). They are stale.
- `README.md` undercounts tools (lists 4 Reminders / 5 Calendar / 3 Notes tools and omits
  Contacts entirely).
- `node_modules/` and `pnpm-lock.yaml` are still tracked in git despite being listed in
  `.gitignore` — leftovers from the Node.js era.
