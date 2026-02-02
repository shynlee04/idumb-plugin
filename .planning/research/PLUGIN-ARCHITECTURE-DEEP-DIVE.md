# OpenCode Plugin Architecture Deep Dive

**Research Date:** 2026-02-02  
**Sources:** OpenCode Official Documentation, Source Code Analysis, Community Plugins  
**Confidence:** HIGH (verified with official docs and source code)  

---

## Executive Summary

OpenCode's plugin architecture provides a powerful event-driven system for extending the AI coding agent without modifying core code. The architecture follows a **hooks-based pattern** where plugins subscribe to lifecycle events and intercept points through a well-defined API.

**Key architectural principles:**
- **Event Subscription Model**: Plugins can listen to ALL system events through a single `event` hook
- **Lifecycle Hooks**: Writable hooks allow plugins to modify behavior and data at critical interception points
- **Seamless Integration**: Plugins load from both local files and npm with automatic dependency management
- **Safe Extension**: Plugin hooks run sequentially, allowing composition without conflicts

**For iDumb v2 as a plugin**: This architecture enables iDumb to intercept session creation, tool execution, message transformation, and compaction — effectively taking over GSD orchestration from within OpenCode.

---

## 1. Plugin Structure

### 1.1 Core Plugin Definition

A plugin is a JavaScript/TypeScript module that exports one or more plugin functions:

```typescript
// Basic plugin structure
export const MyPlugin = async ({ project, client, $, directory, worktree }) => {
  console.log("Plugin initialized!")
  return {
    // Hook implementations go here
  }
}
```

**Plugin Context (`PluginInput`)** — Passed to every plugin:

| Property | Type | Description |
|----------|------|-------------|
| `client` | `OpenCodeClient` | SDK client for interacting with OpenCode server |
| `project` | `Project` | Current project information |
| `directory` | `string` | Current working directory |
| `worktree` | `string` | Git worktree path |
| `serverUrl` | `URL` | OpenCode server URL |
| `$` | `BunShell` | Bun's shell API for command execution |

### 1.2 Loading Mechanisms

**Two primary loading paths:**

#### A. Local File Loading

Plugins loaded from filesystem directories:

| Location | Scope | Use Case |
|----------|-------|----------|
| `.opencode/plugins/` | Project-level | Project-specific plugins (committed to repo) |
| `~/.config/opencode/plugins/` | Global | User-wide plugins (personal preferences) |

**Local plugin characteristics:**
- Loaded via direct `import()` call
- Supports both `.js` and `.ts` files
- Hot-loaded at OpenCode startup
- Can have dependencies via local `package.json`

#### B. NPM Package Loading

Plugins installed from npm registry:

```json
// opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-helicone-session",
    "@my-org/custom-plugin@1.2.0"
  ]
}
```

**NPM plugin installation process:**

1. **At startup**, OpenCode iterates through configured plugins
2. **Bun installs** packages to `~/.cache/opencode/node_modules/`
3. **Cached packages** prevent re-installation if version matches
4. **Dynamic import** loads the plugin module

```typescript
// From source: packages/opencode/src/plugin/index.ts
const plugins = [...(config.plugin ?? [])]
for (let plugin of plugins) {
  if (!plugin.startsWith("file://")) {
    const lastAtIndex = plugin.lastIndexOf("@")
    const pkg = lastAtIndex > 0 ? plugin.substring(0, lastAtIndex) : plugin
    const version = lastAtIndex > 0 ? plugin.substring(lastAtIndex + 1) : "latest"
    plugin = await BunProc.install(pkg, version)
  }
  const mod = await import(plugin)
  // Execute plugin function
}
```

**Version specification:**
- `plugin-name` → installs `latest`
- `plugin-name@1.2.0` → installs specific version
- Supports scoped packages: `@org/plugin-name`

