# Implementation Specification for idumb-implementer

**From**: idumb-architect  
**To**: idumb-implementer  
**Phase**: 1 (Foundation)  
**Pivotal Trial**: Trial 1 - State persistence through 5 compactions

---

## Pre-Implementation Setup

### Step 1: Create Git Worktree

```bash
cd /Users/apple/Documents/coding-projects/idumb
git worktree add ../idumb-clean main --detach
cd ../idumb-clean
git checkout -b plugin-reboot
```

### Step 2: Initialize Directory Structure

```bash
mkdir -p src/schemas src/lib src/tools
```

---

## Files to Create (In Order)

### File 1: `package.json`

```json
{
  "name": "idumb-plugin",
  "version": "1.0.0",
  "description": "Intelligent Delegation Using Managed Boundaries - OpenCode governance plugin",
  "type": "module",
  "main": "dist/plugin.js",
  "types": "dist/plugin.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^0.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": ">=0.2.0"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "keywords": [
    "opencode",
    "plugin",
    "ai",
    "governance"
  ],
  "license": "MIT"
}
```

### File 2: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### File 3: `src/schemas/state.ts`

```typescript
/**
 * State Schema - Zod definitions for governance state
 * 
 * CRITICAL: This is the source of truth for state shape.
 * All state operations must validate against these schemas.
 */
import { z } from "zod"

/**
 * Anchor - A piece of context that survives compaction
 * 
 * Used to preserve critical decisions, errors, and checkpoints
 * across session compaction events.
 */
export const AnchorSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["decision", "context", "checkpoint", "error"]),
  content: z.string().max(2000),
  priority: z.enum(["critical", "high", "normal"]),
  created: z.string().datetime(),
  survives_compaction: z.boolean().default(true)
})

/**
 * Main governance state
 * 
 * Persisted to .idumb/state.json
 * Updated on every governance action
 */
export const StateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
  initialized: z.string().datetime(),
  phase: z.string().optional(),
  validation_count: z.number().int().min(0).default(0),
  last_validation: z.string().datetime().nullable().default(null),
  anchors: z.array(AnchorSchema).default([]),
  compaction_count: z.number().int().min(0).default(0)
})

// Type exports for TypeScript inference
export type State = z.infer<typeof StateSchema>
export type Anchor = z.infer<typeof AnchorSchema>

/**
 * Create a default state object
 * Used when no state file exists
 */
export function createDefaultState(): State {
  return StateSchema.parse({
    version: "1.0.0",
    initialized: new Date().toISOString(),
    anchors: [],
    validation_count: 0,
    last_validation: null,
    compaction_count: 0
  })
}
```

### File 4: `src/schemas/config.ts`

```typescript
/**
 * Config Schema - Zod definitions for plugin configuration
 */
import { z } from "zod"

export const ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  max_anchors: z.number().int().min(1).max(100).default(20),
  compaction_context_limit: z.number().int().min(500).max(5000).default(2000),
  log_level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  validation: z.object({
    auto_validate: z.boolean().default(false),
    validation_interval: z.number().int().min(1).default(5)
  }).default({})
})

export type Config = z.infer<typeof ConfigSchema>

export function createDefaultConfig(): Config {
  return ConfigSchema.parse({})
}
```

### File 5: `src/schemas/index.ts`

```typescript
/**
 * Schema barrel export
 */
export * from "./state.js"
export * from "./config.js"
```

### File 6: `src/lib/logging.ts`

```typescript
/**
 * Structured file logging - NO console.log
 * 
 * CRITICAL: console.log causes TUI background text pollution.
 * All output must go to log files.
 */
import { existsSync, mkdirSync, appendFileSync } from "fs"
import { join, dirname } from "path"

export type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

let currentLogLevel: LogLevel = "info"

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level
}

export function getLogPath(directory: string): string {
  return join(directory, ".idumb", "plugin.log")
}

export function log(
  directory: string,
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): void {
  // Skip if below current log level
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLogLevel]) return
  
  const logPath = getLogPath(directory)
  const logDir = dirname(logPath)
  
  // Ensure log directory exists
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true })
  }
  
  const timestamp = new Date().toISOString()
  const logEntry = JSON.stringify({
    timestamp,
    level,
    message,
    ...(data && { data })
  })
  
  appendFileSync(logPath, logEntry + "\n")
}
```

