# DeepWiki Q&A with Code Context for Repository: anomalyco/opencode
## Q1
under all scopes of event subscriptions' hooks of OpenCode; and for the purposes of manipulation of in-session, start of session, tools executions, files updates, files changes, users' messages and agents (of main and inner cycles) messages (in  turns and of last) and the  meta data of the above; and either manipulation of interception, transforming message sent in between of the events, extracts of the above mentioned entities, or direct change those or using customized tools to replace and/or transforming them into more coherent, comprehensive ones What are the allow, the workaround (if any) and the totally not able to list when working under as a plugin installed at users' client-side (not by forking this).
### Answer
Based on my analysis of the OpenCode plugin system, here's a comprehensive breakdown of what plugins can and cannot do when installed client-side:

## ✅ **ALLOWED: What Plugins Can Do**

### 1. **Event Subscription (Read-Only Monitoring)**
Plugins can subscribe to ALL events via the `event` hook and receive notifications about:
- Session lifecycle: `session.created`, `session.updated`, `session.deleted`, `session.idle`, `session.compacted`
- Messages: `message.updated`, `message.part.updated`, `message.removed`
- Tools: `tool.execute.before`, `tool.execute.after`
- Files: `file.edited`, `file.watcher.updated`
- Permissions: `permission.asked`, `permission.replied`
- And 20+ other event types opencode:148-149 opencode:143-205 

### 2. **Tool Execution Interception (Before/After)**
- **Prevent execution**: Throw errors in `tool.execute.before` to block tools
- **Modify arguments**: Change tool parameters before execution
- **Transform results**: Modify tool output, title, and metadata after execution opencode:184-195 opencode:240-252 

### 3. **Message Transformation (Experimental)**
- **Transform messages before LLM**: Modify the entire message history sent to the AI via `experimental.chat.messages.transform`
- **Post-process text**: Modify text parts after LLM generation via `experimental.text.complete`
- **System prompt transformation**: Modify system prompts via `experimental.chat.system.transform` opencode:196-210 opencode:612-612 

### 4. **Custom Tools**
Plugins can register entirely new tools that OpenCode can invoke, with full access to:
- Session context
- File system operations
- Custom logic and external APIs opencode:151-153 opencode:257-288 

### 5. **LLM Parameters Modification**
- Modify temperature, topP, topK, and other model parameters
- Add custom headers to provider requests
- Modify provider-specific options opencode:169-178 

### 6. **Permission Interception**
Change permission status from `ask` to `allow` or `deny` to automate permission decisions opencode:179-179 

### 7. **Session Compaction Customization**
- Add custom context to compaction prompts
- Replace the entire compaction prompt opencode:218-221 opencode:312-360 

### 8. **SDK Client Access**
Plugins receive a full SDK client for:
- Logging: `client.app.log()`
- Querying sessions, messages, and other data
- Making HTTP requests to the OpenCode server opencode:26-33 opencode:293-306 

---

## ⚠️ **WORKAROUNDS: What Requires Indirect Methods**

### 1. **Direct Message History Modification**
**Not directly possible**, but you can:
- Use `experimental.chat.messages.transform` to modify messages before they're sent to the LLM
- Use SDK client to query and analyze message history
- Create custom tools that read/process messages opencode:612-612 

### 2. **Modifying Messages After They're Created**
**Not directly possible**, but you can:
- Use `experimental.text.complete` to modify text immediately after LLM generates it
- Listen to `message.part.updated` events and react accordingly
- Use custom tools to implement your own message processing logic opencode:316-320 

### 3. **File Change Detection and Reaction**
**Limited to event listening**, but you can:
- Subscribe to `file.edited` and `file.watcher.updated` events
- Create custom tools that trigger on these events
- Use the Bun shell API (`$`) to perform file operations opencode:150-153 

---

## ❌ **TOTALLY NOT ABLE: Hard Limitations**

### 1. **Direct Storage/Database Access**
Plugins **cannot**:
- Directly access or modify the storage layer (`storage/session/`, `storage/message/`, etc.)
- Bypass the Storage API to manipulate JSON files
- Access internal state outside of provided hooks opencode:161-227 