### 1.3 Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DISCOVERY                                               │
│     ├── Read global config (~/.config/opencode/)            │
│     ├── Read project config (opencode.json)                 │
│     ├── Scan global plugin directory                        │
│     └── Scan project plugin directory                       │
│                                                             │
│  2. LOADING                                                 │
│     ├── Load internal plugins (built-in)                    │
│     ├── Load npm plugins (install if needed)                │
│     └── Load local plugins (direct import)                  │
│                                                             │
│  3. INITIALIZATION                                          │
│     ├── Create PluginInput context                          │
│     ├── Execute plugin function(s)                          │
│     └── Collect returned Hooks objects                      │
│                                                             │
│  4. REGISTRATION                                            │n│     ├── Register hooks in global hooks array                │
│     └── Subscribe to Bus events if 'event' hook present     │
│                                                             │
│  5. EXECUTION (Runtime)                                     │
│     ├── Trigger hooks when events occur                     │
│     ├── Execute sequentially (deterministic order)          │
│     └── Allow modification of output parameters             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Load Order

Plugins execute in this deterministic order:

1. **Global config** (`~/.config/opencode/opencode.json`)
2. **Project config** (`opencode.json`)
3. **Global plugin directory** (`~/.config/opencode/plugins/`)
4. **Project plugin directory** (`.opencode/plugins/`)

**Important:** Hooks run **sequentially** across all plugins. Earlier plugins can modify outputs that later plugins receive.

### 1.5 Plugin Configuration

**Dependencies for local plugins:**

Create a `package.json` in your config directory:

```json
// .opencode/package.json
{
  "dependencies": {
    "shescape": "^2.1.0",
    "zod": "^3.22.0"
  }
}
```

OpenCode runs `bun install` at startup to install these. Plugins can then import them:

```typescript
import { escape } from "shescape"

export const MyPlugin = async (ctx) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        output.args.command = escape(output.args.command)
      }
    },
  }
}
```

---

## 2. Event System

### 2.1 Event Subscription Model

OpenCode uses an internal **Bus system** for event publishing. Plugins receive ALL events through a single `event` hook:

```typescript
export const EventPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    event: async ({ event }) => {
      // Receives EVERY event from OpenCode's Bus
      console.log("Event received:", event.type)
    },
  }
}
```

**Event hook characteristics:**
- **Read-only**: Events cannot be prevented or modified
- **Fire-and-forget**: Async handlers, no return value
- **All events**: Single hook receives every system event

### 2.2 Complete Event Catalog

#### Command Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `command.executed` | User executes a command | Command details |

#### File Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `file.edited` | File is modified | File path, changes |
| `file.watcher.updated` | File watcher detects change | File path |

#### Installation Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `installation.updated` | Installation state changes | Installation info |

#### LSP Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `lsp.client.diagnostics` | LSP diagnostics received | Diagnostics array |
| `lsp.updated` | LSP state changes | LSP status |

#### Message Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `message.part.removed` | Message part deleted | Part ID |
| `message.part.updated` | Message part modified | Part details |
| `message.removed` | Message deleted | Message ID |
| `message.updated` | Message modified | Message details |

#### Permission Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `permission.asked` | Permission requested | Permission details |
| `permission.replied` | Permission response received | Response status |

#### Server Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `server.connected` | Client connects to server | Connection info |

#### Session Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `session.created` | New session created | Session info |
| `session.compacted` | Session history compacted | Compaction details |
| `session.deleted` | Session removed | Session ID |
| `session.diff` | Session state diff generated | Diff details |
| `session.error` | Session encounters error | Error details |
| `session.idle` | Session completes work | Session ID |
| `session.status` | Session status changes | Status details |
| `session.updated` | Session metadata changes | Session info |

#### Todo Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `todo.updated` | Todo list changes | Todo items |

#### Tool Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `tool.execute.after` | Tool execution completed | Tool result |
| `tool.execute.before` | Tool execution starting | Tool call |

