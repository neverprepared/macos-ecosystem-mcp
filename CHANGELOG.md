# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-17

### Added
- Initial release of macOS Ecosystem MCP Server
- **Reminders app** support with 4 tools:
  - `reminders_add` - Create reminders
  - `reminders_list` - List reminders with filtering
  - `reminders_complete` - Mark reminders as done
  - `reminders_search` - Search reminders
- **Calendar app** support with 5 tools:
  - `calendar_create_event` - Create events
  - `calendar_list_events` - List events in date range
  - `calendar_find_free_time` - Find available time slots
  - `calendar_update_event` - Modify events
  - `calendar_delete_event` - Delete events
- **Notes app** support with 3 tools:
  - `notes_create` - Create notes
  - `notes_append` - Append to notes
  - `notes_search` - Search notes
- Multi-layer security validation system
- Template-based AppleScript generation
- Comprehensive test suite (69 tests)
- Full documentation (README, ARCHITECTURE, SECURITY)

### Security
- Input sanitization for all user inputs
- AppleScript validator blocks dangerous patterns
- App whitelist enforcement
- Timeout protection for all executions
- Audit logging to stderr

[0.1.0]: https://github.com/neverprepared/macos-ecosystem-mcp/releases/tag/v0.1.0