### 2. **Modifying Existing Messages/Parts in Storage**
Plugins **cannot**:
- Retroactively edit messages already stored in sessions
- Delete or modify message parts directly
- Change message metadata after creation

The only modification point is during the transformation hooks BEFORE persistence.

### 3. **Intercepting Events to Block Propagation**
Plugins **cannot**:
- Prevent events from being published to the bus
- Block other plugins from receiving events
- Modify events in the bus stream opencode:126-133 

### 4. **Modifying Session State Directly**
Plugins **cannot**:
- Change session metadata (title, time, summary) directly
- Manipulate session parent-child relationships
- Delete or archive sessions programmatically

### 5. **Direct Agent/Inner Cycle Control**
Plugins **cannot**:
- Directly control agent switching or cycling
- Modify the agent execution loop
- Intercept inner cycle agent messages separately from main cycle

They can only react to events and use hooks at defined points.

### 6. **Bypassing Permission System**
While plugins can modify permission responses, they **cannot**:
- Completely disable the permission system
- Override permission rules set at the session level
- Execute tools without going through the permission check opencode:179-179 

### 7. **Modifying Core Runtime Behavior**
Plugins **cannot**:
- Change how the event bus works
- Modify the session prompt loop logic
- Replace or override built-in tools (only add new ones)
- Access or modify Provider/Model configurations dynamically opencode:98-113 

---

## **Notes**

**Key Architectural Principle**: OpenCode's plugin system follows a "hook-based" architecture where plugins can only act at predefined extension points. This is by design for security and stability. opencode:23-96 

**Plugin Loading**: Plugins are loaded from npm packages or local files, and all hooks run in sequence with no ability to short-circuit the chain. opencode:54-64 

**Experimental Hooks**: Hooks prefixed with `experimental.*` may change in future versions and should be used with caution. opencode:196-225 

If you need capabilities beyond what plugins provide, you would need to fork the repository and modify the core runtime directly.
### Citations
**File:** packages/plugin/src/index.ts (L26-33)
```typescript
export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}
```
**File:** packages/plugin/src/index.ts (L148-149)
```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L151-153)
```typescript
  tool?: {
    [key: string]: ToolDefinition
  }
```
**File:** packages/plugin/src/index.ts (L169-178)
```typescript
   * Modify parameters sent to LLM
   */
  "chat.params"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { temperature: number; topP: number; topK: number; options: Record<string, any> },
  ) => Promise<void>
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L179-179)
```typescript
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L184-195)
```typescript
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: {
      title: string
      output: string
      metadata: any
    },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L196-225)
```typescript
  "experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
  /**
   * Called before session compaction starts. Allows plugins to customize
   * the compaction prompt.
   *
   * - `context`: Additional context strings appended to the default prompt
   * - `prompt`: If set, replaces the default compaction prompt entirely
   */
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void>
```
**File:** packages/web/src/content/docs/plugins.mdx (L54-64)
```text
### Load order

Plugins are loaded from all sources and all hooks run in sequence. The load order is:

1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

Duplicate npm packages with the same name and version are loaded once. However, a local plugin and an npm plugin with similar names are both loaded separately.

```
**File:** packages/web/src/content/docs/plugins.mdx (L143-205)
```text

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

#### Command Events

- `command.executed`

#### File Events

- `file.edited`
- `file.watcher.updated`

#### Installation Events

- `installation.updated`

#### LSP Events

- `lsp.client.diagnostics`
- `lsp.updated`

#### Message Events

- `message.part.removed`
- `message.part.updated`
- `message.removed`
- `message.updated`

#### Permission Events

- `permission.asked`
- `permission.replied`

#### Server Events

- `server.connected`

#### Session Events

- `session.created`
- `session.compacted`
- `session.deleted`
- `session.diff`
- `session.error`
- `session.idle`
- `session.status`
- `session.updated`

#### Todo Events

- `todo.updated`

#### Tool Events

- `tool.execute.after`
- `tool.execute.before`

#### TUI Events

- `tui.prompt.append`
- `tui.command.execute`
- `tui.toast.show`

```
**File:** packages/web/src/content/docs/plugins.mdx (L240-252)
```text

Prevent opencode from reading `.env` files:

```javascript title=".opencode/plugins/env-protection.js"
export const EnvProtection = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files")
      }
    },
  }
}
```
**File:** packages/web/src/content/docs/plugins.mdx (L257-288)
```text
### Custom tools