#### TUI Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `tui.prompt.append` | Text appended to prompt | Text content |
| `tui.command.execute` | TUI command executed | Command details |
| `tui.toast.show` | Toast notification shown | Toast message |

### 2.3 Event Subscription Pattern

```typescript
// Event subscription with filtering
export const SmartPlugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      switch (event.type) {
        case "session.created":
          await handleNewSession(event.properties)
          break
        case "session.idle":
          await sendNotification("Session completed!")
          break
        case "tool.execute.before":
          logToolUsage(event.properties.tool)
          break
        case "permission.asked":
          auditPermissionRequest(event.properties)
          break
      }
    },
  }
}
```

### 2.4 Event Interception Points

**Critical insight**: While the `event` hook is read-only, **lifecycle hooks** at the same interception points allow modification:

| Event | Corresponding Hook | Can Modify? |
|-------|-------------------|-------------|
| `tool.execute.before` | `tool.execute.before` | ✅ Yes (args) |
| `tool.execute.after` | `tool.execute.after` | ✅ Yes (result) |
| `permission.asked` | `permission.ask` | ✅ Yes (decision) |
| `command.executed` | `command.execute.before` | ✅ Yes (parts) |
| `session.compacted` | `experimental.session.compacting` | ✅ Yes (prompt) |
| `session.created` | (none) | ❌ No (read-only) |

---

## 3. Hooks

### 3.1 Hook Execution Model

Hooks are **writable interception points** where plugins can modify behavior:

```typescript
// From source: packages/opencode/src/plugin/index.ts
export async function trigger<Name extends keyof Hooks>(
  name: Name,
  input: Input,
  output: Output
): Promise<Output> {
  for (const hook of await state().then((x) => x.hooks)) {
    const fn = hook[name]
    if (!fn) continue
    await fn(input, output)  // Modifies output by reference
  }
  return output
}
```

**Key characteristics:**
- **Sequential execution**: Plugins run in load order
- **Output mutation**: Modifies `output` parameter by reference
- **Error propagation**: Throwing stops execution chain
- **Input read-only**: `input` is not modified

### 3.2 Complete Hook Reference

#### Chat Message Hooks

**`chat.message`** — Intercept new user messages

```typescript
"chat.message"?: (
  input: {
    sessionID: string
    agent?: string
    model?: { providerID: string; modelID: string }
    messageID?: string
    variant?: string
  },
  output: { message: UserMessage; parts: Part[] }
) => Promise<void>
```

**`chat.params`** — Modify LLM parameters

```typescript
"chat.params"?: (
  input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
  output: { temperature: number; topP: number; topK: number; options: Record<string, any> }
) => Promise<void>
```

**`chat.headers`** — Modify request headers

```typescript
"chat.headers"?: (
  input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
  output: { headers: Record<string, string> }
) => Promise<void>
```

#### Permission Hooks

**`permission.ask`** — Control permission decisions

```typescript
"permission.ask"?: (
  input: Permission,
  output: { status: "ask" | "deny" | "allow" }
) => Promise<void>
```

**Use cases:**
- Auto-allow certain safe operations
- Auto-deny sensitive operations
- Add approval workflows

```typescript
export const PermissionPlugin = async () => {
  return {
    "permission.ask": async (input, output) => {
      // Auto-allow read operations
      if (input.tool === "read" && !input.args.filePath.includes(".env")) {
        output.status = "allow"
      }
      // Auto-deny sensitive files
      if (input.args.filePath?.includes("secrets")) {
        output.status = "deny"
      }
    },
  }
}
```

#### Command Hooks

**`command.execute.before`** — Intercept command execution

```typescript
"command.execute.before"?: (
  input: { command: string; sessionID: string; arguments: string },
  output: { parts: Part[] }
) => Promise<void>
```

#### Tool Execution Hooks

**`tool.execute.before`** — Intercept before tool runs

```typescript
"tool.execute.before"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any }
) => Promise<void>
```

