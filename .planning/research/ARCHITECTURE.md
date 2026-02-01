# Architecture Patterns: iDumb Meta-Framework Plugin

**Domain:** OpenCode Meta-Framework Plugin
**Researched:** 2026-02-01
**Overall confidence:** HIGH

## Executive Summary

iDumb is an OpenCode plugin that implements a meta-framework for agent governance, delegation control, and context preservation. Based on analysis of the `@opencode-ai/plugin` SDK (v1.1.40) and existing prototype implementation, the architecture follows a **hub-and-spoke pattern** with the plugin acting as a central coordination layer between OpenCode's core systems and specialized agents.

The plugin architecture is built around three core concepts:
1. **Lifecycle Hook Interception** - Subscribing to OpenCode events to inject governance
2. **State Persistence** - File-based state management for cross-session continuity
3. **Agent Context Injection** - Custom tools that provide agents with governance context

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OpenCode Core Platform                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Session   │  │    Tool     │  │  Permission │  │   Compaction        │ │
│  │   System    │  │   System    │  │   System    │  │   System            │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                   │            │
│         └────────────────┴────────────────┴───────────────────┘            │
│                                    │                                       │
│                         ┌──────────▼──────────┐                            │
│                         │   iDumb Plugin      │                            │
│                         │   (Event Hooks)     │                            │
│                         └──────────┬──────────┘                            │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────▼─────────┐ ┌────▼─────┐ ┌────────▼────────┐
         │   State Manager    │ │  Custom  │ │ Context Injector│
         │   (.idumb-brain/)  │ │  Tools   │ │  (Pre-exec)     │
         └──────────┬─────────┘ └────┬─────┘ └────────┬────────┘
                    │                │                │
         ┌──────────▼────────────────┴────────────────▼────────┐
         │                  Agent Ecosystem                    │
         │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
         │  │ Supreme │ │Governance│ │Validator │ │ Builder │  │
         │  │Coord.   │ │  Agents  │ │  Agents  │ │ Agents  │  │
         │  └─────────┘ └──────────┘ └──────────┘ └──────────┘  │
         └──────────────────────────────────────────────────────┘
```

## Component Boundaries

### 1. Plugin Entry Point

**File:** `.opencode/plugins/idumb-plugin.ts`

**Responsibilities:**
- Export plugin function conforming to `Plugin` type from `@opencode-ai/plugin`
- Receive `PluginInput` (client, project, directory, worktree, serverUrl, $)
- Return `Hooks` object with lifecycle subscribers

**Communicates With:**
- OpenCode Core (via returned Hooks)
- State Manager (via file system)
- Agent Context System (via custom tools)

**Interface:**
```typescript
export type PluginInput = {
    client: ReturnType<typeof createOpencodeClient>;
    project: Project;
    directory: string;
    worktree: string;
    serverUrl: URL;
    $: BunShell;
};

export type Plugin = (input: PluginInput) => Promise<Hooks>;
```

### 2. Event Subscribers (Lifecycle Hooks)

**Responsibilities:**
- Intercept and respond to OpenCode lifecycle events
- Inject governance context at critical moments
- Track session state transitions

**Available Hooks (from SDK):**

| Hook | Trigger | Use Case |
|------|---------|----------|
| `session.created` | New session starts | Zero-turn agent priming |
| `session.updated` | Session changes | Capture Turn-1 intent |
| `tool.execute.before` | Before tool runs | Pre-execution validation, delegation context |
| `tool.execute.after` | After tool completes | Result tracking, completion validation |
| `experimental.session.compacting` | Before compaction | SACRED anchor preservation |
| `permission.ask` | Permission requested | Auto-approval rules, audit logging |
| `chat.message` | New message received | Intent detection, routing hints |
| `chat.params` | LLM params sent | Temperature/topP adjustment per agent |
| `event` | Any event | Logging, metrics, debugging |

**Communicates With:**
- OpenCode Core (receives events, can call client methods)
- State Manager (persists event-derived data)
- Context Injector (triggers prompt injection)

### 3. Custom Tools

**Responsibilities:**
- Provide agents with framework-aware capabilities
- Enforce completion protocols
- Enable context anchoring for compaction survival

**iDumb Tool Set:**

| Tool | Purpose | When Called |
|------|---------|-------------|
| `idumb_init` | Retrieve governance context | First action in every session |
| `idumb_complete` | Record task completion | Before claiming work done |
| `idumb_anchor` | Save critical context | Key decisions, original intent |

**Tool Context Available:**
```typescript
type ToolContext = {
    sessionID: string;
    messageID: string;
    agent: string;
    directory: string;
    worktree: string;
    abort: AbortSignal;
    metadata(input: { title?: string; metadata?: Record<string, any> }): void;
    ask(input: AskInput): Promise<void>;
};
```

**Communicates With:**
- Agents (exposed as callable tools)
- State Manager (reads/writes state)

### 4. State Management System

**Location:** `.idumb-brain/` directory

**Responsibilities:**
- Persist session state across agent lifecycles
- Store agent definitions and governance rules
- Maintain SACRED anchors through compaction

**State Files:**

| File | Format | Purpose |
|------|--------|---------|
| `state.json` | JSON | Session registry, anchors, metadata |
| `agents/{name}.md` | Markdown | Agent-specific context files |
| `contexts/{agent}.md` | Markdown | Governance rules per agent type |

**State Schema:**
```typescript
interface IdumbState {
    version: string;
    initialized: boolean;
    sessions: Record<string, SessionState>;
    anchors: AnchorEntry[];
}

