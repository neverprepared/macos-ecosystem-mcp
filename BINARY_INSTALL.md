# Binary Installation Guide

Install the macOS Ecosystem MCP Server using a pre-built binary (no Node.js/Bun required).

## Quick Install

### 1. Download the Binary

**For Apple Silicon (M1/M2/M3/M4):**
```bash
curl -L https://github.com/neverprepared/macos-ecosystem-mcp/releases/latest/download/macos-mcp-arm64 -o macos-mcp
chmod +x macos-mcp
```

> **Note for Intel Macs**: Currently only Apple Silicon binaries are provided. Intel Macs can run the binary via Rosetta 2, or install from source (see below).

### 2. Move to a Permanent Location

```bash
sudo mv macos-mcp /usr/local/bin/
```

Or keep it in a custom location:
```bash
mkdir -p ~/.local/bin
mv macos-mcp ~/.local/bin/
```

### 3. Configure Claude Code

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/usr/local/bin/macos-mcp"
    }
  }
}
```

Or if using custom location:
```json
{
  "mcpServers": {
    "macos-ecosystem": {
      "command": "/Users/YOUR_USERNAME/.local/bin/macos-mcp"
    }
  }
}
```

### 4. Verify Installation

```bash
# Check the binary works
/usr/local/bin/macos-mcp --version

# Verify in Claude Code
claude mcp list
```

## Grant macOS Permissions

On first use:
1. **System Settings > Privacy & Security > Automation**
2. Grant permissions for Reminders, Calendar, and Notes

## Updating

To update to the latest version:

```bash
# Download new binary
curl -L https://github.com/neverprepared/macos-ecosystem-mcp/releases/latest/download/macos-mcp-arm64 -o macos-mcp
chmod +x macos-mcp
sudo mv macos-mcp /usr/local/bin/
```

## Building from Source (Optional)

If you want to build the binary yourself:

### Prerequisites
- [Bun](https://bun.sh) installed

### Build Steps

```bash
# Clone repository
git clone https://github.com/neverprepared/macos-ecosystem-mcp.git
cd macos-ecosystem-mcp

# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Build binary
bun run build:binary

# Binary will be at: bin/macos-mcp
```

## Comparison: Binary vs Source

### Binary Installation
✅ No Node.js/Bun runtime required
✅ Single file, easy to distribute
✅ Faster startup time
✅ Perfect for end users
❌ Larger file size (~50MB)

### Source Installation
✅ Smaller disk footprint
✅ Easier to modify/contribute
✅ See full source code
❌ Requires Node.js/pnpm or Bun
❌ More setup steps

## Troubleshooting

### "Cannot be opened because the developer cannot be verified"

macOS Gatekeeper may block the binary on first run:

1. **System Settings > Privacy & Security**
2. Scroll to "Security" section
3. Click "Open Anyway" next to the blocked message
4. Confirm "Open"

Or use command line:
```bash
xattr -d com.apple.quarantine /usr/local/bin/macos-mcp
```

### Binary Not Found

Ensure the binary is in your PATH:
```bash
echo $PATH
# Should include /usr/local/bin or your custom location

# If not, add to ~/.zshrc or ~/.bashrc:
export PATH="$HOME/.local/bin:$PATH"
```

### Permission Denied

Make sure the binary is executable:
```bash
chmod +x /usr/local/bin/macos-mcp
```

## Uninstalling

```bash
# Remove binary
sudo rm /usr/local/bin/macos-mcp

# Remove Claude Code configuration
# Edit ~/.claude/mcp.json and remove the "macos-ecosystem" entry

# Revoke macOS permissions (optional)
# System Settings > Privacy & Security > Automation
```

## Security

The binary is built from the open-source code at:
https://github.com/neverprepared/macos-ecosystem-mcp

You can verify the build by:
1. Building from source yourself
2. Comparing checksums with release notes
3. Reviewing the GitHub Actions build logs

## Support

- **Issues**: https://github.com/neverprepared/macos-ecosystem-mcp/issues
- **Latest Release**: https://github.com/neverprepared/macos-ecosystem-mcp/releases/latest