**`tool.execute.after`** — Modify after tool runs

```typescript
"tool.execute.after"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { title: string; output: string; metadata: any }
) => Promise<void>
```

**Example — Blocking tool execution:**

```typescript
export const EnvProtection = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files")
      }
    },
  }
}
```

#### Experimental Hooks (Advanced)

**`experimental.chat.messages.transform`** — Transform ALL messages before LLM

```typescript
"experimental.chat.messages.transform"?: (
  input: {},
  output: {
    messages: {
      info: Message
      parts: Part[]
    }[]
  }
) => Promise<void>
```

**⚠️ Warning**: This hook transforms the entire message history. Use with caution.

**Use cases:**
- Inject context into conversation
- Filter sensitive information
- Modify system prompts dynamically

```typescript
export const MessageTransformPlugin = async () => {
  return {
    "experimental.chat.messages.transform": async (input, output) => {
      // Inject context at the beginning
      output.messages.unshift({
        info: { role: "system", id: "context" },
        parts: [{ type: "text", text: "Current task: Implement user authentication" }]
      })
    },
  }
}
```

**`experimental.chat.system.transform`** — Transform system prompts

```typescript
"experimental.chat.system.transform"?: (
  input: { sessionID?: string; model: Model },
  output: { system: string[] }
) => Promise<void>
```

**`experimental.session.compacting`** — Customize session compaction

```typescript
"experimental.session.compacting"?: (
  input: { sessionID: string },
  output: { context: string[]; prompt?: string }
) => Promise<void>
```

**Use cases:**
- Inject domain-specific context into compaction
- Replace default compaction prompt entirely
- Preserve custom state across compaction

```typescript
export const CompactionPlugin = async () => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Add custom context
      output.context.push(`
## iDumb Governance State
Current Phase: Implementation
Active Tasks: 3
Last Validation: 2026-02-02
      `)
      
      // Or replace entire prompt
      // output.prompt = "Custom compaction prompt..."
    },
  }
}
```

### 3.3 Hook Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOOK EXECUTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User sends message                                              │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                             │
│  │  chat.message   │ ← Plugin can modify message/parts           │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ chat.params     │ ← Plugin can modify LLM parameters          │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────┐                   │
│  │ experimental.chat.messages.transform     │                   │
│  └────────┬─────────────────────────────────┘                   │
│           │ ← Plugin can modify ENTIRE message history          │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ chat.headers    │ ← Plugin can add/modify headers            │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  LLM Request Sent                                                │
│           │                                                      │
│           ▼                                                      │
│  Tool Execution Needed                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ permission.ask  │ ← Plugin can auto-allow/deny               │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────┐                                         │
│  │ tool.execute.before │ ← Plugin can modify args               │
│  └────────┬────────────┘                                         │
│           │                                                      │
│           ▼                                                      │
│  Tool Executes                                                   │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────┐                                          │
│  │ tool.execute.after │ ← Plugin can modify result              │
│  └────────┬───────────┘                                          │
│           │                                                      │
│           ▼                                                      │
│  Response returned to LLM                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Behavior Modification Patterns

#### Pattern 1: Argument Transformation

```typescript
"tool.execute.before": async (input, output) => {
  // Sanitize arguments before execution
  if (input.tool === "bash") {
    output.args.command = output.args.command.replace(/rm -rf \//g, "")
  }
}
```

#### Pattern 2: Result Transformation

```typescript
"tool.execute.after": async (input, output) => {
  // Filter sensitive data from results
  if (input.tool === "read" && output.output.includes("API_KEY")) {
    output.output = output.output.replace(/API_KEY=[^\s]+/g, "API_KEY=***")
  }
}
```

#### Pattern 3: Execution Blocking

```typescript
"tool.execute.before": async (input, output) => {
  // Block dangerous operations
  if (input.tool === "bash" && output.args.command.includes("sudo")) {
    throw new Error("Sudo commands are blocked by policy")
  }
}
```

