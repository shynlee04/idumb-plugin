---
name: opencode-tui-safety
description: OpenCode TUI safety guidelines - avoid console.log pollution, use proper logging, interact with TUI events, understand 60 FPS rendering constraints, and prevent performance degradation. Use when creating or modifying OpenCode plugins/tools that interact with the Terminal UI.
license: MIT
compatibility: opencode
metadata:
  audience: ai-agents
  workflow: plugin-development
---

# OpenCode TUI Safety

Guidelines for developing OpenCode plugins that integrate safely with the Terminal UI without causing visual pollution, performance degradation, or rendering issues.

## TUI Architecture Overview

### Rendering System

OpenCode's TUI is built on **@opentui/solid** (SolidJS-based terminal rendering) configured for **60 FPS rendering**.

```typescript
// TUI configuration (for reference)
render(
  () => <App />,
  {
    targetFps: 60,
    useKittyKeyboard: {},
    consoleOptions: {
      keyBindings: [{ name: "y", ctrl: true, action: "copy-selection" }],
    },
  }
)
```

### Provider Architecture

The TUI uses a nested provider architecture (outer to inner):

```
ArgsProvider → ExitProvider → KVProvider → ToastProvider → RouteProvider
  → SDKProvider → SyncProvider → ThemeProvider → LocalProvider
  → KeybindProvider → PromptStashProvider → DialogProvider
  → CommandProvider → FrecencyProvider → PromptHistoryProvider
  → PromptRefProvider → App
```

**Key implication**: Plugins do NOT have direct access to these providers. All interaction must go through events or hooks.

---

## Critical Rule: NO console.log

### The Problem

Using `console.log` in plugins causes **TUI background text pollution**. The text appears behind the TUI rendering, creating visual artifacts that persist until the terminal is cleared.

```typescript
// WRONG - Causes TUI pollution
export const MyPlugin = async ({ client }) => {
  console.log("Plugin initialized") // Text appears in background
  console.error("Error occurred")   // More pollution
}
```

### The Solution

Use `client.app.log()` for structured logging that integrates with OpenCode's logging system:

```typescript
// CORRECT - Structured logging
export const MyPlugin: Plugin = async ({ client }) => {
  await client.app.log({
    service: "my-plugin",
    level: "info",
    message: "Plugin initialized",
    extra: { version: "1.0.0" },
  })
}
```

### Log Levels

```typescript
await client.app.log({
  service: "my-plugin",
  level: "info",    // or "warn", "error", "debug"
  message: "Descriptive message",
  extra: {
    key: "value",    // Additional context
    error: errorObj, // Error objects
  },
})
```

---

## TUI Event Interaction

Plugins interact with the TUI through events, NOT direct component manipulation.

### Available TUI Events

| Event | Purpose | Properties |
|-------|---------|------------|
| `tui.prompt.append` | Append text to prompt input | `{ text: string }` |
| `tui.command.execute` | Execute TUI command | `{ command: string }` |
| `tui.toast.show` | Show toast notification | `{ variant, title, message, duration }` |
| `tui.session.select` | Navigate to session | `{ sessionID: string }` |

### Using TUI Events

```typescript
import { Bus } from "@/bus"
import { TuiEvent } from "@/cli/cmd/tui/event"

// In a hook or tool
await Bus.publish(TuiEvent.ToastShow, {
  variant: "info",
  message: "Tool completed successfully",
})
```

### Examples

**Show Toast Notification:**

```typescript
"tool.execute.after": async (input, output) => {
  await Bus.publish(TuiEvent.ToastShow, {
    variant: "success",
    title: "Done",
    message: `Processed ${input.tool} successfully`,
    duration: 3000,
  })
}
```

**Append to Prompt:**

```typescript
await Bus.publish(TuiEvent.PromptAppend, {
  text: " --additional-flag"
})
```

**Execute TUI Command:**

```typescript
await Bus.publish(TuiEvent.CommandExecute, {
  command: "status_view"
})
```

---

## Performance Guidelines

### 60 FPS Constraint

The TUI renders at 60 FPS. Plugins must not block the render loop.

### Do's and Don'ts