interface SessionState {
    id: string;
    agent: string | null;
    parentId: string | null;
    turnOneIntent: string | null;
    createdAt: string;
    lastActive: string;
    contextInjected: boolean;
}

interface AnchorEntry {
    sessionId: string;
    intent: string;
    timestamp: string;
    preserved: boolean;
}
```

**Communicates With:**
- Plugin Entry Point (loads/saves state)
- All hooks (reads session data)
- Custom tools (updates anchors)

### 5. Context Injection System

**Responsibilities:**
- Prepend governance context to agent prompts
- Inject parent context during delegation
- Preserve SACRED anchors through compaction

**Injection Points:**

| Point | Mechanism | Content |
|-------|-----------|---------|
| Session Start | `client.session.prompt({ system })` | Agent governance rules |
| Tool Execution | `tool.execute.before` hook | Delegation handoff context |
| Compaction | `experimental.session.compacting` | SACRED anchors, original intent |

**Communicates With:**
- OpenCode Client (calls `session.prompt`)
- State Manager (retrieves context data)

### 6. Agent Definitions

**Location:** `.opencode/agents/` (standard OpenCode location)

**Responsibilities:**
- Define specialized agent personas
- Specify agent capabilities and constraints
- Link to governance context

**Agent Hierarchy:**

```
Supreme Coordinator
├── Governance Agents
│   ├── Workflow Enforcer
│   ├── Quality Validator
│   └── Security Auditor
├── Builder Agents
│   ├── Code Generator
│   ├── Test Writer
│   └── Documentation Writer
└── Utility Agents
    ├── Researcher
    └── Analyst
```

**Communicates With:**
- Context Injection System (receives governance)
- Custom Tools (calls framework tools)
- Plugin Hooks (triggered via delegation)

### 7. Framework Wrapper Layer

**Responsibilities:**
- Map GSD/BMAD concepts to OpenCode constructs
- Provide semantic API for framework operations
- Abstract OpenCode SDK complexity

**Mapping Table:**

| GSD/BMAD Concept | OpenCode Construct | iDumb Wrapper |
|------------------|-------------------|---------------|
| Workflow Phase | Session with context | `idumb_init` → phase context |
| Task Delegation | `task` tool call | `tool.execute.before` injection |
| Agent Handoff | Sub-session creation | Parent context preservation |
| Completion Gate | Manual verification | `idumb_complete` validation |
| State Checkpoint | File persistence | State Manager API |
| Context Compaction | `experimental.session.compacting` | SACRED anchor injection |

## Data Flow

### 1. Session Initialization Flow

```
User Creates Session
       │
       ▼
OpenCode fires session.created
       │
       ▼
iDumb Plugin receives event
       │
       ├─► Detects agent from title
       │
       ├─► Creates session state entry
       │
       └─► Calls client.session.prompt({
              noReply: true,
              system: governanceContext
           })
       │
       ▼
Agent receives governance injection
       │
       ▼
Agent calls idumb_init (MANDATORY)
       │
       └─► Receives full context + state
```

### 2. Delegation Flow

```
Parent Agent calls task tool
       │
       ▼
tool.execute.before hook fires
       │
       ├─► Identifies parent session
       │
       ├─► Retrieves parent turnOneIntent
       │
       └─► Injects parent context into args.prompt
       │
       ▼
Child session created with context
       │
       ▼
Child calls idumb_init
       │
       └─► Receives parent context
       │
       ▼