#### Pattern 4: Side Effects

```typescript
"tool.execute.after": async (input, output) => {
  // Log all file modifications
  if (input.tool === "edit_file") {
    await auditLog.record({
      action: "file_edited",
      file: output.metadata.path,
      timestamp: new Date()
    })
  }
}
```

---

## 4. Plugin Distribution

### 4.1 NPM Publishing

**Package requirements:**

```json
{
  "name": "opencode-my-plugin",
  "version": "1.0.0",
  "description": "My OpenCode plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["opencode", "plugin"],
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.0.0"
  },
  "files": ["dist/"]
}
```

**Build configuration (tsup):**

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["@opencode-ai/plugin"]
})
```

### 4.2 Global vs Local Installation

| Aspect | Global (NPM) | Local (File) |
|--------|--------------|--------------|
| **Scope** | User-wide | Project-specific |
| **Version control** | Not in repo | Committed to repo |
| **Sharing** | Easy (just npm name) | Requires file sharing |
| **Updates** | Automatic (latest) | Manual file updates |
| **Use case** | Universal plugins | Project-specific logic |

### 4.3 Runtime Compatibility (npx/pnpm/bunx)

OpenCode uses **Bun** for package management internally:

```typescript
// From source
plugin = await BunProc.install(pkg, version)
```

**Compatibility matrix:**

| Package Manager | OpenCode Plugin Install | Notes |
|-----------------|------------------------|-------|
| npm | ✅ Works | Packages installed to `~/.cache/opencode/node_modules/` |
| yarn | ✅ Works | Same as npm |
| pnpm | ✅ Works | Same as npm |
| bun | ✅ Works | Native, fastest |
| npx | ⚠️ Indirect | OpenCode handles, not user |

**User workflow is package-manager-agnostic** — they just add to `opencode.json`:

```json
{
  "plugin": ["opencode-my-plugin"]
}
```

### 4.4 Best Practices for Distribution

#### 1. Scoped Naming

Use `@org/opencode-plugin-name` for organization plugins:

```json
{
  "plugin": [
    "@idumb/gsd-plugin",
    "@idumb/validation-plugin"
  ]
}
```

#### 2. Semantic Versioning

Follow semver for plugin versions:
- `1.0.0` → Initial stable release
- `1.1.0` → New features, backward compatible
- `2.0.0` → Breaking changes

#### 3. Documentation

Required in README:
- Installation instructions
- Configuration options
- Event/hook usage
- Example use cases

#### 4. Testing Strategy

```typescript
// Test helper for plugins
export async function testPlugin(pluginFn, mockContext) {
  const hooks = await pluginFn(mockContext)
  return {
    trigger: async (hookName, input, output) => {
      const hook = hooks[hookName]
      if (hook) await hook(input, output)
      return output
    }
  }
}
```

#### 5. Plugin Template

Community template available: [opencode-plugin-template](https://github.com/zenobi-us/opencode-plugin-template/)

---

## 5. Integration Patterns

### 5.1 Extending OpenCode Without Core Modification

**Principle**: Plugins hook into extension points, never modify core.

```
┌─────────────────────────────────────────────────────────────┐
│                     INTEGRATION PATTERNS                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PATTERN 1: Event Monitoring                                │
│  ├── Subscribe to events                                    │
│  ├── Track state externally                                 │
│  └── React to changes                                       │
│                                                             │
│  PATTERN 2: Hook Interception                               │
│  ├── Modify inputs/outputs                                  │
│  ├── Inject context                                         │
│  └── Block operations                                       │
│                                                             │
│  PATTERN 3: Custom Tools                                    │
│  ├── Define new tools                                       │
│  ├── Extend AI capabilities                                 │
│  └── Integrate external APIs                                │
│                                                             │
│  PATTERN 4: SDK Integration                                 │
│  ├── Use client for API calls                               │
│  ├── Control TUI                                           │
│  └── Manage sessions                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Safe Patterns That Won't Break with Updates

