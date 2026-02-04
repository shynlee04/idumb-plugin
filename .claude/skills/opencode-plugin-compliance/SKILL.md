---
name: opencode-plugin-compliance
description: OpenCode plugin development compliance - hook system, event subscriptions, tool interception, SDK usage, storage boundaries, and plugin architecture. Use when creating, modifying, or validating OpenCode plugins to ensure compliance with official plugin capabilities and limitations.
license: MIT
compatibility: opencode
metadata:
  audience: ai-agents
  workflow: plugin-development
---

# OpenCode Plugin Compliance

Compliance guidelines for OpenCode plugin development. Ensures plugins work within official capabilities and avoid breaking changes.

## Plugin Architecture

### Core Principle

OpenCode plugins use a **hook-based architecture**. Plugins can only act at predefined extension points. This is by design for security and stability.

### Plugin Input Context

Every plugin receives:

```typescript
{
  client: ReturnType<typeof createOpencodeClient>,  // SDK client
  project: Project,                                   // Project info
  directory: string,                                  // Current directory
  worktree: string,                                   // Git worktree
  serverUrl: URL,                                    // Server endpoint
  $: BunShell                                        // Shell API
}
```

### Required Export

```typescript
export const MyPlugin: Plugin = async (ctx) => {
  return {
    // hooks
  }
}
```

---

## What Plugins CAN Do

### 1. Event Subscription (Read-Only)

Subscribe to ALL system events via the `event` hook:

```typescript
export const MyPlugin: Plugin = async ({ client }) => {
  return {
    event: async (input) => {
      const { event } = input
      // React to events
      await client.app.log({
        service: "my-plugin",
        level: "info",
        message: `Event: ${event.type}`,
      })
    },
  }
}
```

**Available Events:**
- Session: `session.created`, `session.updated`, `session.deleted`, `session.compacted`
- Message: `message.updated`, `message.part.updated`, `message.removed`
- Tool: `tool.execute.before`, `tool.execute.after`
- File: `file.edited`, `file.watcher.updated`
- Permission: `permission.asked`, `permission.replied`
- Command: `command.executed`
- LSP: `lsp.client.diagnostics`, `lsp.updated`
- TUI: `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`

### 2. Tool Execution Interception

**Before execution** - Modify arguments or block:

```typescript
"tool.execute.before": async (input, output) => {
  if (input.tool === "read" && output.args.filePath?.includes(".env")) {
    throw new Error("Do not read .env files")
  }
  // Modify arguments
  if (input.tool === "write") {
    output.args.content = transformContent(output.args.content)
  }
}
```

**After execution** - Transform results:

```typescript
"tool.execute.after": async (input, output) => {
  if (input.tool === "grep") {
    output.title = `Search results for ${output.metadata.query}`
    output.output = formatResults(output.output)
  }
}
```

### 3. Custom Tools

Register new tools via the `tool` export:

```typescript
import { tool } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "Does something useful",
        args: {
          path: tool.schema.string(),
          options: tool.schema.record(tool.schema.string()).optional(),
        },
        async execute(args, context) {
          const { directory, worktree, client, $ } = context
          // Your logic here
          return `Result: ${args.path}`
        },
      }),
    },
  }
}
```

### 4. Permission Interception

Automate permission decisions:

```typescript
"permission.ask": async (input, output) => {
  // Auto-allow read operations on safe files
  if (input.tool === "read" && isSafeFile(input.sessionID, input.args.filePath)) {
    output.status = "allow"
  }
  // Auto-deny dangerous operations
  if (input.tool === "bash" && isDangerousCommand(input.args.command)) {
    output.status = "deny"
  }
}
```

### 5. Session Compaction Customization

Inject context that survives compaction:

```typescript
"experimental.session.compacting": async (input, output) => {
  // Append to default prompt
  output.context.push(`
## Project Context