### File 7: `src/lib/persistence.ts`

```typescript
/**
 * Persistence layer - Atomic file operations with validation
 * 
 * Pattern:
 * 1. Validate data with Zod
 * 2. Write to temp file
 * 3. Atomic rename to target
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, renameSync } from "fs"
import { join, dirname } from "path"
import { StateSchema, type State, createDefaultState } from "../schemas/state.js"
import { log } from "./logging.js"

export function getStatePath(directory: string): string {
  return join(directory, ".idumb", "state.json")
}

export function getIdumbDir(directory: string): string {
  return join(directory, ".idumb")
}

/**
 * Read state from disk with validation
 * Returns null if file doesn't exist or is invalid
 */
export function readState(directory: string): State | null {
  const statePath = getStatePath(directory)
  
  if (!existsSync(statePath)) {
    return null
  }
  
  try {
    const raw = readFileSync(statePath, "utf-8")
    const parsed = JSON.parse(raw)
    return StateSchema.parse(parsed)
  } catch (error) {
    log(directory, "error", "Failed to read state", { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return null
  }
}

/**
 * Write state to disk with atomic operation
 * Validates data before writing
 */
export function writeState(directory: string, state: State): void {
  const statePath = getStatePath(directory)
  const tempPath = statePath + ".tmp"
  const stateDir = dirname(statePath)
  
  // Validate state
  const validated = StateSchema.parse(state)
  
  // Ensure directory exists
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true })
  }
  
  // Write to temp file
  writeFileSync(tempPath, JSON.stringify(validated, null, 2))
  
  // Atomic rename
  renameSync(tempPath, statePath)
  
  log(directory, "debug", "State written", { compaction_count: validated.compaction_count })
}

/**
 * Ensure state file exists, create if not
 */
export function ensureState(directory: string): State {
  const existing = readState(directory)
  if (existing) return existing
  
  const initial = createDefaultState()
  writeState(directory, initial)
  return initial
}
```

### File 8: `src/lib/index.ts`

```typescript
/**
 * Library barrel export
 */
export * from "./logging.js"
export * from "./persistence.js"
```

### File 9: `src/tools/state.ts`