#### ✅ DO: Use official hooks only

```typescript
// Good: Uses documented hook
export const SafePlugin = async () => ({
  "tool.execute.before": async (input, output) => {
    // Safe: Official hook
  }
})
```

#### ❌ DON'T: Rely on internal implementation details

```typescript
// Bad: Depends on internal structure
export const FragilePlugin = async ({ client }) => {
  // Don't rely on undocumented client properties
  const internalState = client._internal.state
}
```

#### ✅ DO: Handle missing hooks gracefully

```typescript
// Good: Defensive programming
export const RobustPlugin = async () => ({
  event: async ({ event }) => {
    try {
      await processEvent(event)
    } catch (err) {
      // Log but don't crash
      console.error("Event processing failed:", err)
    }
  }
})
```

#### ✅ DO: Use TypeScript for type safety

```typescript
// Good: Type-safe plugin
import type { Plugin } from "@opencode-ai/plugin"

export const TypedPlugin: Plugin = async (ctx) => {
  return {
    // TypeScript validates hook names and signatures
  }
}
```

### 5.3 Fallback Strategies

#### Graceful Degradation

```typescript
export const FeaturePlugin = async ({ client }) => {
  // Check if feature is available
  const hasFeature = await checkFeatureSupport(client)
  
  if (!hasFeature) {
    console.warn("Feature not available, running in fallback mode")
    return {
      // Minimal hooks that don't depend on feature
    }
  }
  
  return {
    // Full feature set
  }
}
```

#### Version Compatibility

```typescript
// Check OpenCode version
export const VersionAwarePlugin = async ({ client }) => {
  const health = await client.global.health()
  const version = health.data.version
  
  if (version.startsWith("1.")) {
    return v1Hooks()
  } else if (version.startsWith("2.")) {
    return v2Hooks()
  }
  
  throw new Error(`Unsupported OpenCode version: ${version}`)
}
```

#### Hook Availability Check

```typescript
export const AdaptivePlugin = async () => {
  const hooks: any = {}
  
  // Only register hooks if they exist in this version
  if (await isHookAvailable("experimental.session.compacting")) {
    hooks["experimental.session.compacting"] = async (input, output) => {
      // Implementation
    }
  }
  
  return hooks
}
```

### 5.4 iDumb v2 Plugin Architecture Recommendations

Based on this deep dive, here's the recommended architecture for iDumb v2 as an OpenCode plugin:

```typescript
// idumb-opencode-plugin.ts
import type { Plugin } from "@opencode-ai/plugin"

export const iDumbPlugin: Plugin = async ({ client, project, $, directory, worktree }) => {
  // Initialize iDumb state
  const idumbState = await initializeGSD(project.id)
  
  return {
    // 1. Monitor all sessions
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await idumbState.onSessionStart(event.properties)
      }
      if (event.type === "session.idle") {
        await idumbState.onSessionComplete(event.properties)
      }
      if (event.type === "todo.updated") {
        await idumbState.syncTasks(event.properties)
      }
    },
    
    // 2. Intercept tool execution for GSD tracking
    "tool.execute.before": async (input, output) => {
      await idumbState.trackToolStart(input.sessionID, input.tool, output.args)
    },
    
    "tool.execute.after": async (input, output) => {
      await idumbState.trackToolComplete(input.sessionID, input.tool, output)
    },
    
    // 3. Inject GSD context into compaction
    "experimental.session.compacting": async (input, output) => {
      const gsdContext = await idumbState.getCompactionContext(input.sessionID)
      output.context.push(gsdContext)
    },
    
    // 4. Add custom GSD tools
    tool: {
      gsd_plan: tool({
        description: "Create a new GSD plan",
        args: {
          title: tool.schema.string(),
          phases: tool.schema.array(tool.schema.string())
        },
        async execute(args, ctx) {
          return await idumbState.createPlan(args)
        }
      }),
      gsd_validate: tool({
        description: "Run GSD validation",
        args: {
          scope: tool.schema.enum(["structure", "git", "all"])
        },
        async execute(args, ctx) {
          return await idumbState.validate(args.scope)
        }
      })
    }
  }
}
```

