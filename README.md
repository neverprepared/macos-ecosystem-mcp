# macOS Ecosystem MCP Server

A secure, semantic Model Context Protocol (MCP) server that provides Claude with safe access to macOS productivity applications: Reminders, Calendar, and Notes.

## Why This Server?

Unlike raw AppleScript execution servers (which are dangerous due to arbitrary code execution), this server provides:

- ✅ **App-specific semantic tools** (e.g., `reminders_add`, `calendar_create_event`)
- ✅ **Multi-layer security validation** (Zod schemas + AppleScript validator)
- ✅ **Template-based script generation** (no string concatenation)
- ✅ **Input sanitization** and validation at every layer
- ✅ **Clear, discoverable tool interfaces** for LLMs

## Features

### 🗓️ Reminders (4 tools)
- `reminders_add` - Create reminders with title, notes, due date, priority
- `reminders_list` - List reminders with filtering by list and completion status
- `reminders_complete` - Mark reminders as completed
- `reminders_search` - Search reminders by keyword

### 📅 Calendar (5 tools)
- `calendar_create_event` - Create events with full details (location, notes, alerts)
- `calendar_list_events` - List events within a date range
- `calendar_find_free_time` - Find available time slots for scheduling
- `calendar_update_event` - Modify existing events
- `calendar_delete_event` - Delete events

### 📝 Notes (3 tools)
- `notes_create` - Create notes with title and body (supports HTML)
- `notes_append` - Append content to existing notes
- `notes_search` - Search notes by keyword

## Installation

### Option 1: Binary Installation (Recommended)

**No Node.js required!** Download a pre-built binary from [GitHub Releases](https://github.com/neverprepared/macos-ecosystem-mcp/releases):

```bash
# For Apple Silicon (M1/M2/M3/M4)
curl -L https://github.com/neverprepared/macos-ecosystem-mcp/releases/latest/download/macos-mcp-arm64 -o macos-mcp
chmod +x macos-mcp
sudo mv macos-mcp /usr/local/bin/
```

> **Note**: Intel Macs can run via Rosetta 2 or install from source.

See [BINARY_INSTALL.md](BINARY_INSTALL.md) for detailed instructions.

### Option 2: Install from Source

**Prerequisites:**
- macOS 10.15 or later
- Node.js 18+ or Bun
- pnpm (recommended) or npm

```bash
git clone https://github.com/neverprepared/macos-ecosystem-mcp.git
cd macos-ecosystem-mcp
pnpm install
pnpm build
```

## Configuration

### Option 1: Claude Code (CLI)

**If using binary installation:**

Add to your global `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/usr/local/bin/macos-mcp"
    }
  }
}
```

**If using source installation:**

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/absolute/path/to/macos-ecosystem-mcp/start.sh"
    }
  }
}
```

**Verify the server is loaded:**
```bash
claude mcp list
# Should show "macos-ecosystem" in the list
```

### Option 2: Claude Desktop

Add to your `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/Users/YOUR_USERNAME/path/to/macos-ecosystem-mcp/start.sh"
    }
  }
}
```

Replace `YOUR_USERNAME` and adjust the path to where you cloned this repository.

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Available options:
- `LOG_LEVEL` - Logging verbosity: `debug`, `info`, `warn`, `error` (default: `info`)
- `SCRIPT_TIMEOUT` - Script execution timeout in milliseconds (default: `30000`)
- `ENABLE_SECURITY_VALIDATION` - Enable security checks (default: `true`)

## macOS Permissions

On first use, macOS will prompt you to grant automation permissions. You need to allow this server to control:

- **Reminders**
- **Calendar**
- **Notes**

Navigate to: **System Settings > Privacy & Security > Automation**

## Usage Examples

### Create a Reminder

```
Create a reminder "Review PR #123" in my Work list, due tomorrow at 2pm, high priority
```

### Find Free Time

```
Find me a 30-minute slot tomorrow between 9am and 5pm
```

### Create a Note

```
Create a note titled "Meeting Notes - Q1 Planning" with the following content: [your content]
```

### Search Reminders

```
Find all reminders related to "project alpha"
```

## Development

### Run Tests

```bash
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

### Type Checking

```bash
pnpm typecheck
```

### Development Mode

```bash
pnpm dev
```

## Security

This server implements **defense-in-depth security**:

1. **Input Validation** - Zod schemas validate all inputs
2. **Template-Based Generation** - No string concatenation of user input
3. **AppleScript Validator** - Blocks forbidden patterns before execution
4. **App Whitelist** - Only approved apps can be targeted
5. **Timeout Protection** - Scripts cannot run indefinitely

See [docs/SECURITY.md](docs/SECURITY.md) for detailed security architecture.

## Architecture

- **TypeScript** with strict type checking
- **Zod** for runtime validation
- **date-fns** for date handling
- **run-applescript** for AppleScript execution
- **Vitest** for testing

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for implementation details.

## Roadmap

### Phase 2 - Communication
- Mail (send, search, manage inbox)
- Messages (iMessage/SMS)

### Phase 3 - Automation & Browser
- Shortcuts (list, run programmatically)
- Safari (tab management, navigation)

### Phase 4 - Media & System
- Music (playback control, playlists)
- Photos (albums, search, export)

## License

MIT

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`pnpm test`)
5. Submit a pull request

## Troubleshooting

### Permission Errors

If you see "Permission denied" errors:
1. Go to **System Settings > Privacy & Security > Automation**
2. Enable permissions for this tool to control Reminders/Calendar/Notes
3. Restart Claude Desktop

### Scripts Timing Out

Increase `SCRIPT_TIMEOUT` in `.env`:
```
SCRIPT_TIMEOUT=60000  # 60 seconds
```

### Debug Logging

Enable debug logs in `.env`:
```
LOG_LEVEL=debug
```

Logs are written to stderr and won't interfere with MCP communication.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