```typescript
/**
 * State management tools
 * 
 * Exposes governance state to OpenCode agents via custom tools.
 */
import { tool } from "@opencode-ai/plugin"
import { readState, writeState, ensureState } from "../lib/persistence.js"
import { createDefaultState, type Anchor } from "../schemas/state.js"
import { log } from "../lib/logging.js"
import { randomUUID } from "crypto"

export const stateTools = {
  /**
   * Read current governance state
   */
  idumb_state_read: tool({
    description: "Read current iDumb governance state including anchors and compaction count. Returns JSON with state data or uninitialized status.",
    args: {},
    async execute(_args, context) {
      const state = readState(context.directory)
      
      if (!state) {
        return JSON.stringify({ 
          status: "uninitialized",
          message: "No state file found. Use idumb_state_write to initialize."
        }, null, 2)
      }
      
      return JSON.stringify({
        status: "ok",
        state: {
          version: state.version,
          initialized: state.initialized,
          phase: state.phase ?? "none",
          validation_count: state.validation_count,
          last_validation: state.last_validation,
          anchor_count: state.anchors.length,
          compaction_count: state.compaction_count
        },
        anchors: state.anchors.map(a => ({
          id: a.id,
          type: a.type,
          priority: a.priority,
          content: a.content.slice(0, 100) + (a.content.length > 100 ? "..." : "")
        }))
      }, null, 2)
    }
  }),

  /**
   * Update governance state
   */
  idumb_state_write: tool({
    description: "Update iDumb governance state. Can set phase, increment validation count, or initialize state.",
    args: {
      phase: tool.schema.string().optional().describe("Set current workflow phase"),
      increment_validation: tool.schema.boolean().optional().describe("Increment validation counter")
    },
    async execute(args, context) {
      let state = readState(context.directory) ?? createDefaultState()
      
      if (args.phase !== undefined) {
        state.phase = args.phase
      }
      
      if (args.increment_validation) {
        state.validation_count += 1
        state.last_validation = new Date().toISOString()
      }
      
      writeState(context.directory, state)
      log(context.directory, "info", "State updated", { phase: state.phase })
      
      return JSON.stringify({
        status: "updated",
        phase: state.phase,
        validation_count: state.validation_count
      }, null, 2)
    }
  }),

  /**
   * Add an anchor (context that survives compaction)
   */
  idumb_anchor_add: tool({
    description: "Add a governance anchor that survives session compaction. Use for critical decisions, errors, or checkpoints.",
    args: {
      type: tool.schema.enum(["decision", "context", "checkpoint", "error"]).describe("Type of anchor"),
      content: tool.schema.string().describe("Anchor content (max 2000 chars)"),
      priority: tool.schema.enum(["critical", "high", "normal"]).optional().describe("Priority level (default: normal)")
    },
    async execute(args, context) {
      const state = ensureState(context.directory)
      
      const anchor: Anchor = {
        id: randomUUID(),
        type: args.type,
        content: args.content.slice(0, 2000),
        priority: args.priority ?? "normal",
        created: new Date().toISOString(),
        survives_compaction: true
      }
      
      state.anchors.push(anchor)
      writeState(context.directory, state)
      
      log(context.directory, "info", "Anchor added", { id: anchor.id, type: anchor.type })
      
      return JSON.stringify({
        status: "created",
        anchor: {
          id: anchor.id,
          type: anchor.type,
          priority: anchor.priority
        },
        total_anchors: state.anchors.length
      }, null, 2)
    }
  }),

  /**
   * List all anchors
   */
  idumb_anchor_list: tool({
    description: "List all governance anchors with their content and priority.",
    args: {
      priority: tool.schema.enum(["critical", "high", "normal", "all"]).optional().describe("Filter by priority")
    },
    async execute(args, context) {
      const state = readState(context.directory)
      
      if (!state) {
        return JSON.stringify({
          status: "uninitialized",
          anchors: []
        }, null, 2)
      }
      
      let anchors = state.anchors
      if (args.priority && args.priority !== "all") {
        anchors = anchors.filter(a => a.priority === args.priority)
      }
      
      return JSON.stringify({
        status: "ok",
        total: state.anchors.length,
        filtered: anchors.length,
        anchors: anchors.map(a => ({
          id: a.id,
          type: a.type,
          priority: a.priority,
          content: a.content,
          created: a.created
        }))
      }, null, 2)
    }
  })
}
```

### File 10: `src/plugin.ts`