---

## 6. Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Plugin Structure | **HIGH** | Verified with official docs and source code |
| Event System | **HIGH** | Complete list from official documentation |
| Hooks | **HIGH** | All hooks documented with signatures from source |
| Distribution | **HIGH** | Standard npm patterns, Bun internal confirmed |
| Integration Patterns | **MEDIUM-HIGH** | Best practices derived from ecosystem examples |

### Known Limitations

1. **Experimental hooks** (`experimental.*`) may change in future versions
2. **Custom tools** API is relatively new, may evolve
3. **Type definitions** in `@opencode-ai/plugin` may be incomplete (use extended types)

---

## 7. Quick Reference

### Hook Quick Reference

| Hook | When Called | Can Modify | Can Block |
|------|-------------|------------|-----------|
| `event` | Every event | ❌ No | ❌ No |
| `chat.message` | New user message | ✅ Yes | ❌ No |
| `chat.params` | Before LLM call | ✅ Yes | ❌ No |
| `chat.headers` | Before LLM call | ✅ Yes | ❌ No |
| `permission.ask` | Permission needed | ✅ Yes | ✅ Yes (deny) |
| `command.execute.before` | Before command | ✅ Yes | ❌ No |
| `tool.execute.before` | Before tool | ✅ Yes | ✅ Yes (throw) |
| `tool.execute.after` | After tool | ✅ Yes | ❌ No |
| `experimental.chat.messages.transform` | Before LLM | ✅ Yes | ❌ No |
| `experimental.chat.system.transform` | Before LLM | ✅ Yes | ❌ No |
| `experimental.session.compacting` | Before compaction | ✅ Yes | ❌ No |

### Event Quick Reference

```typescript
// All events a plugin can receive
const ALL_EVENTS = [
  // Command
  "command.executed",
  // File
  "file.edited", "file.watcher.updated",
  // Installation
  "installation.updated",
  // LSP
  "lsp.client.diagnostics", "lsp.updated",
  // Message
  "message.part.removed", "message.part.updated", "message.removed", "message.updated",
  // Permission
  "permission.asked", "permission.replied",
  // Server
  "server.connected",
  // Session
  "session.created", "session.compacted", "session.deleted", "session.diff",
  "session.error", "session.idle", "session.status", "session.updated",
  // Todo
  "todo.updated",
  // Tool
  "tool.execute.after", "tool.execute.before",
  // TUI
  "tui.prompt.append", "tui.command.execute", "tui.toast.show"
] as const
```

### Plugin Template

```typescript
// my-opencode-plugin.ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // Initialization
  
  return {
    // Event subscription
    event: async ({ event }) => {
      // Handle events
    },
    
    // Hooks
    "tool.execute.before": async (input, output) => {
      // Modify tool execution
    },
    
    // Custom tools
    tool: {
      myTool: tool({
        description: "My custom tool",
        args: { arg: tool.schema.string() },
        async execute(args, ctx) {
          return "Result"
        }
      })
    }
  }
}
```

---

## Sources

- OpenCode Official Documentation: https://opencode.ai/docs/plugins/
- OpenCode Ecosystem: https://opencode.ai/docs/ecosystem/
- OpenCode SDK: https://opencode.ai/docs/sdk/
- Source Code Analysis: `packages/plugin/src/index.ts`, `packages/opencode/src/plugin/index.ts`
- DeepWiki Code Context: `event-subscription-opencode.md`
- Community Plugins: https://github.com/awesome-opencode/awesome-opencode
