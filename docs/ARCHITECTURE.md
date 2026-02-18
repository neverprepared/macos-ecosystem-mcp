# Architecture Documentation

## Overview

The macOS Ecosystem MCP Server is built on a **security-first, modular architecture** that separates concerns and provides clear abstraction layers.

## Directory Structure

```
src/
├── server.ts              # MCP server initialization
├── index.ts               # CLI entry point
│
├── executor/              # AppleScript execution layer
│   ├── types.ts           # Execution types and constants
│   ├── validator.ts       # Security validation
│   └── applescript.ts     # Execution wrapper
│
├── apps/                  # App-specific modules
│   ├── reminders/
│   │   ├── types.ts       # TypeScript types
│   │   ├── schemas.ts     # Zod validation schemas
│   │   ├── scripts.ts     # AppleScript generators
│   │   └── index.ts       # MCP tool registration
│   ├── calendar/
│   └── notes/
│
└── shared/                # Shared utilities
    ├── errors.ts          # Custom error classes
    ├── logger.ts          # Structured logging
    └── utils.ts           # Helper functions
```

## Execution Flow

### 1. Tool Invocation

```
Claude Desktop → MCP Protocol → server.ts → App Handler
```

The server receives a tool call via MCP's `CallToolRequestSchema` and routes it to the appropriate app handler.

### 2. Input Validation

```typescript
// schemas.ts - Zod schema defines the contract
const input = AddReminderInputSchema.parse(request.params.arguments);
```

Zod validates:
- Required fields are present
- Types are correct
- Values are within acceptable ranges
- Business rules are satisfied (e.g., end date > start date)

### 3. Script Generation

```typescript
// scripts.ts - Template-based generation
const script = generateAddReminderScript(input);
```

Templates use parameterized generation:
```typescript
const sanitizedTitle = escapeAppleScriptString(params.title);
let script = `
tell application "Reminders"
    set name of newReminder to "${sanitizedTitle}"
end tell
`;
```

**Never** concatenate user input directly into scripts.

### 4. Security Validation

```typescript
// validator.ts - Multi-layer checks
validateScript(script, 'Reminders');
```

Validation checks:
1. Script not empty or too long
2. Target app in whitelist
3. Script targets declared app
4. No forbidden patterns (shell execution, sudo, etc.)
5. Starts with "tell application"

### 5. Execution

```typescript
// applescript.ts - Timeout-protected execution
const result = await executeScript({
  script,
  app: 'Reminders',
  operation: 'add',
  timeout: 10000
});
```

Execution includes:
- Timeout enforcement (default 30s)
- Error detection and classification
- Permission error handling
- Structured logging

### 6. Response Formatting

```typescript
return {
  content: [{
    type: 'text',
    text: `✓ Created reminder "${title}"`
  }]
};
```

Results are formatted as MCP text content blocks.

## Key Design Patterns

### Template-Based Script Generation

**Problem**: String concatenation makes injection attacks easy.

**Solution**: Use templates with sanitization:

```typescript
// ❌ DANGEROUS - Direct concatenation
const script = `tell application "Reminders"
  set name of newReminder to "${userInput}"
end tell`;

// ✅ SAFE - Sanitized template
const sanitized = escapeAppleScriptString(userInput);
const script = `tell application "Reminders"
  set name of newReminder to "${sanitized}"
end tell`;
```

### Defense in Depth

Multiple layers validate the same constraint:

1. **Zod schema**: `title: z.string().min(1).max(500)`
2. **Sanitization**: `escapeAppleScriptString(title)`
3. **Validator**: Checks script structure and patterns
4. **Timeout**: Prevents infinite loops

If one layer fails, others provide protection.

### Error Classification

Custom error types provide semantic information:

```typescript
try {
  await executeScript(ctx);
} catch (error) {
  if (isPermissionError(error.message)) {
    throw new PermissionError(app);
  }
  if (isAppNotFoundError(error.message)) {
    throw new AppNotFoundError(app);
  }
  // ... other classifications
}
```

This allows precise error messages and recovery strategies.

### Structured Logging

All logs go to **stderr** (MCP uses stdout):

```typescript
logger.info('Executing AppleScript', {
  app: ctx.app,
  operation: ctx.operation,
  timeout: ctx.timeout
});
```

Logs include:
- Timestamp
- Log level
- Message
- Structured context (JSON)

## Type Safety

### Zod + TypeScript Integration

Schemas automatically infer TypeScript types:

```typescript
const AddReminderInputSchema = z.object({
  title: z.string().min(1).max(500),
  priority: z.enum(['none', 'low', 'medium', 'high'])
});

// TypeScript type automatically derived:
type AddReminderInput = z.infer<typeof AddReminderInputSchema>;
// = { title: string; priority: 'none' | 'low' | 'medium' | 'high'; ... }
```

This ensures:
- Runtime validation matches compile-time types
- No type drift between schemas and implementations
- Editor autocomplete works correctly

## Extensibility

### Adding a New App

1. Create `src/apps/myapp/` directory
2. Define types: `types.ts`
3. Create Zod schemas: `schemas.ts`
4. Write script generators: `scripts.ts`
5. Register tools: `index.ts`
6. Update `server.ts` to register the app

Example structure:

```typescript
// src/apps/myapp/index.ts
export function registerMyAppTools(server: Server) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'myapp_do_something') {
      // Handle tool call
    }
  });
}

export function getMyAppToolDefinitions() {
  return [/* tool definitions */];
}
```

### Adding a New Tool to Existing App

1. Define types in `types.ts`
2. Add Zod schema in `schemas.ts`
3. Write script generator in `scripts.ts`
4. Register handler in `index.ts`
5. Add tool definition to `get*ToolDefinitions()`

## Performance Considerations

### Script Execution Timeout

Default: 30 seconds. Configurable via `SCRIPT_TIMEOUT` env variable.

Prevents:
- Infinite loops
- Deadlocked scripts
- Resource exhaustion

### Limiting Result Sets

Tools that return lists have `limit` parameters:

```typescript
const ListRemindersInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50)
});
```

Prevents:
- Memory exhaustion from huge result sets
- Slow response times
- MCP message size limits

### Caching Considerations

Currently, no caching is implemented. Future improvements:

- Cache tool definitions (rarely change)
- Cache validation results for identical scripts
- Consider app state caching (with invalidation strategy)

## Testing Strategy

### Unit Tests

Focus on **script generation** and **validation**:

```typescript
describe('generateAddReminderScript', () => {
  it('should escape quotes in inputs', () => {
    const script = generateAddReminderScript({
      title: 'Task with "quotes"'
    });
    expect(script).toContain('Task with \\"quotes\\"');
  });
});
```

### Integration Tests

Not yet implemented. Would require:
- Mock AppleScript execution
- Test full MCP request/response cycle
- Verify error handling end-to-end

## Deployment

### Build Process

```bash
pnpm build  # Compiles TypeScript to dist/
```

Output:
- JavaScript files (.js)
- Source maps (.js.map)
- Type declarations (.d.ts)

### Entry Point

`start.sh` chooses between built and dev mode:

```bash
if [ -f "./dist/index.js" ]; then
  node ./dist/index.js    # Production
else
  npx tsx ./src/index.ts  # Development
fi
```

### Environment Configuration

Production checklist:
- ✅ Set `LOG_LEVEL=info` (not debug)
- ✅ Ensure `ENABLE_SECURITY_VALIDATION=true`
- ✅ Verify macOS permissions granted
- ✅ Test with Claude Desktop

## Future Improvements

### Priority 1 - Stability
- [ ] Integration tests with mocked AppleScript
- [ ] Better AppleScript error parsing
- [ ] Retry logic for transient failures

### Priority 2 - Features
- [ ] Support for recurring calendar events
- [ ] Reminder attachments
- [ ] Notes folder management

### Priority 3 - Performance
- [ ] AppleScript compilation caching
- [ ] Batch operations (add multiple reminders at once)
- [ ] Parallel execution where safe

## Dependencies

Core:
- `@modelcontextprotocol/sdk` - Official MCP TypeScript SDK
- `zod` - Runtime type validation
- `run-applescript` - AppleScript execution
- `date-fns` - Date formatting/parsing

Dev:
- `typescript` - Type checking and compilation
- `tsx` - Direct TypeScript execution
- `vitest` - Fast unit testing
- `eslint` + `prettier` - Code quality

## Monitoring & Observability

Current state:
- Structured logging to stderr
- Log levels: debug, info, warn, error
- Context included in all log messages

Future:
- OpenTelemetry tracing
- Metrics (execution time, error rates)
- Health check endpoint

## Security Considerations

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

Key principles:
1. **Never trust user input** - Always validate and sanitize
2. **Defense in depth** - Multiple validation layers
3. **Principle of least privilege** - Only approved apps, minimal permissions
4. **Fail secure** - Reject on validation failure, don't try to "fix" input
5. **Audit logging** - All operations logged for forensics