Child completes work
       │
       ▼
tool.execute.after fires
       │
       └─► Links child session to parent
```

### 3. Compaction Survival Flow

```
Session approaches token limit
       │
       ▼
OpenCode prepares compaction
       │
       ▼
experimental.session.compacting fires
       │
       ├─► Retrieves session turnOneIntent
       │
       ├─► Collects user-saved anchors
       │
       ├─► Builds parent context chain
       │
       └─► Injects all into output.context
       │
       ▼
Compaction includes SACRED context
       │
       ▼
Post-compaction session retains
original intent + critical anchors
```

### 4. State Persistence Flow

```
Any hook/tool executes
       │
       ├─► Reads state from .idumb/state.json
       │
       ├─► Modifies state in memory
       │
       └─► Calls saveState(directory, state)
              │
              ▼
         Writes to .idumb/state.json
              │
              ▼
         All subsequent reads see
         updated state
```

## Patterns to Follow

### Pattern 1: Zero-Turn Priming

**What:** Inject governance context before agent takes any action
**When:** Every new session via `session.created` hook
**How:**
```typescript
"session.created": async (event) => {
    const sessionId = event.properties.info.id;
    const agent = detectAgentFromTitle(event.properties.info.title);
    
    await client.session.prompt({
        path: { id: sessionId },
        body: {
            noReply: true,  // Don't generate response
            system: getGovernanceContext(agent),
            parts: [{ type: "text", text: "Initialize agent..." }]
        }
    });
}
```

### Pattern 2: SACRED Anchors

**What:** Preserve critical context through compaction
**When:** User saves intent via `idumb_anchor`, auto-saved on first message
**How:**
```typescript
"experimental.session.compacting": async (input, output) => {
    const contextParts: string[] = [];
    
    // Original intent
    if (session?.turnOneIntent) {
        contextParts.push(`## SACRED ANCHOR: ${session.turnOneIntent}`);
    }
    
    // User anchors
    const anchors = state.anchors.filter(a => a.preserved);
    contextParts.push(...anchors.map(a => a.intent));
    
    output.context.push(contextParts.join("\n\n"));
}
```

### Pattern 3: Delegation Context Injection

**What:** Pass parent context to child agents during delegation
**When:** `tool.execute.before` for task tool
**How:**
```typescript
"tool.execute.before": async (input, output) => {
    if (input.tool === "task") {
        const parentSession = state.sessions[input.sessionID];
        const parentContext = parentSession?.turnOneIntent 
            ? `## PARENT CONTEXT\n${parentSession.turnOneIntent}` 
            : "";
        
        output.args.prompt = `## DELEGATION HANDOFF\n${parentContext}\n\n${output.args.prompt}`;
    }
}
```

### Pattern 4: Completion Validation

**What:** Enforce verification before claiming completion
**When:** Agent calls `idumb_complete`
**How:**
```typescript
idumb_complete: tool({
    args: {
        summary: tool.schema.string(),
        verified: tool.schema.boolean()
    },
    async execute(args, context) {
        if (!args.verified) {
            return `⚠️ Work not verified! Run tests, check types, confirm build.`;
        }
        // Record completion...
    }
})
```

### Pattern 5: Hierarchical State Tracking

**What:** Track parent-child relationships between sessions
**When:** Child session created from task tool
**How:**
```typescript
"tool.execute.after": async (input, output) => {
    if (input.tool === "task") {
        // Extract child session ID from output
        const match = output.output?.match(/session_id:\s*([\w-]+)/);
        if (match) {
            state.sessions[match[1]].parentId = input.sessionID;
            saveState(directory, state);
        }
    }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Blocking Tool Execution

**What:** Throwing errors in `tool.execute.before` to block tools
**Why Bad:** Breaks agent workflows unexpectedly
**Instead:** Log warnings, use permission hooks for blocking:
```typescript
// BAD - Blocks delegation
tool.execute.before: async (input, output) => {
    if (input.tool === "task") {
        throw new Error("Delegation blocked!");  // DON'T
    }
}

// GOOD - Log and allow
log("Delegation detected", { session: input.sessionID });
```

### Anti-Pattern 2: Synchronous State Writes

**What:** Writing state on every hook call synchronously
**Why Bad:** Performance bottleneck, race conditions
**Instead:** Batch writes, use debouncing:
```typescript
// GOOD - Write only when state changes
if (stateChanged) {
    saveState(directory, state);
}
```

### Anti-Pattern 3: Session ID Assumptions

**What:** Assuming session IDs are stable or sequential
**Why Bad:** IDs are opaque strings, format may change
**Instead:** Use IDs as opaque references only:
```typescript
// BAD
const sessionNum = parseInt(sessionId.split("_")[1]);

// GOOD
state.sessions[sessionId] = { /* ... */ };
```

### Anti-Pattern 4: Missing Error Handling in Hooks

**What:** Hooks that throw unhandled errors
**Why Bad:** Can crash plugin, affect OpenCode stability
**Instead:** Wrap all hook logic in try-catch:
```typescript
"session.created": async (event) => {
    try {
        // Hook logic...
    } catch (e) {
        log("Error in session.created", { error: e });
        // Don't throw - let OpenCode continue
    }
}
```

### Anti-Pattern 5: Context Injection Without noReply

**What:** Using `session.prompt` without `noReply: true`
**Why Bad:** Generates unwanted LLM response
**Instead:** Always set `noReply: true` for system injections:
```typescript
await client.session.prompt({
    path: { id: sessionId },
    body: {
        noReply: true,  // Required!
        system: governanceContext,
        parts: []
    }
});
```

## Scalability Considerations

| Concern | At 10 Sessions | At 100 Sessions | At 1000 Sessions |
|---------|----------------|-----------------|------------------|
| **State File Size** | < 100KB | ~ 1MB | ~ 10MB |
| **State Management** | Single JSON file | Single JSON file | Shard by project |
| **Anchor Storage** | In-memory + disk | In-memory + disk | Database backend |
| **Event Processing** | All events | Filter by type | Async queue |
| **Context Injection** | Per-session | Per-session | Cached templates |

## Suggested Build Order

Based on component dependencies:

### Phase 1: Foundation
1. **Plugin Entry Point** - Basic plugin structure with no-op hooks
2. **State Management** - File-based state persistence
3. **idumb_init Tool** - Basic context retrieval

### Phase 2: Lifecycle Integration
4. **session.created Hook** - Zero-turn priming
5. **session.updated Hook** - Turn-1 intent capture
6. **idumb_anchor Tool** - Context preservation

### Phase 3: Tool Integration
7. **tool.execute.before Hook** - Delegation interception
8. **tool.execute.after Hook** - Result tracking
9. **idumb_complete Tool** - Completion validation

### Phase 4: Advanced Features
10. **experimental.session.compacting Hook** - SACRED anchors
11. **permission.ask Hook** - Auto-approval rules
12. **Context Injection Optimization** - Cached templates

### Phase 5: Agent Ecosystem
13. **Agent Definitions** - Specialized agent personas
14. **Framework Wrapper API** - Semantic GSD/BMAD mapping
15. **CLI Commands** - /idumb-init, /idumb-configure, /idumb-status

## Dependencies Between Components

```
Plugin Entry Point
    │
    ├─► State Management (required by all)
    │
    ├─► Custom Tools ─┬─► idumb_init
    │                 ├─► idumb_complete
    │                 └─► idumb_anchor
    │
    ├─► Event Subscribers ─┬─► session.created ─┬─► Context Injection
    │                      ├─► session.updated   │
    │                      ├─► tool.execute.*    │
    │                      ├─► session.compacting┘
    │                      └─► permission.ask
    │
    └─► Framework Wrapper Layer
        │
        └─► Agent Definitions
```

## Sources

- **HIGH Confidence:** `@opencode-ai/plugin` SDK v1.1.40 TypeScript definitions (`index.d.ts`, `tool.d.ts`)
- **HIGH Confidence:** `@opencode-ai/sdk` TypeScript definitions (`sdk.gen.d.ts`, `types.gen.d.ts`)
- **HIGH Confidence:** Existing iDumb prototype implementation (`idumb-plugin.ts`)
- **HIGH Confidence:** iDumb state file (`.idumb/state.json`)
- **MEDIUM Confidence:** Agent hierarchy research - 2026 orchestrator-worker patterns (web search)
- **MEDIUM Confidence:** Meta-framework plugin patterns (web search)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Plugin SDK API | HIGH | Based on actual TypeScript definitions from node_modules |
| Hook Lifecycle | HIGH | Verified with SDK types and working prototype |
| State Management | HIGH | Prototype implementation tested and working |
| Context Injection | HIGH | `session.prompt` pattern verified in SDK |
| Agent Hierarchy | MEDIUM | Based on 2026 architecture trends, not OpenCode-specific |
| Compaction Behavior | MEDIUM | `experimental.*` hooks may change |