Framework: React + TypeScript
Current Task: Implementing user authentication
Key Files: src/auth/login.ts, src/auth/session.ts
`)

  // Or replace entirely
  output.prompt = `Custom compaction prompt...`
}
```

### 6. Message Transformation (Experimental)

```typescript
"experimental.chat.messages.transform": async (input, output) => {
  // Modify messages before LLM
  output.messages = output.messages.filter(m =>
    m.info.role !== "system" || m.parts[0].text.includes("required")
  )
}

"experimental.chat.system.transform": async (input, output) => {
  // Modify system prompt
  output.system.push("Additional context...")
}

"experimental.text.complete": async (input, output) => {
  // Modify text immediately after LLM generates
  output.text = postProcess(output.text)
}
```

### 7. LLM Parameters

```typescript
"chat.params": async (input, output) => {
  output.temperature = 0.7
  output.topP = 0.9
}

"chat.headers": async (input, output) => {
  output.headers["X-Custom-Header"] = "value"
}
```

---

## What Plugins CANNOT Do

### Direct Storage Access

**NOT ALLOWED:**
- Directly access `storage/session/`, `storage/message/` JSON files
- Bypass the Storage API
- Modify internal state outside hooks

**WORKAROUND:** Use the SDK client:

```typescript
const sessions = await client.session.list()
const messages = await client.message.list({ sessionID })
```

### Modifying Stored Messages

**NOT ALLOWED:**
- Retroactively edit messages in storage
- Delete or modify message parts directly
- Change message metadata after creation

**WORKAROUND:** Use `experimental.chat.messages.transform` before LLM processing.

### Blocking Event Propagation

**NOT ALLOWED:**
- Prevent events from being published
- Block other plugins from receiving events
- Modify events in the bus stream

### Session State Modification

**NOT ALLOWED:**
- Change session metadata directly
- Manipulate parent-child relationships
- Delete or archive sessions programmatically

### Agent Control

**NOT ALLOWED:**
- Directly control agent switching
- Modify agent execution loop
- Intercept inner cycle messages separately

### Core Runtime Changes

**NOT ALLOWED:**
- Replace or override built-in tools
- Change event bus behavior
- Modify session prompt loop logic
- Access Provider/Model configurations dynamically

---

## Best Practices

### 1. Use SDK Client for Logging

**NEVER use `console.log`** - causes TUI background text pollution:

```typescript
// CORRECT
await client.app.log({
  service: "my-plugin",
  level: "info",
  message: "Plugin initialized",
  extra: { key: "value" },
})

// WRONG - TUI pollution
console.log("Plugin initialized")
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
"tool.execute.before": async (input, output) => {
  try {
    // Your logic
  } catch (error) {
    await client.app.log({
      service: "my-plugin",
      level: "error",
      message: "Tool execution failed",
      extra: { error: String(error), tool: input.tool },
    })
    // Don't throw - let other plugins run
  }
}
```

### 3. Hook Ordering

Hooks run in sequence. Don't assume order:

```typescript
// Multiple plugins may implement the same hook
// Your hook should work regardless of other plugins
```

### 4. Experimental Hooks

Experimental hooks may change:

```typescript
// Always check if hook exists before using
if ("experimental.chat.messages.transform" in hookDefinition) {
  // Use experimental feature
}
```

---

## Plugin Loading Order

Load priority (highest to lowest):
1. Internal plugins (built-in)
2. Built-in npm plugins
3. Global config (`~/.config/opencode/opencode.json`)
4. Project config (`opencode.json`)
5. Global plugin directory (`~/.config/opencode/plugins/`)
6. Project plugin directory (`.opencode/plugins/`)

**Implication:** Local plugins override npm packages with the same name.

---

## Resources

See [references/hooks.md](references/hooks.md) for complete hook interface definitions.

See [references/events.md](references/events.md) for all available event types.

See [opencode-tui-safety](../opencode-tui-safety/) for TUI-specific guidelines.

See [opencode-conflict-prevention](../opencode-conflict-prevention/) for avoiding plugin conflicts.