Plugins can also add custom tools to opencode:

```ts title=".opencode/plugins/custom-tools.ts"
import { type Plugin, tool } from "@opencode-ai/plugin"

export const CustomToolsPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "This is a custom tool",
        args: {
          foo: tool.schema.string(),
        },
        async execute(args, context) {
          const { directory, worktree } = context
          return `Hello ${args.foo} from ${directory} (worktree: ${worktree})`
        },
      }),
    },
  }
}
```

The `tool` helper creates a custom tool that opencode can call. It takes a Zod schema function and returns a tool definition with:

- `description`: What the tool does
- `args`: Zod schema for the tool's arguments
- `execute`: Function that runs when the tool is called

Your custom tools will be available to opencode alongside built-in tools.
```
**File:** packages/web/src/content/docs/plugins.mdx (L293-306)
```text

Use `client.app.log()` instead of `console.log` for structured logging:

```ts title=".opencode/plugins/my-plugin.ts"
export const MyPlugin = async ({ client }) => {
  await client.app.log({
    service: "my-plugin",
    level: "info",
    message: "Plugin initialized",
    extra: { foo: "bar" },
  })
}
```

```
**File:** packages/web/src/content/docs/plugins.mdx (L312-360)
```text

Customize the context included when a session is compacted:

```ts title=".opencode/plugins/compaction.ts"
import type { Plugin } from "@opencode-ai/plugin"

export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject additional context into the compaction prompt
      output.context.push(`
## Custom Context

Include any state that should persist across compaction:
- Current task status
- Important decisions made
- Files being actively worked on
`)
    },
  }
}
```

The `experimental.session.compacting` hook fires before the LLM generates a continuation summary. Use it to inject domain-specific context that the default compaction prompt would miss.

You can also replace the compaction prompt entirely by setting `output.prompt`:

```ts title=".opencode/plugins/custom-compaction.ts"
import type { Plugin } from "@opencode-ai/plugin"

export const CustomCompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Replace the entire compaction prompt
      output.prompt = `
You are generating a continuation prompt for a multi-agent swarm session.

Summarize:
1. The current task and its status
2. Which files are being modified and by whom
3. Any blockers or dependencies between agents
4. The next steps to complete the work

Format as a structured prompt that a new agent can use to resume work.
`
    },
  }
}
```
```
**File:** packages/opencode/src/session/prompt.ts (L612-612)
```typescript
      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
