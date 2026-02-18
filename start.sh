#!/bin/bash
set -e

# Entry point script for macOS MCP Server
# Uses built version if available, otherwise runs with tsx

if [ -f "./dist/index.js" ]; then
  echo "Starting from built version..." >&2
  node ./dist/index.js
else
  echo "No built version found, running with tsx..." >&2
  npx tsx ./src/index.ts
fi
