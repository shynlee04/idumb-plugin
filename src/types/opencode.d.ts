/**
 * Extended OpenCode Plugin Types
 * 
 * The @opencode-ai/plugin package types may be incomplete.
 * These declarations extend the types based on official documentation.
 * 
 * Source: https://opencode.ai/docs/custom-tools/ (Context7 verified 2026-02-02)
 */

declare module "@opencode-ai/plugin" {
  /**
   * Context passed to tool execute functions
   * 
   * From official docs:
   * - context.agent: Current agent name
   * - context.sessionID: Current session ID
   * - context.messageID: Current message ID
   * - context.directory: Session working directory
   * - context.worktree: Git worktree root
   */
  export interface ToolContext {
    agent: string
    sessionID: string
    messageID: string
    directory: string
    worktree: string
  }

  /**
   * Tool definition helper
   */
  export interface ToolDefinition<TArgs> {
    description: string
    args: TArgs
    execute: (args: any, context: ToolContext) => Promise<string>
  }

  /**
   * Tool factory with schema helpers
   */
  export function tool<TArgs>(definition: ToolDefinition<TArgs>): any

  export namespace tool {
    export const schema: {
      string: () => { optional: () => any; describe: (d: string) => any }
      boolean: () => { optional: () => any; describe: (d: string) => any }
      number: () => { optional: () => any; describe: (d: string) => any }
      enum: <T extends string[]>(values: T) => { optional: () => any; describe: (d: string) => any }
      array: (item: any) => { optional: () => any; describe: (d: string) => any }
      object: (shape: any) => { optional: () => any; describe: (d: string) => any }
    }
  }

  /**
   * Plugin context passed to plugin factory
   */
  export interface PluginContext {
    project: any
    client: OpenCodeClient
    $: any // Bun shell
    directory: string
    worktree: string
  }

  /**
   * OpenCode SDK Client
   */
  export interface OpenCodeClient {
    session: {
      create: (opts?: any) => Promise<any>
      chat: (id: string, opts: any) => Promise<any>
      prompt: (opts: { path: { id: string }; body: any }) => Promise<any>
      todo: (opts: { path: { id: string } }) => Promise<{ data?: any[] }>
      share: (opts?: any) => Promise<any>
      revert: (opts?: any) => Promise<any>
      summarize: (id: string, opts: any) => Promise<any>
      messages: (opts?: any) => Promise<any>
    }
    app: {
      log: (opts: { level: string; message: string }) => Promise<void>
    }
  }

  /**
   * Plugin hook types
   */
  export interface PluginHooks {
    event?: (input: { event: any }) => Promise<void>
    stop?: (input: { sessionID?: string; session_id?: string }) => Promise<void>
    "experimental.session.compacting"?: (input: any, output: { context: string[]; prompt?: string }) => Promise<void>
    "tool.execute.before"?: (input: any, output: any) => Promise<void>
    "tool.execute.after"?: (input: any, output: any) => Promise<void>
    tool?: Record<string, any>
  }

  /**
   * Plugin factory function type
   */
  export type Plugin = (ctx: PluginContext) => Promise<PluginHooks>
}
