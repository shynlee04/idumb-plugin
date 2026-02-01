# OpenCode TODO/Task List API Research

**Project:** iDumb Meta-Framework Plugin  
**Researched:** 2026-02-02  
**Objective:** Investigate what OpenCode exposes for TODO list manipulation - enforcement, hierarchy, stop hooks  
**Confidence:** HIGH (Official docs + source code analysis)

---

## Executive Summary

OpenCode provides a **session-scoped, flat TODO list system** via `todowrite` and `todoread` tools. The API is simple but powerful for basic task management. There is **no native hierarchical support** but workarounds exist. A `stop` hook exists for enforcement, and `todo.updated` event enables real-time monitoring. Plugins can read/write TODOs indirectly via SDK calls.

**Key Finding:** The TODO system is primarily designed for LLM use (tracking multi-step tasks), but plugins CAN access it through the SDK client API (`GET /session/:id/todo`).

---

## 1. TODO List API

### What IS Possible

| Capability | Status | Confidence | Source |
|------------|--------|------------|--------|
| Plugin read TODO list | **YES** (via SDK) | HIGH | Official docs, server.mdx |
| Plugin write TODO list | **YES** (via SDK) | HIGH | Official docs |
| `todo.updated` event hook | **YES** | HIGH | Official docs |
| Session-scoped TODOs | **YES** | HIGH | Source code analysis |
| 20+ items | **YES** (no hard limit) | MEDIUM | Source code - no limit found |

### How Plugin Access Works

**Reading TODOs via SDK:**
```typescript
// Via HTTP API
GET /session/:id/todo

// Returns:
[
  {
    "id": "todo-1",
    "content": "Task 1",
    "status": "pending",
    "priority": "high"
  },
  ...
]
```

**Monitoring TODOs via Plugin Event:**
```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const TodoMonitor: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "todo.updated") {
        const sessionId = event.properties?.sessionID
        // TODOs were just updated - take action
        console.log("TODOs changed in session:", sessionId)
      }
    }
  }
}
```

### TodoInfo Schema (Verified from Source)

```typescript
const TodoInfo = z.object({
  content: z.string().describe("Brief description of the task"),
  status: z.string().describe("Current status: pending, in_progress, completed, cancelled"),
  priority: z.string().describe("Priority level: high, medium, low"),
  id: z.string().describe("Unique identifier for the todo item"),
})
```

**Statuses:** `pending`, `in_progress`, `completed`, `cancelled`  
**Priorities:** `high`, `medium`, `low`

### Maximum Items

| Aspect | Finding | Confidence |
|--------|---------|------------|
| Hard limit | **No hard limit found** | MEDIUM |
| Practical limit | Context window constrained | HIGH |
| Recommended | LLM guidance says "3+ steps" | HIGH |

**Note:** The source code uses a simple array with no `.length` validation. Practical limits are LLM context window and UI rendering.

---

## 2. Hierarchical TODOs

### What is NOT Possible (Natively)

| Feature | Native Support | Confidence |
|---------|---------------|------------|
| Parent-child relationships | **NO** | HIGH |
| Nested todos | **NO** | HIGH |
| Grouping by category | **NO** (native) | HIGH |
| Custom metadata fields | **NO** | HIGH |

### Workarounds

**1. Content-based hierarchy (prefix convention):**
```json
[
  { "id": "1", "content": "[Phase 1] Research", "status": "completed", "priority": "high" },
  { "id": "1.1", "content": "[Phase 1] └ Context7 query", "status": "completed", "priority": "medium" },
  { "id": "1.2", "content": "[Phase 1] └ WebSearch", "status": "in_progress", "priority": "medium" },
  { "id": "2", "content": "[Phase 2] Implementation", "status": "pending", "priority": "high" }
]
```

**2. ID-based hierarchy (semantic IDs):**
```json
[
  { "id": "phase1", "content": "Phase 1: Foundation", "priority": "high" },
  { "id": "phase1.task1", "content": "Setup project structure", "priority": "medium" },
  { "id": "phase1.task2", "content": "Create config files", "priority": "medium" }
]
```

