# Claude Code Setup Guide

Quick guide to use this MCP server with **Claude Code (CLI)**.

## Installation

### 1. Clone and Build

```bash
git clone git@github.com:neverprepared/macos-ecosystem-mcp.git
cd macos-ecosystem-mcp
pnpm install
pnpm build
```

### 2. Configure MCP Server

**Option A: Global Configuration** (available in all projects)

Create or edit `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/absolute/path/to/macos-ecosystem-mcp/start.sh",
      "disabled": false
    }
  }
}
```

**Option B: Project-Specific** (only in current project)

Create `.claude/mcp.json` in your project:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/absolute/path/to/macos-ecosystem-mcp/start.sh",
      "disabled": false
    }
  }
}
```

**Important**: Replace `/absolute/path/to/` with the actual path where you cloned the repository.

### 3. Verify Installation

```bash
# List configured MCP servers
claude mcp list

# Should show:
# ✓ macos-ecosystem (enabled)
```

## Grant macOS Permissions

On first use, macOS will prompt you to grant automation permissions:

1. Go to **System Settings > Privacy & Security > Automation**
2. Find your terminal application or Claude Code
3. Enable permissions for:
   - ✓ Reminders
   - ✓ Calendar
   - ✓ Notes

## Test the Server

Start Claude Code in any project:

```bash
cd ~/your-project
claude
```

Try these commands to test:

```
List my reminders
```

```
Find me a free 30-minute slot tomorrow
```

```
Create a note titled "Test" with content "Hello from Claude Code"
```

## Troubleshooting

### Server Not Showing Up

```bash
# Check MCP configuration
cat ~/.claude/mcp.json

# Or project-specific
cat .claude/mcp.json

# Verify paths are absolute (not relative)
```

### Permission Errors

```
Error: Permission denied for "Reminders"
```

**Solution**:
1. System Settings > Privacy & Security > Automation
2. Grant permissions
3. Restart Claude Code

### Server Not Starting

```bash
# Check if server runs manually
cd /path/to/macos-ecosystem-mcp
./start.sh

# Should show log output, Ctrl+C to stop
```

### Enable Debug Logging

Create `.env` in the server directory:

```bash
LOG_LEVEL=debug
```

Check stderr output for detailed logs.

## Available Tools

### Reminders (4 tools)
- `reminders_add` - Create reminders
- `reminders_list` - List/filter reminders
- `reminders_complete` - Mark as done
- `reminders_search` - Search by keyword

### Calendar (5 tools)
- `calendar_create_event` - Create events
- `calendar_list_events` - List events
- `calendar_find_free_time` - Find free slots
- `calendar_update_event` - Modify events
- `calendar_delete_event` - Delete events

### Notes (3 tools)
- `notes_create` - Create notes
- `notes_append` - Add to notes
- `notes_search` - Search notes

## Example Prompts

**Reminders:**
```
Add a reminder "Review PR #456" to my Work list, due tomorrow at 2pm, high priority
```

**Calendar:**
```
Create a meeting "Team Sync" tomorrow at 3pm for 1 hour in Conference Room A
```

```
What's on my calendar this week?
```

**Notes:**
```
Create a note titled "Meeting Notes - Q1 Planning" with today's discussion points
```

```
Search my notes for "project alpha"
```

## Configuration Options

Edit `.env` in the server directory:

```bash
# Logging verbosity (debug|info|warn|error)
LOG_LEVEL=info

# Script timeout in milliseconds
SCRIPT_TIMEOUT=30000

# Enable security validation (always true in production)
ENABLE_SECURITY_VALIDATION=true
```

## Updating the Server

```bash
cd /path/to/macos-ecosystem-mcp
git pull
pnpm install
pnpm build

# Restart Claude Code
```

## Support

- **Issues**: https://github.com/neverprepared/macos-ecosystem-mcp/issues
- **Security**: See [docs/SECURITY.md](docs/SECURITY.md)
- **Architecture**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