**File:** packages/opencode/src/session/processor.ts (L316-320)
```typescript
                    const textOutput = await Plugin.trigger(
                      "experimental.text.complete",
                      {
                        sessionID: input.sessionID,
                        messageID: input.assistantMessage.id,
```
**File:** packages/opencode/src/storage/storage.ts (L161-227)
```typescript
  export async function remove(key: string[]) {
    const dir = await state().then((x) => x.dir)
    const target = path.join(dir, ...key) + ".json"
    return withErrorHandling(async () => {
      await fs.unlink(target).catch(() => {})
    })
  }

  export async function read<T>(key: string[]) {
    const dir = await state().then((x) => x.dir)
    const target = path.join(dir, ...key) + ".json"
    return withErrorHandling(async () => {
      using _ = await Lock.read(target)
      const result = await Bun.file(target).json()
      return result as T
    })
  }

  export async function update<T>(key: string[], fn: (draft: T) => void) {
    const dir = await state().then((x) => x.dir)
    const target = path.join(dir, ...key) + ".json"
    return withErrorHandling(async () => {
      using _ = await Lock.write(target)
      const content = await Bun.file(target).json()
      fn(content)
      await Bun.write(target, JSON.stringify(content, null, 2))
      return content as T
    })
  }

  export async function write<T>(key: string[], content: T) {
    const dir = await state().then((x) => x.dir)
    const target = path.join(dir, ...key) + ".json"
    return withErrorHandling(async () => {
      using _ = await Lock.write(target)
      await Bun.write(target, JSON.stringify(content, null, 2))
    })
  }

  async function withErrorHandling<T>(body: () => Promise<T>) {
    return body().catch((e) => {
      if (!(e instanceof Error)) throw e
      const errnoException = e as NodeJS.ErrnoException
      if (errnoException.code === "ENOENT") {
        throw new NotFoundError({ message: `Resource not found: ${errnoException.path}` })
      }
      throw e
    })
  }

  const glob = new Bun.Glob("**/*")
  export async function list(prefix: string[]) {
    const dir = await state().then((x) => x.dir)
    try {
      const result = await Array.fromAsync(
        glob.scan({
          cwd: path.join(dir, ...prefix),
          onlyFiles: true,
        }),
      ).then((results) => results.map((x) => [...prefix, ...x.slice(0, -5).split(path.sep)]))
      result.sort()
      return result
    } catch {
      return []
    }
  }
}
```
**File:** packages/opencode/src/plugin/index.ts (L23-96)
```typescript
  const state = Instance.state(async () => {
    const client = createOpencodeClient({
      baseUrl: "http://localhost:4096",
      // @ts-ignore - fetch type incompatibility
      fetch: async (...args) => Server.App().fetch(...args),
    })
    const config = await Config.get()
    const hooks: Hooks[] = []
    const input: PluginInput = {
      client,
      project: Instance.project,
      worktree: Instance.worktree,
      directory: Instance.directory,
      serverUrl: Server.url(),
      $: Bun.$,
    }

    for (const plugin of INTERNAL_PLUGINS) {
      log.info("loading internal plugin", { name: plugin.name })
      const init = await plugin(input)
      hooks.push(init)
    }

    const plugins = [...(config.plugin ?? [])]
    if (!Flag.OPENCODE_DISABLE_DEFAULT_PLUGINS) {
      plugins.push(...BUILTIN)
    }

    for (let plugin of plugins) {
      // ignore old codex plugin since it is supported first party now
      if (plugin.includes("opencode-openai-codex-auth") || plugin.includes("opencode-copilot-auth")) continue
      log.info("loading plugin", { path: plugin })
      if (!plugin.startsWith("file://")) {
        const lastAtIndex = plugin.lastIndexOf("@")
        const pkg = lastAtIndex > 0 ? plugin.substring(0, lastAtIndex) : plugin
        const version = lastAtIndex > 0 ? plugin.substring(lastAtIndex + 1) : "latest"
        const builtin = BUILTIN.some((x) => x.startsWith(pkg + "@"))
        plugin = await BunProc.install(pkg, version).catch((err) => {
          if (!builtin) throw err

          const message = err instanceof Error ? err.message : String(err)
          log.error("failed to install builtin plugin", {
            pkg,
            version,
            error: message,
          })
          Bus.publish(Session.Event.Error, {
            error: new NamedError.Unknown({
              message: `Failed to install built-in plugin ${pkg}@${version}: ${message}`,
            }).toObject(),
          })

          return ""
        })
        if (!plugin) continue
      }
      const mod = await import(plugin)
      // Prevent duplicate initialization when plugins export the same function
      // as both a named export and default export (e.g., `export const X` and `export default X`).
      // Object.entries(mod) would return both entries pointing to the same function reference.
      const seen = new Set<PluginInstance>()
      for (const [_name, fn] of Object.entries<PluginInstance>(mod)) {
        if (seen.has(fn)) continue
        seen.add(fn)
        const init = await fn(input)
        hooks.push(init)
      }
    }

    return {
      hooks,
      input,
    }
  })
```
**File:** packages/opencode/src/plugin/index.ts (L98-113)
```typescript
  export async function trigger<
    Name extends Exclude<keyof Required<Hooks>, "auth" | "event" | "tool">,
    Input = Parameters<Required<Hooks>[Name]>[0],
    Output = Parameters<Required<Hooks>[Name]>[1],
  >(name: Name, input: Input, output: Output): Promise<Output> {
    if (!name) return output
    for (const hook of await state().then((x) => x.hooks)) {
      const fn = hook[name]
      if (!fn) continue
      // @ts-expect-error if you feel adventurous, please fix the typing, make sure to bump the try-counter if you
      // give up.
      // try-counter: 2
      await fn(input, output)
    }
    return output
  }
```
**File:** packages/opencode/src/plugin/index.ts (L126-133)
```typescript
    Bus.subscribeAll(async (input) => {
      const hooks = await state().then((x) => x.hooks)
      for (const hook of hooks) {
        hook["event"]?.({
          event: input,
        })
      }
    })
```
## Q2
under all scopes of event subscriptions' hooks of OpenCode; and for the purposes of manipulation of in-session, start of session, tools executions, files updates, files changes, users' messages and agents (of main and inner cycles) messages (in  turns and of last) and the  meta data of the above; and either manipulation of interception, transforming message sent in between of the events, extracts of the above mentioned entities, or direct change those or using customized tools to replace and/or transforming them into more coherent, comprehensive ones What are the allow, the workaround (if any) and the totally not able to list when working under as a plugin installed at users' client-side (not by forking this).
## OpenCode Plugin System Event Hooks and Manipulation Capabilities
This codemap traces OpenCode's plugin system architecture, showing how plugins subscribe to events [1a], manipulate tool executions [3a-3b], transform messages [4a], customize session compaction [6a], and work within storage boundaries [7a-7b]. The system provides comprehensive hooks while maintaining security through controlled access points.
### 1. Plugin Loading and Event Subscription Architecture
How plugins are loaded and subscribe to all system events through the bus
### 1a. Plugin System Initialization (`index.ts:119`)
Loads all plugins and subscribes to every event on the bus
```text
export async function init() {
  const hooks = await state().then((x) => x.hooks)
  const config = await Config.get()
  for (const hook of hooks) {
    // @ts-expect-error this is because we haven't moved plugin to sdk v2
    await hook.config?.(config)
  }
  Bus.subscribeAll(async (input) => {
    const hooks = await state().then((x) => x.hooks)
    for (const hook of hooks) {
      hook["event"]?.({
        event: input,
      })
    }
  })
}
```
### 1b. Event Publishing Mechanism (`index.ts:41`)
Publishes events to all subscribers including plugins
```text
export async function publish<Definition extends BusEvent.Definition>(
  def: Definition,
  properties: z.output<Definition["properties"]>,
) {
  const payload = {
    type: def.type,
    properties,
  }
  log.info("publishing", {
    type: def.type,
  })
  const pending = []
  for (const key of [def.type, "*"]) {
    const match = state().subscriptions.get(key)
    for (const sub of match ?? []) {
      pending.push(sub(payload))
    }
  }
  GlobalBus.emit("event", {
    directory: Instance.directory,
    payload,
  })
  return Promise.all(pending)
}
```
### 1c. Event Hook Interface (`index.ts:149`)
Defines the universal event subscription hook for plugins
```text
event?: (input: { event: Event }) => Promise<void>
```
### 2. Session Lifecycle Event Flow
How session events are defined and published throughout the system
### 2a. Session Event Definitions (`index.ts:105`)
Defines all session lifecycle events
```text
export const Event = {
  Created: BusEvent.define(
    "session.created",
    z.object({
      info: Info,
    }),
  ),
  Updated: BusEvent.define(
    "session.updated",
    z.object({
      info: Info,
    }),
  ),
  Deleted: BusEvent.define(
    "session.deleted",
    z.object({
      info: Info,
    }),
  ),
```
### 2b. Session Status Events (`status.ts:27`)
Defines session status and idle events
```text
export const Event = {
  Status: BusEvent.define(
    "session.status",
    z.object({
      sessionID: z.string(),
      status: Info,
    }),
  ),
  // deprecated
  Idle: BusEvent.define(
    "session.idle",
    z.object({
      sessionID: z.string(),
    }),
  ),
```
### 2c. Session Compaction Event (`compaction.ts:21`)
Defines session compaction completion event
```text
export const Event = {
  Compacted: BusEvent.define(
    "session.compacted",
    z.object({
      sessionID: z.string(),
    }),
  ),
```
### 3. Message and Tool Execution Interception
How plugins can intercept and modify tool executions and messages
### 3a. Tool Pre-Execution Hook (`prompt.ts:380`)
Triggers plugin hooks before tool execution
```text
await Plugin.trigger(
  "tool.execute.before",
  {
    tool: "task",
    sessionID,
    callID: part.id,
  },
  { args: taskArgs },
)
```
### 3b. Tool Post-Execution Hook (`prompt.ts:422`)
Triggers plugin hooks after tool execution with results
```text
await Plugin.trigger(
  "tool.execute.after",
  {
    tool: "task",
    sessionID,
    callID: part.id,
  },
  result,
```
### 3c. Tool Hook Interface Definition (`index.ts:184`)
Defines the interface for tool execution hooks
```text
"tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: {
      title: string
      output: string
      metadata: any
    },
```
### 3d. Plugin Hook Trigger System (`index.ts:98`)
Executes all registered plugin hooks for a given event
```text
export async function trigger<
    Name extends Exclude<keyof Required<Hooks>, "auth" | "event" | "tool">,
    Input = Parameters<Required[Hooks][Name]>[0],
    Output = Parameters<Required[Hooks][Name]>[1],
  >(name: Name, input: Input, output: Output): Promise<Output> {
    if (!name) return output
    for (const hook of await state().then((x) => x.hooks)) {
      const fn = hook[name]
      if (!fn) continue
      // @ts-expect-error if you feel adventurous, please fix the typing, make sure to bump the try-counter if you
      // give up.
      // try-counter: 2
      await fn(input, output)
    }
    return output
  }
```
### 4. Message Transformation and Experimental Hooks
How plugins can transform messages and system prompts before LLM processing
### 4a. Message Transformation Hook (`prompt.ts:612`)
Allows plugins to transform the entire message history before LLM
```text
await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
### 4b. Text Completion Transformation (`processor.ts:316`)
Transforms text immediately after LLM generation
```text
const textOutput = await Plugin.trigger(
  "experimental.text.complete",
  {
    sessionID: input.sessionID,
    messageID: input.assistantMessage.id,
    partID: currentText.id,
  },
  { text: currentText.text },
)
currentText.text = textOutput.text
```
### 4c. Experimental Hook Interfaces (`index.ts:196`)
Defines experimental transformation hooks for messages and system prompts
```text
"experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
```
### 5. File System and Permission Event Handling
How file changes and permission requests are handled through the event system
### 5a. File Edit Event Definition (`index.ts:261`)
Defines file editing events
```text
export const Event = {
  Edited: BusEvent.define(
    "file.edited",
    z.object({
      file: z.string(),
    }),
  ),
```
### 5b. File Watcher Events (`watcher.ts:25`)
Defines file system watcher events
```text
export const Event = {
  Updated: BusEvent.define(
    "file.watcher.updated",
    z.object({
      file: z.string(),
      event: z.union([z.literal("add"), z.literal("change"), z.literal("unlink")]),
    }),
  ),
```
### 5c. Permission Hook Processing (`index.ts:134`)
Processes plugin permission hook responses
```text
switch (
      await Plugin.trigger("permission.ask", info, {
        status: "ask",
      }).then((x) => x.status)
    ) {
      case "deny":
        throw new RejectedError(info.sessionID, info.id, info.callID, info.metadata)
      case "allow":
```
### 5d. Permission Hook Interface (`index.ts:179`)
Defines permission interception hook interface
```text
"permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
```
### 6. Session Compaction Customization
How plugins can customize session compaction behavior and context
### 6a. Compaction Hook Trigger (`compaction.ts:136`)
Triggers plugin hooks during session compaction
```text
// Allow plugins to inject context or replace compaction prompt
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
```
### 6b. Compaction Hook Interface (`index.ts:218`)
Defines interface for customizing session compaction
```text
"experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
```
### 7. Storage System Boundaries
How the storage system enforces boundaries that plugins cannot bypass
### 7a. Storage Read API (`storage.ts:169`)
Controlled storage access through API layer
```text
export async function read<T>(key: string[]) {
  const dir = await state().then((x) => x.dir)
  const target = path.join(dir, ...key) + ".json"
  return withErrorHandling(async () => {
    using _ = await Lock.read(target)
    const result = await Bun.file(target).json()
    return result as T
  })
}
```
### 7b. Storage Update API (`storage.ts:179`)
Controlled storage modification through API layer
```text
export async function update<T>(key: string[], fn: (draft: T) => void) {
  const dir = await state().then((x) => x.dir)
  const target = path.join(dir, ...key) + ".json"
  return withErrorHandling(async () => {
    using _ = await Lock.write(target)
    const content = await Bun.file(target).json()
    fn(content)
    await Bun.write(target, JSON.stringify(content, null, 2))
    return content as T
  })
}
```
---
## OpenCode Plugin System Event Hooks and Manipulation Capabilities
This codemap traces OpenCode's plugin system architecture, showing how plugins subscribe to events [1a], manipulate tool executions [3a-3b], transform messages [4a], customize session compaction [6a], and work within storage boundaries [7a-7b]. The system provides comprehensive hooks while maintaining security through controlled access points.
### 1. Plugin Loading and Event Subscription Architecture
How plugins are loaded and subscribe to all system events through the bus
### 1a. Plugin System Initialization (`index.ts:119`)
Loads all plugins and subscribes to every event on the bus
```text
export async function init() {
  const hooks = await state().then((x) => x.hooks)
  const config = await Config.get()
  for (const hook of hooks) {
    // @ts-expect-error this is because we haven't moved plugin to sdk v2
    await hook.config?.(config)
  }
  Bus.subscribeAll(async (input) => {
    const hooks = await state().then((x) => x.hooks)
    for (const hook of hooks) {
      hook["event"]?.({
        event: input,
      })
    }
  })
}
```
### 1b. Event Publishing Mechanism (`index.ts:41`)
Publishes events to all subscribers including plugins
```text
export async function publish<Definition extends BusEvent.Definition>(
  def: Definition,
  properties: z.output<Definition["properties"]>,
) {
  const payload = {
    type: def.type,
    properties,
  }
  log.info("publishing", {
    type: def.type,
  })
  const pending = []
  for (const key of [def.type, "*"]) {
    const match = state().subscriptions.get(key)
    for (const sub of match ?? []) {
      pending.push(sub(payload))
    }
  }
  GlobalBus.emit("event", {
    directory: Instance.directory,
    payload,
  })
  return Promise.all(pending)
}
```
### 1c. Event Hook Interface (`index.ts:149`)
Defines the universal event subscription hook for plugins
```text
event?: (input: { event: Event }) => Promise<void>
```
### 2. Session Lifecycle Event Flow
How session events are defined and published throughout the system
### 2a. Session Event Definitions (`index.ts:105`)
Defines all session lifecycle events
```text
export const Event = {
  Created: BusEvent.define(
    "session.created",
    z.object({
      info: Info,
    }),
  ),
  Updated: BusEvent.define(
    "session.updated",
    z.object({
      info: Info,
    }),
  ),
  Deleted: BusEvent.define(
    "session.deleted",
    z.object({
      info: Info,
    }),
  ),
```
### 2b. Session Status Events (`status.ts:27`)
Defines session status and idle events
```text
export const Event = {
  Status: BusEvent.define(
    "session.status",
    z.object({
      sessionID: z.string(),
      status: Info,
    }),
  ),
  // deprecated
  Idle: BusEvent.define(
    "session.idle",
    z.object({
      sessionID: z.string(),
    }),
  ),
```
### 2c. Session Compaction Event (`compaction.ts:21`)
Defines session compaction completion event
```text
export const Event = {
  Compacted: BusEvent.define(
    "session.compacted",
    z.object({
      sessionID: z.string(),
    }),
  ),
```
### 3. Message and Tool Execution Interception
How plugins can intercept and modify tool executions and messages
### 3a. Tool Pre-Execution Hook (`prompt.ts:380`)
Triggers plugin hooks before tool execution
```text
await Plugin.trigger(
  "tool.execute.before",
  {
    tool: "task",
    sessionID,
    callID: part.id,
  },
  { args: taskArgs },
)
```
### 3b. Tool Post-Execution Hook (`prompt.ts:422`)
Triggers plugin hooks after tool execution with results
```text
await Plugin.trigger(
  "tool.execute.after",
  {
    tool: "task",
    sessionID,
    callID: part.id,
  },
  result,
```
### 3c. Tool Hook Interface Definition (`index.ts:184`)
Defines the interface for tool execution hooks
```text
"tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: {
      title: string
      output: string
      metadata: any
    },
```
### 3d. Plugin Hook Trigger System (`index.ts:98`)
Executes all registered plugin hooks for a given event
```text
export async function trigger<
    Name extends Exclude<keyof Required<Hooks>, "auth" | "event" | "tool">,
    Input = Parameters<Required[Hooks][Name]>[0],
    Output = Parameters<Required[Hooks][Name]>[1],
  >(name: Name, input: Input, output: Output): Promise<Output> {
    if (!name) return output
    for (const hook of await state().then((x) => x.hooks)) {
      const fn = hook[name]
      if (!fn) continue
      // @ts-expect-error if you feel adventurous, please fix the typing, make sure to bump the try-counter if you
      // give up.
      // try-counter: 2
      await fn(input, output)
    }
    return output
  }
```
### 4. Message Transformation and Experimental Hooks
How plugins can transform messages and system prompts before LLM processing
### 4a. Message Transformation Hook (`prompt.ts:612`)
Allows plugins to transform the entire message history before LLM
```text
await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
### 4b. Text Completion Transformation (`processor.ts:316`)
Transforms text immediately after LLM generation
```text
const textOutput = await Plugin.trigger(
  "experimental.text.complete",
  {
    sessionID: input.sessionID,
    messageID: input.assistantMessage.id,
    partID: currentText.id,
  },
  { text: currentText.text },
)
currentText.text = textOutput.text
```
### 4c. Experimental Hook Interfaces (`index.ts:196`)
Defines experimental transformation hooks for messages and system prompts
```text
"experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
```
### 5. File System and Permission Event Handling
How file changes and permission requests are handled through the event system
### 5a. File Edit Event Definition (`index.ts:261`)
Defines file editing events
```text
export const Event = {
  Edited: BusEvent.define(
    "file.edited",
    z.object({
      file: z.string(),
    }),
  ),
```
### 5b. File Watcher Events (`watcher.ts:25`)
Defines file system watcher events
```text
export const Event = {
  Updated: BusEvent.define(
    "file.watcher.updated",
    z.object({
      file: z.string(),
      event: z.union([z.literal("add"), z.literal("change"), z.literal("unlink")]),
    }),
  ),
```
### 5c. Permission Hook Processing (`index.ts:134`)
Processes plugin permission hook responses
```text
switch (
      await Plugin.trigger("permission.ask", info, {
        status: "ask",
      }).then((x) => x.status)
    ) {
      case "deny":
        throw new RejectedError(info.sessionID, info.id, info.callID, info.metadata)
      case "allow":
```
### 5d. Permission Hook Interface (`index.ts:179`)
Defines permission interception hook interface
```text
"permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
```
### 6. Session Compaction Customization
How plugins can customize session compaction behavior and context
### 6a. Compaction Hook Trigger (`compaction.ts:136`)
Triggers plugin hooks during session compaction
```text
// Allow plugins to inject context or replace compaction prompt
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
```
### 6b. Compaction Hook Interface (`index.ts:218`)
Defines interface for customizing session compaction
```text
"experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
```
### 7. Storage System Boundaries
How the storage system enforces boundaries that plugins cannot bypass
### 7a. Storage Read API (`storage.ts:169`)
Controlled storage access through API layer
```text
export async function read<T>(key: string[]) {
  const dir = await state().then((x) => x.dir)
  const target = path.join(dir, ...key) + ".json"
  return withErrorHandling(async () => {
    using _ = await Lock.read(target)
    const result = await Bun.file(target).json()
    return result as T
  })
}
```
### 7b. Storage Update API (`storage.ts:179`)
Controlled storage modification through API layer
```text
export async function update<T>(key: string[], fn: (draft: T) => void) {
  const dir = await state().then((x) => x.dir)
  const target = path.join(dir, ...key) + ".json"
  return withErrorHandling(async () => {
    using _ = await Lock.write(target)
    const content = await Bun.file(target).json()
    fn(content)
    await Bun.write(target, JSON.stringify(content, null, 2))
    return content as T
  })
}
```