#!/bin/bash
set -e

echo "Building macOS Ecosystem MCP Server binary..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed"
    echo "Install with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Ensure dependencies are installed
echo "Installing dependencies..."
bun install

# Build TypeScript to JavaScript first
echo "Compiling TypeScript..."
bun run build

# Create binary output directory
mkdir -p bin

# Compile to standalone binary
echo "Creating standalone binary..."
bun build dist/index.js \
  --compile \
  --minify \
  --outfile bin/macos-mcp

# Make it executable
chmod +x bin/macos-mcp

echo "✓ Binary created at: bin/macos-mcp"
echo ""
echo "Test with: ./bin/macos-mcp"
echo "File size: $(du -h bin/macos-mcp | cut -f1)"
