# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2026-09-28

### Fixed
- **Reminder start dates were invisible and unclearable.** `EKReminder.startDateComponents`
  was never read or written anywhere in the server. The Reminders app stores a date given
  without a "remind me" time in that field rather than in `dueDateComponents`, so such
  reminders were reported by `reminders_list` / `reminders_get` / `reminders_search` as
  having no date at all, and no argument to `reminders_update` could clear one.
- **Absolute-date alarms were silently dropped from output.** The alarm partition in
  `formatReminderSummary` routed alarms with an `absoluteDate` into neither the time nor
  the location bucket, so they were never rendered.

### Added
- `startDate` argument on `reminders_add` and `reminders_update` (empty string clears).
- `clearAllDates` argument on `reminders_update` — strips due date, start date and all
  time and absolute-date alarms in one call, keeping location alarms.
- Reminder summaries now show `Starts:` and `Alarms (absolute):`.

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