```typescript
// DON'T - Blocking operations in hooks
"tool.execute.before": async (input, output) => {
  const result = await reallyLongOperation() // Blocks TUI
}

// DO - Use timeouts or background tasks
"tool.execute.before": async (input, output) => {
  const result = await Promise.race([
    doWork(input),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    ),
  ])
}
```

### Message History Management

The TUI automatically truncates message history to the most recent 100 messages to prevent memory issues. Plugins should not rely on unlimited message history.

---

## Plugin Loading Order

Understanding load priority helps avoid conflicts:

1. **Internal plugins** (built-in)
2. **Built-in npm plugins** (opencode-anthropic-auth, etc.)
3. **Global config** (`~/.config/opencode/opencode.json`)
4. **Project config** (`opencode.json`)
5. **Global plugin directory** (`~/.config/opencode/plugins/`)
6. **Project plugin directory** (`.opencode/plugins/`)

**Key implication**: Local plugins override npm packages with the same name.

---

## Common Anti-Patterns

### ❌ Anti-Pattern 1: Direct Console Output

```typescript
// WRONG
console.log("Debug info")
console.warn("Warning")
console.error("Error")
```

**Fix**: Use `client.app.log()`

### ❌ Anti-Pattern 2: Blocking Hooks

```typescript
// WRONG
event: async (input) => {
  await fetch("https://slow-api.com/data") // Blocks every event
}
```

**Fix**: Use caching or background processing

### ❌ Anti-Pattern 3: Direct UI Access

```typescript
// WRONG - This doesn't work
import { SomeComponent } from "@/component"
SomeComponent.forceUpdate()
```

**Fix**: Use TUI events to trigger UI changes

### ❌ Anti-Pattern 4: Heavy Computation in Hooks

```typescript
// WRONG
"tool.execute.after": async (input, output) => {
  const result = processHugeDataset(output.output) // 10+ seconds
}
```

**Fix**: Offload to tools or use incremental processing

---

## Best Practices

### ✅ Pattern 1: Structured Logging

```typescript
try {
  await riskyOperation()
} catch (error) {
  await client.app.log({
    service: "my-plugin",
    level: "error",
    message: "Operation failed",
    extra: {
      error: error.message,
      stack: error.stack,
      context: { sessionId: input.sessionID },
    },
  })
}
```

### ✅ Pattern 2: Non-Blocking Hooks

```typescript
event: async (input) => {
  if (input.event.type !== "tool.execute.after") return
  // Only process relevant events
  await handleEvent(input)
}
```

### ✅ Pattern 3: TUI Event Feedback

```typescript
async execute(args, context) {
  try {
    const result = await process(args)
    await Bus.publish(TuiEvent.ToastShow, {
      variant: "success",
      message: "Completed successfully",
    })
    return result
  } catch (error) {
    await Bus.publish(TuiEvent.ToastShow, {
      variant: "error",
      message: `Error: ${error.message}`,
      duration: 5000,
    })
    throw error
  }
}
```

### ✅ Pattern 4: Graceful Degradation

```typescript
"tool.execute.before": async (input, output) => {
  try {
    // Your logic
  } catch (error) {
    // Log but don't throw - let other plugins run
    await client.app.log({
      service: "my-plugin",
      level: "warn",
      message: "Hook processing failed, continuing",
      extra: { error: String(error) },
    })
  }
}
```

---

## Troubleshooting

### TUI Pollution Symptoms

If you see text appearing behind the OpenCode interface:
1. Check your plugin code for `console.log` calls
2. Check dependencies for console output
3. Use `client.app.log()` instead

### Performance Issues

If the TUI feels laggy:
1. Profile your hooks for blocking operations
2. Check if you're processing too many events
3. Consider caching expensive operations

### Events Not Working

If TUI events don't trigger:
1. Verify event name matches exactly (`tui.toast.show`, etc.)
2. Check event properties match the schema
3. Ensure `Bus` is imported from correct path

---

## Resources

See [opencode-plugin-compliance](../opencode-plugin-compliance/) for hook system details.

See [opencode-tool-compliance](../opencode-tool-compliance/) for tool development patterns.

See [references/tui-architecture.md](references/tui-architecture.md) for detailed TUI architecture documentation.
