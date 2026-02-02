# DeepWiki Q&A with Code Context for Repository: anomalyco/opencode
## Q1
when create plugins for clients install at any project and using OpenCode in as client-side ; what innate concepts that through eventsubsription that the plugins (or anything that can pair with plugins concepts) can manipulate the core concepts (like session creation, prompt injection, stop hooks, etc)
### Answer
# Plugin Architecture and Event Subscription in OpenCode

When creating plugins for OpenCode that clients can install in any project, the plugin system provides two primary mechanisms to manipulate core concepts: **event subscription** and **lifecycle hooks**.

## Plugin Structure

A plugin is a JavaScript/TypeScript function that receives a context object and returns a `Hooks` object. The context includes the OpenCode SDK client, project information, directory paths, and shell access. opencode:26-35 

## Event Subscription Mechanism

### The `event` Hook

Plugins can subscribe to **all system events** through the `event` hook, which receives every event published through OpenCode's Bus system: opencode:148-149 

The plugin system automatically forwards all Bus events to registered plugins: opencode:126-133 

### Available Events

Through event subscription, plugins can monitor these core concepts:

**Session Events:**
- `session.created` - When new sessions are created
- `session.updated` - When session metadata changes
- `session.deleted` - When sessions are removed
- `session.idle` - When sessions complete
- `session.error` - When sessions encounter errors
- `session.compacted` - When session history is compacted

**Message Events:**
- `message.updated` - When messages change
- `message.part.updated` - When message parts change
- `message.removed` - When messages are deleted

**Tool Events:**
- `tool.execute.before` - Before tool execution
- `tool.execute.after` - After tool execution

**Other Events:**
- `command.executed`, `file.edited`, `lsp.client.diagnostics`, `permission.asked`, etc. opencode:144-205 

## Lifecycle Hooks for Manipulating Core Concepts

Beyond event subscription, plugins can **actively manipulate** core concepts through lifecycle hooks:

### 1. Session Creation

While plugins cannot directly prevent session creation, they can monitor it via the `session.created` event. The event is published when sessions are created: opencode:105-111 

### 2. Prompt Manipulation

**Transform Messages Before LLM:** opencode:196-204 

This hook allows plugins to modify all session messages before they're sent to the LLM: opencode:598-598 

**Transform System Prompts:** opencode:205-210 

**Intercept User Messages:** opencode:156-167 

### 3. Tool Execution Hooks (Stop/Intercept Capabilities)

Plugins can intercept tool execution before and after, effectively acting as "stop hooks": opencode:184-195 

These hooks are triggered for every tool execution: opencode:708-729 

**Example - Blocking Tool Execution:** opencode:239-253 

### 4. Session Compaction Customization

Plugins can modify or replace the compaction prompt entirely: opencode:212-221 

This hook is triggered during session compaction: opencode:136-143 

### 5. LLM Request Modification

**Modify Parameters:** opencode:169-174 

**Modify Headers:** opencode:175-178 

### 6. Permission Control opencode:179-179 

### 7. Command Execution Interception opencode:180-183 

## How Plugin Hooks Work

The `Plugin.trigger()` function iterates through all loaded plugins and executes matching hooks sequentially, allowing plugins to modify output parameters passed by reference: opencode:98-113 

## Notes

- **Event subscription** (`event` hook) is **read-only** - plugins receive events but cannot prevent them from happening
- **Lifecycle hooks** are **write-enabled** - plugins can modify parameters, inject content, or throw errors to stop execution
- Plugins can effectively implement "stop hooks" by throwing errors in hooks like `tool.execute.before` to prevent execution
- For prompt injection prevention, use `experimental.chat.messages.transform` or `chat.message` hooks to sanitize input
- All hooks run **synchronously in sequence**, so earlier plugins can affect later ones
- The plugin system loads from both local files (`.opencode/plugins/`) and npm packages specified in config opencode:23-96
### Citations
**File:** packages/plugin/src/index.ts (L26-35)
```typescript
export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}

export type Plugin = (input: PluginInput) => Promise<Hooks>
```
**File:** packages/plugin/src/index.ts (L148-149)
```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L156-167)
```typescript
   * Called when a new message is received
   */
  "chat.message"?: (
    input: {
      sessionID: string
      agent?: string
      model?: { providerID: string; modelID: string }
      messageID?: string
      variant?: string
    },
    output: { message: UserMessage; parts: Part[] },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L169-174)
```typescript
   * Modify parameters sent to LLM
   */
  "chat.params"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { temperature: number; topP: number; topK: number; options: Record<string, any> },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L175-178)
```typescript
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L179-179)
```typescript
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L180-183)
```typescript
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] },
  ) => Promise<void>
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
**File:** packages/plugin/src/index.ts (L196-204)
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
```
**File:** packages/plugin/src/index.ts (L205-210)
```typescript
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L212-221)
```typescript
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
**File:** packages/web/src/content/docs/plugins.mdx (L144-205)
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
**File:** packages/web/src/content/docs/plugins.mdx (L239-253)
```text
### .env protection

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
```
**File:** packages/opencode/src/session/index.ts (L105-111)
```typescript
  export const Event = {
    Created: BusEvent.define(
      "session.created",
      z.object({
        info: Info,
      }),
    ),
```
**File:** packages/opencode/src/session/prompt.ts (L598-598)
```typescript
      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
**File:** packages/opencode/src/session/prompt.ts (L708-729)
```typescript
          await Plugin.trigger(
            "tool.execute.before",
            {
              tool: item.id,
              sessionID: ctx.sessionID,
              callID: ctx.callID,
            },
            {
              args,
            },
          )
          const result = await item.execute(args, ctx)
          await Plugin.trigger(
            "tool.execute.after",
            {
              tool: item.id,
              sessionID: ctx.sessionID,
              callID: ctx.callID,
            },
            result,
          )
          return result
```
**File:** packages/opencode/src/session/compaction.ts (L136-143)
```typescript
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
    const defaultPrompt =
      "Provide a detailed prompt for continuing our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next considering new session will not have access to our conversation."
    const promptText = compacting.prompt ?? [defaultPrompt, ...compacting.context].join("\n\n")
```