```typescript
/**
 * iDumb Plugin - Main entry point
 * 
 * Intelligent Delegation Using Managed Boundaries
 * 
 * A governance plugin for OpenCode that provides:
 * - State persistence across session compaction
 * - Anchor system for preserving critical context
 * - Custom tools for governance operations
 * 
 * CRITICAL: NO console.log - use file logging only
 */
import type { Plugin } from "@opencode-ai/plugin"
import { stateTools } from "./tools/state.js"
import { readState, writeState, ensureState } from "./lib/persistence.js"
import { log } from "./lib/logging.js"
import type { Anchor } from "./schemas/state.js"

/**
 * Format anchors for compaction context injection
 * Groups by priority for clear LLM consumption
 */
function formatAnchorsForCompaction(anchors: Anchor[], limit: number): string {
  // Sort by priority: critical > high > normal
  const priorityOrder = { critical: 0, high: 1, normal: 2 }
  const sorted = [...anchors].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )
  
  let context = "## iDumb Governance Context (Preserved Anchors)\n\n"
  let currentLength = context.length
  
  const critical = sorted.filter(a => a.priority === "critical")
  const high = sorted.filter(a => a.priority === "high")
  const normal = sorted.filter(a => a.priority === "normal")
  
  // Always include critical anchors
  if (critical.length > 0) {
    context += "### CRITICAL (Must Preserve)\n"
    for (const a of critical) {
      const line = `- [${a.type}] ${a.content}\n`
      if (currentLength + line.length < limit) {
        context += line
        currentLength += line.length
      }
    }
  }
  
  // Include high priority if space allows
  if (high.length > 0 && currentLength < limit * 0.8) {
    context += "\n### HIGH Priority\n"
    for (const a of high) {
      const line = `- [${a.type}] ${a.content}\n`
      if (currentLength + line.length < limit) {
        context += line
        currentLength += line.length
      }
    }
  }
  
  // Include normal priority if space allows
  if (normal.length > 0 && currentLength < limit * 0.6) {
    context += "\n### Normal Priority\n"
    for (const a of normal) {
      const line = `- [${a.type}] ${a.content}\n`
      if (currentLength + line.length < limit) {
        context += line
        currentLength += line.length
      }
    }
  }
  
  return context
}

/**
 * Main plugin factory
 */
export const IdumbPlugin: Plugin = async (ctx) => {
  const { directory } = ctx
  
  // Initialize state on first run
  const existingState = readState(directory)
  if (!existingState) {
    ensureState(directory)
    log(directory, "info", "iDumb plugin initialized - state created")
  } else {
    log(directory, "info", "iDumb plugin loaded", { 
      compaction_count: existingState.compaction_count,
      anchor_count: existingState.anchors.length
    })
  }
  
  return {
    // ====================================================================
    // CUSTOM TOOLS
    // ====================================================================
    tool: stateTools,
    
    // ====================================================================
    // EVENT SUBSCRIPTION
    // ====================================================================
    event: async ({ event }) => {
      // Track session creation
      if (event.type === "session.created") {
        const sessionId = event.properties?.info?.id ?? "unknown"
        log(directory, "info", `Session created: ${sessionId}`)
      }
      
      // Track compaction events
      if (event.type === "session.compacted") {
        const state = readState(directory)
        if (state) {
          state.compaction_count += 1
          writeState(directory, state)
          log(directory, "info", `Compaction completed`, { 
            count: state.compaction_count,
            anchors_preserved: state.anchors.length
          })
        }
      }
    },
    
    // ====================================================================
    // COMPACTION SURVIVAL HOOK (Critical for Trial 1)
    // ====================================================================
    "experimental.session.compacting": async (input, output) => {
      const state = readState(directory)
      
      // Nothing to inject if no state or anchors
      if (!state || state.anchors.length === 0) {
        log(directory, "debug", "No anchors to inject into compaction")
        return
      }
      
      // Format and inject anchors
      const contextLimit = 2000 // Default limit
      const anchorContext = formatAnchorsForCompaction(state.anchors, contextLimit)
      
      output.context.push(anchorContext)
      
      log(directory, "info", "Anchors injected into compaction", {
        anchor_count: state.anchors.length,
        context_length: anchorContext.length
      })
    }
  }
}

// Default export for OpenCode plugin loading
export default IdumbPlugin
```

---

## Post-Implementation Steps

### 1. Install Dependencies

```bash
cd ../idumb-clean
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Verify Build

```bash
ls -la dist/
# Should see: plugin.js, plugin.d.ts, and subdirectories
```

---

## Trial 1 Validation Steps

After implementation, `idumb-tester` should execute:

1. **Create anchor**: Call `idumb_anchor_add` with test content
2. **Verify state**: Call `idumb_state_read` - should show anchor
3. **Simulate compaction**: Trigger session compaction
4. **Verify survival**: Call `idumb_anchor_list` - anchor should persist
5. **Repeat 5x**: Loop compaction cycle, verify `compaction_count` increments

**Pass Criteria**:
- All 5 compaction cycles complete
- `state.compaction_count === 5`
- All anchors preserved
- No TUI pollution (check for background text)
- Tools work with default OpenCode agent

---

## Architecture Compliance Checklist

- [ ] No markdown agents created
- [ ] No markdown commands created
- [ ] All state access through Zod validation
- [ ] Atomic write pattern used
- [ ] No console.log in any file
- [ ] All tools exported via `tool()` helper
- [ ] Plugin uses only approved hooks
- [ ] Works with innate OpenCode agents

---

**Ready for `idumb-implementer` to execute.**