**3. Separate state file (recommended for iDumb):**
Store hierarchical state in `.idumb/brain/state.json` and use TODOs for flat progress display.

---

## 3. Stop Hooks & Enforcement

### `stop` Hook (CRITICAL FINDING)

OpenCode plugins CAN implement a `stop` hook that fires when the agent attempts to stop. This enables **TODO enforcement**.

**Source:** [johnlindquist's OpenCode Plugins Guide](https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a)

```typescript
export const TodoEnforcer: Plugin = async ({ client }) => {
  return {
    stop: async (input) => {
      const sessionId = input.sessionID || input.session_id
      
      // Fetch current TODOs
      const todos = await client.session.todo({ path: { id: sessionId } })
      
      // Check if work is complete
      const incomplete = todos.filter(t => 
        t.status === "pending" || t.status === "in_progress"
      )
      
      if (incomplete.length > 0) {
        // Prompt agent to continue
        await client.session.prompt({
          path: { id: sessionId },
          body: {
            parts: [{ 
              type: "text", 
              text: `You have ${incomplete.length} incomplete todos. Please complete or cancel them before stopping:\n${incomplete.map(t => `- ${t.content}`).join('\n')}` 
            }]
          }
        })
      }
    }
  }
}
```

### Related Session Events

| Event | Description | Use for Enforcement |
|-------|-------------|---------------------|
| `session.idle` | Agent finished responding | YES - check state |
| `session.deleted` | Session deleted | Cleanup only |
| `session.compacted` | Context compacted | Preserve TODO state |
| `session.error` | Error occurred | Log/recover |

**Note:** There is NO `session.stop` or `session.ending` event. The `stop` hook is the mechanism.

### Preventing Session Stop

| Method | Possible | Confidence |
|--------|----------|------------|
| `stop` hook prompts continuation | **YES** | MEDIUM |
| Block agent stop entirely | **NO** | MEDIUM |
| Force TODO update before stop | **YES** (via prompt) | MEDIUM |

**Limitation:** You cannot BLOCK the stop, but you CAN prompt the agent to continue, which effectively delays stop.

---

## 4. TODO Enforcement

### Can We Force Coordinator to Check TODO First?

| Method | Approach | Confidence |
|--------|----------|------------|
| `tool.execute.before` hook | Inject reminder before every tool | HIGH |
| Agent prompt configuration | Embed TODO-first instruction | HIGH |
| Compaction hook | Preserve TODO-awareness across compaction | HIGH |

**Pattern: TODO-First Enforcement**
```typescript
export const TodoFirstPlugin: Plugin = async ({ client }) => {
  let todoCheckedRecently = new Map<string, number>()
  
  return {
    "tool.execute.before": async (input, output) => {
      const sessionId = input.sessionID
      const lastCheck = todoCheckedRecently.get(sessionId) || 0
      const now = Date.now()
      
      // If it's been > 30 seconds since last TODO check, inject reminder
      if (now - lastCheck > 30000) {
        // Inject context via tui.prompt.append or output modification
        // Note: Cannot directly modify LLM context, but can influence prompts
      }
    },
    
    "tool.execute.after": async (input, output) => {
      if (input.tool === "todoread") {
        todoCheckedRecently.set(input.sessionID, Date.now())
      }
    }
  }
}
```

### Can We Inject TODO Context into Prompts?

| Method | Possible | Confidence |
|--------|----------|------------|
| Agent prompt file | **YES** - via `{file:./prompts/governance.txt}` | HIGH |
| Compaction hook | **YES** - inject into `output.context` | HIGH |
| `tool.execute.before` | **LIMITED** - can modify args, not inject context | MEDIUM |

**Best Pattern: Compaction Hook**
```typescript
"experimental.session.compacting": async (input, output) => {
  const sessionId = input.sessionID
  const todos = await client.session.todo({ path: { id: sessionId } })
  
  output.context.push(`## Current TODO State
${todos.map(t => `- [${t.status}] ${t.content}`).join('\n')}

CRITICAL: Review this TODO list before proceeding. Update status as you complete tasks.`)
}
```

### Is There a `tool.todowrite` Hook?

| Specific Hook | Available | Alternative |
|---------------|-----------|-------------|
| `tool.todowrite` hook | **NO** | Use `todo.updated` event |
| `tool.execute.before` for todowrite | **YES** | Filter by `input.tool === "todowrite"` |
| `tool.execute.after` for todowrite | **YES** | Validate TODOs after write |

**Pattern: Validate TODO Writes**
```typescript
"tool.execute.after": async (input, output) => {
  if (input.tool === "todowrite") {
    const todos = output.result?.metadata?.todos || []
    
    // Enforce governance rules
    const hasHighPriority = todos.some(t => t.priority === "high")
    if (!hasHighPriority && todos.length > 5) {
      // Log warning - consider toast notification
      await client.app.log({
        level: "warn",
        message: "Large TODO list without any high-priority items"
      })
    }
  }
}
```

---

## 5. oh-my-opencode Reference Pattern

The oh-my-opencode plugin includes a **"Todo Continuation Enforcer"** hook that's directly relevant:

| Hook | Purpose |
|------|---------|
| `todoContinuationEnforcer` | Triggers on `session.idle`, checks for incomplete TODOs, prompts agent to continue |

**Execution Order:** Fires after `session.idle`, checks TODO state, prompts continuation if needed.

This validates that our approach is viable and has a reference implementation.

---

## 6. Summary: What iDumb Can Do

### Fully Supported (HIGH Confidence)

| Feature | Implementation |
|---------|----------------|
| Read TODOs from plugin | SDK `GET /session/:id/todo` |
| Monitor TODO changes | `todo.updated` event |
| Enforce TODO update before stop | `stop` hook + prompt injection |
| Inject TODO awareness | Compaction hook + agent prompts |
| Validate TODO writes | `tool.execute.after` for todowrite |

### Requires Workaround (MEDIUM Confidence)

| Feature | Workaround |
|---------|------------|
| Hierarchical TODOs | Content prefixes or ID conventions |
| Grouping by category | Prefix naming (e.g., `[Phase 1]`) |
| Custom metadata | Encode in ID or content |
| Block session stop | Cannot block, but can prompt continuation |

### Not Possible (Native)

| Feature | Reason |
|---------|--------|
| Native parent-child TODOs | Schema doesn't support |
| Native TODO metadata | Fixed schema: id, content, status, priority only |
| Hard stop prevention | No blocking mechanism |
| Direct prompt injection | Must use hooks/agent config |

---

## 7. Recommended Architecture for iDumb

```
┌─────────────────────────────────────────────────────────────┐
│                    iDumb TODO Strategy                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. USE OpenCode's native TODO system for LLM visibility    │
│     - Flat list, convention-based hierarchy                 │
│     - Prefixes: [Phase X], [Validation], etc.               │
│                                                              │
│  2. STORE rich hierarchical state in .idumb/brain/          │
│     - state.json for full governance state                  │
│     - history/ for session forensics                        │
│                                                              │
│  3. SYNC between systems:                                    │
│     - todo.updated → update .idumb/brain/state.json         │
│     - session.compacting → inject from state.json           │
│                                                              │
│  4. ENFORCE via stop hook:                                   │
│     - Check incomplete TODOs on session.idle                │
│     - Prompt continuation if governance not satisfied        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Sources

### Primary (HIGH Confidence)
- [Context7: /anomalyco/opencode](https://context7.com/anomalyco/opencode) - Official documentation queries
- [OpenCode Official Docs - Tools](https://opencode.ai/docs/tools/) - todowrite/todoread documentation
- [OpenCode Official Docs - Plugins](https://opencode.ai/docs/plugins/) - Event hooks, stop hook pattern
- [Source Code Analysis](https://cefboud.com/posts/coding-agents-internals-opencode-deepdive/) - TodoInfo schema, implementation details

### Secondary (MEDIUM Confidence)
- [OpenCode Plugins Guide (Gist)](https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a) - stop hook pattern
- [oh-my-opencode DeepWiki](https://deepwiki.com/code-yeongyu/oh-my-opencode/) - Todo Continuation Enforcer pattern
- [GitHub Issues](https://github.com/anomalyco/opencode/issues) - Bug reports, feature requests

### Tertiary (LOW Confidence)
- Community blog posts and tutorials

---

## Metadata

**Confidence Breakdown:**
- TODO API access: HIGH - Official docs, verified code
- Stop hook for enforcement: MEDIUM - Community docs, not official
- Hierarchical workarounds: MEDIUM - No official guidance, logical deduction
- Maximum items: MEDIUM - No explicit limit found, assumed unlimited

**Research Date:** 2026-02-02  
**Valid Until:** 2026-02-16 (fast-moving project, check for updates)

---

## Appendix: Code Examples

### A. Complete TODO Enforcement Plugin

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const iDumbTodoEnforcer: Plugin = async ({ client }) => {
  const sessionState = new Map<string, { lastTodoCheck: number }>()
  
  return {
    // Monitor TODO changes
    event: async ({ event }) => {
      if (event.type === "todo.updated") {
        const sessionId = event.properties?.sessionID
        if (sessionId) {
          // Update governance state
          const state = sessionState.get(sessionId) || { lastTodoCheck: 0 }
          state.lastTodoCheck = Date.now()
          sessionState.set(sessionId, state)
        }
      }
    },
    
    // Validate TODO writes
    "tool.execute.after": async (input, output) => {
      if (input.tool === "todowrite") {
        const todos = output.result?.metadata?.todos || []
        const incomplete = todos.filter(t => 
          t.status === "pending" || t.status === "in_progress"
        )
        // Could emit toast or log if governance rules violated
      }
    },
    
    // Enforce TODO completion before stop
    stop: async (input) => {
      const sessionId = input.sessionID || input.session_id
      if (!sessionId) return
      
      try {
        const response = await client.session.todo({ path: { id: sessionId } })
        const todos = response.data || []
        
        const incomplete = todos.filter(t => 
          t.status === "pending" || t.status === "in_progress"
        )
        
        if (incomplete.length > 0) {
          await client.session.prompt({
            path: { id: sessionId },
            body: {
              parts: [{
                type: "text",
                text: `[iDumb Governance] You have ${incomplete.length} incomplete tasks:\n${incomplete.map(t => `- [${t.priority}] ${t.content}`).join('\n')}\n\nPlease complete or cancel these before stopping.`
              }]
            }
          })
        }
      } catch (error) {
        // Log error, don't block
        console.error("[iDumb] Error checking TODOs:", error)
      }
    },
    
    // Preserve TODO awareness across compaction
    "experimental.session.compacting": async (input, output) => {
      const sessionId = input.sessionID
      if (!sessionId) return
      
      try {
        const response = await client.session.todo({ path: { id: sessionId } })
        const todos = response.data || []
        
        if (todos.length > 0) {
          output.context.push(`## [iDumb] Active TODO State

Current tasks (preserve across compaction):
${todos.map(t => `- [${t.status.toUpperCase()}] [${t.priority}] ${t.content}`).join('\n')}

CRITICAL: Review and update this TODO list as you work.`)
        }
      } catch (error) {
        console.error("[iDumb] Error fetching TODOs for compaction:", error)
      }
    }
  }
}

export default iDumbTodoEnforcer
```

### B. Hierarchical TODO Convention

```typescript
// iDumb hierarchical TODO conventions
const createPhaseTask = (phase: number, task: string, subtask?: string): string => {
  const prefix = `[P${phase}]`
  if (subtask) {
    return `${prefix} └ ${task}: ${subtask}`
  }
  return `${prefix} ${task}`
}

// Usage in agent prompts:
// [P1] Foundation
// [P1] └ Setup: Create project structure
// [P1] └ Setup: Initialize npm
// [P2] Implementation
// [P2] └ Core: Build main module
```
