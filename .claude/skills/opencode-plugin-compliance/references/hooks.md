# OpenCode Plugin Hooks Reference

Complete reference for all OpenCode plugin hooks.

## Hook Interface

```typescript
export interface Hooks {
  // Universal event subscription
  event?: (input: { event: Event }) => Promise<void>

  // Configuration hook
  config?: (input: Config) => Promise<void>

  // Custom tools registration
  tool?: {
    [key: string]: ToolDefinition
  }

  // Authentication hook
  auth?: AuthHook

  // Chat hooks
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

  "chat.params"?: (
    input: {
      sessionID: string
      agent: string
      model: Model
      provider: ProviderContext
      message: UserMessage
    },
    output: {
      temperature: number
      topP: number
      topK: number
      options: Record<string, any>
    },
  ) => Promise<void>

  "chat.headers"?: (
    input: {
      sessionID: string
      agent: string
      model: Model
      provider: ProviderContext
      message: UserMessage
    },
    output: { headers: Record<string, string> },
  ) => Promise<void>

  // Permission hook
  "permission.ask"?: (
    input: Permission,
    output: { status: "ask" | "deny" | "allow" }
  ) => Promise<void>

  // Command hook
  "command.execute.before"?: (
    input: {
      command: string
      sessionID: string
      arguments: string
    },
    output: { parts: Part[] },
  ) => Promise<void>

  // Tool execution hooks
  "tool.execute.before"?: (
    input: {
      tool: string
      sessionID: string
      callID: string
    },
    output: { args: any },
  ) => Promise<void>

  "tool.execute.after"?: (
    input: {
      tool: string
      sessionID: string
      callID: string
    },
    output: {
      title: string
      output: string
      metadata: any
    },
  ) => Promise<void>

  // Experimental hooks (may change)
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
    output: { system: string[] },
  ) => Promise<void>

  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: {
      context: string[]
      prompt?: string
    },
  ) => Promise<void>

  "experimental.text.complete"?: (
    input: {
      sessionID: string
      messageID: string
      partID: string
    },
    output: { text: string },
  ) => Promise<void>
}
```

## Hook Execution Order

1. **config** - Plugin initialization
2. **event** - Every event on the bus
3. **tool.execute.before** - Before each tool execution
4. **tool.execute.after** - After each tool execution
5. **permission.ask** - When permission is requested
6. **experimental.* hooks** - At their respective trigger points
