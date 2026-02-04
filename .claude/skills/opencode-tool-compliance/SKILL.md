---
name: opencode-tool-compliance
description: OpenCode custom tool development compliance - tool definition with Zod schemas, execute function patterns, context parameters, error handling, and TUI-safe logging. Use when creating or modifying custom tools for OpenCode plugins.
license: MIT
compatibility: opencode
metadata:
  audience: ai-agents
  workflow: tool-development
---

# OpenCode Tool Compliance

Compliance guidelines for creating custom tools in OpenCode plugins.

## Tool Definition

### Basic Structure

```typescript
import { tool } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "Clear description of what the tool does",
        args: {
          // Zod schema for arguments
          path: tool.schema.string(),
          count: tool.schema.number().optional(),
          options: tool.schema.record(tool.schema.string()).optional(),
        },
        async execute(args, context) {
          // Tool implementation
          return `Result: ${args.path}`
        },
      }),
    },
  }
}
```

### Tool Context Parameters

The `context` parameter provides:

```typescript
{
  directory: string      // Current project directory
  worktree: string       // Git worktree path
  client: SDKClient      // HTTP client for OpenCode API
  $: BunShell           // Shell command execution
}
```

---

## Zod Schema Patterns

### Common Patterns

```typescript
// String argument
path: tool.schema.string()

// Optional string
name: tool.schema.string().optional()

// Number with range
count: tool.schema.number().min(1).max(100)

// Boolean flag
force: tool.schema.boolean()

// Enum (limited choices)
format: tool.schema.enum(["json", "yaml", "toml"])

// Array of strings
files: tool.schema.array(tool.schema.string())

// Record (key-value pairs)
options: tool.schema.record(tool.schema.string())

// Nested object
config: tool.schema.object({
    enabled: tool.schema.boolean(),
    priority: tool.schema.number().default(1),
})
```

---

## Execute Function Guidelines

### Return Values

Tools should return descriptive strings:

```typescript
async execute(args, context) {
  // GOOD - Descriptive result
  return `Analyzed ${args.files.length} files, found 3 issues`

  // GOOD - Structured result
  return JSON.stringify({
    files: args.files,
    issues: 3,
    timestamp: new Date().toISOString()
  }, null, 2)

  // BAD - Generic result
  return "Done"
}
```

### Error Handling

```typescript
async execute(args, context) {
  try {
    const result = await doWork(args)
    return result
  } catch (error) {
    // Log via SDK client (NOT console.log)
    await context.client.app.log({
      service: "mytool",
      level: "error",
      message: `Tool execution failed: ${error.message}`,
      extra: { args },
    })

    // Return error message to user
    return `Error: ${error.message}`
  }
}
```

### File Operations

Use the Bun shell API (`context.$`):

```typescript
async execute(args, context) {
  const { $, directory } = context

  // Check if file exists
  const exists = await $`test -f ${directory}/${args.path}`.exitCode() === 0

  // Read file
  const content = await $`cat ${directory}/${args.path}`.text()

  // Write file (use Write tool for consistency)
  return `File processed successfully`
}
```

### SDK Client Usage

```typescript
async execute(args, context) {
  const { client } = context

  // Query sessions
  const sessions = await client.session.list()

  // Query messages
  const messages = await client.message.list({
    sessionID: args.sessionID
  })

  // Trigger TUI toast
  await Bus.publish(TuiEvent.ToastShow, {
    variant: "info",
    message: "Tool completed successfully",
  })
}
```

---

## Tool Naming Conventions

### Best Practices

- Use **kebab-case** for tool names
- Be descriptive but concise
- Avoid conflicting with built-in tools

### Examples

```typescript
// GOOD
git-status-search
project-stats
dependency-analyzer

// BAD - too generic
run
execute
helper

// BAD - conflicts with built-ins
read    // Built-in tool
write   // Built-in tool
grep    // Built-in tool
```

---

## Common Tool Patterns

### 1. File Analysis Tool

```typescript
fileAnalyzer: tool({
  description: "Analyze project files for patterns",
  args: {
    pattern: tool.schema.string(),
    filePattern: tool.schema.string().default("*.{ts,js}"),
  },
  async execute(args, context) {
    const { $, directory } = context
    const results = await $`grep -r ${args.pattern} ${directory}/${args.filePattern}`
      .quiet()
      .text()

    const lines = results.split('\n').filter(Boolean)
    return `Found ${lines.length} matches`
  },
})
```

### 2. Project Statistics Tool

```typescript
projectStats: tool({
  description: "Calculate project statistics",
  args: {
    includeTests: tool.schema.boolean().default(false),
  },
  async execute(args, context) {
    const { $, directory } = context

    const [files, lines, comments] = await Promise.all([
      $`find ${directory} -name "*.ts" -o -name "*.js" | wc -l`.text(),
      $`find ${directory} -name "*.ts" -o -name "*.js" | xargs wc -l | awk '{sum+=$1} END {print sum}'`.text(),
      $`grep -r "//" ${directory} --include="*.ts" --include="*.js" | wc -l`.text(),
    ])

    return {
      files: files.trim(),
      lines: lines.trim(),
      comments: comments.trim(),
    }
  },
})
```

### 3. Git Integration Tool

```typescript
gitStatus: tool({
  description: "Get git status information",
  args: {
    path: tool.schema.string().optional().default("."),
  },
  async execute(args, context) {
    const { $, worktree } = context
    const target = `${worktree}/${args.path}`.replace(/\/$/, '')

    const [branch, status, changed] = await Promise.all([
      $`cd ${target} && git rev-parse --abbrev-ref HEAD`.text().trim(),
      $`cd ${target} && git status --porcelain`.text().trim(),
      $`cd ${target} && git diff --name-only`.text().trim(),
    ])

    return JSON.stringify({
      branch,
      status: status || "clean",
      changed: changed ? changed.split('\n') : [],
    }, null, 2)
  },
})
```

---

## Tool Performance

### Best Practices

1. **Avoid blocking operations** - Keep tool execution fast
2. **Return early for validation** - Check inputs before processing
3. **Use streaming for large output** - Don't buffer huge results
4. **Cache when appropriate** - Store expensive computation results

```typescript
async execute(args, context) {
  // Validate inputs first
  if (!args.path || args.path.includes('..')) {
    return "Error: Invalid path"
  }

  // Use timeout for long operations
  const result = await Promise.race([
    doExpensiveWork(args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 30000)
    ),
  ])

  return result
}
```

---

## Resources

See [references/patterns.md](references/patterns.md) for more tool implementation patterns.

See [opencode-tui-safety](../opencode-tui-safety/) for TUI-safe logging guidelines.

See [opencode-plugin-compliance](../opencode-plugin-compliance/) for plugin structure.
