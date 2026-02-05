# Phase 1: Foundation Architecture

**Author**: idumb-architect  
**Date**: 2026-02-05  
**Pivotal Trial**: Trial 1 - Basic state persistence through 5 compactions

---

## Architecture Decision 1: Clean Worktree Structure

### What
Create a new git worktree `../idumb-clean` with minimal, clean TypeScript structure following engine/tool/hook separation.

### Why
- Current `src/plugins/idumb-core.ts` is 44KB monolith with mixed concerns
- Plan requires clean-slate approach for maintainability
- Engine pattern separates business logic from integration points

### Impact
- All new code goes in `../idumb-clean/`
- No markdown agents or commands
- Zero dependency on existing 23 agents

### Structure
```
idumb-clean/
├── package.json              # @opencode-ai/plugin, zod only
├── tsconfig.json             # Strict mode
├── src/
│   ├── plugin.ts             # Main entry (default export)
│   ├── schemas/
│   │   ├── state.ts          # State Zod schema
│   │   ├── config.ts         # Config Zod schema
│   │   └── index.ts          # Barrel export
│   ├── lib/
│   │   ├── persistence.ts    # Disk I/O (atomic writes)
│   │   ├── logging.ts        # Structured file logging
│   │   └── index.ts          # Barrel export
│   └── tools/
│       └── state.ts          # idumb_state_read/write tools
└── .idumb/
    └── state.json            # Runtime state (created on init)
```

---

## Architecture Decision 2: Schema-First Design

### What
Define all data structures with Zod schemas BEFORE implementation.

### Why
- Runtime validation catches corrupted state
- TypeScript inference from Zod schemas
- Single source of truth for data shape

### Impact
- All state/config access goes through schema validation
- Type-safe throughout the codebase
- Self-documenting interfaces

---

## API Contracts

### State Schema (`src/schemas/state.ts`)

```typescript
import { z } from "zod"

// Anchor - critical context that survives compaction
export const AnchorSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["decision", "context", "checkpoint", "error"]),
  content: z.string().max(2000),
  priority: z.enum(["critical", "high", "normal"]),
  created: z.string().datetime(),
  survives_compaction: z.boolean().default(true)
})

// Main governance state
export const StateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
  initialized: z.string().datetime(),
  phase: z.string().optional(),
  validation_count: z.number().int().min(0).default(0),
  last_validation: z.string().datetime().nullable().default(null),
  anchors: z.array(AnchorSchema).default([]),
  compaction_count: z.number().int().min(0).default(0)
})

// Type inference
export type State = z.infer<typeof StateSchema>
export type Anchor = z.infer<typeof AnchorSchema>
```

### Config Schema (`src/schemas/config.ts`)

```typescript
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
```

---

## Architecture Decision 3: Persistence Layer Design

### What
Atomic file operations with validation on every read/write.

### Why
- Prevents corrupted state from partial writes
- Validates data shape on every operation
- Enables recovery from invalid state

### Pattern
```typescript
// Write pattern: temp file → atomic rename
async function writeState(dir: string, state: State): Promise<void> {
  const validated = StateSchema.parse(state)
  const statePath = join(dir, ".idumb", "state.json")
  const tempPath = join(dir, ".idumb", "state.json.tmp")
  
  // Ensure directory exists
  mkdirSync(dirname(statePath), { recursive: true })
  
  // Write to temp file
  writeFileSync(tempPath, JSON.stringify(validated, null, 2))
  
  // Atomic rename
  renameSync(tempPath, statePath)
}

// Read pattern: validate on load
function readState(dir: string): State | null {
  const statePath = join(dir, ".idumb", "state.json")
  if (!existsSync(statePath)) return null
  
  const raw = readFileSync(statePath, "utf-8")
  const parsed = JSON.parse(raw)
  
  // Validate and return (throws on invalid)
  return StateSchema.parse(parsed)
}
```

### Non-Breaking Guarantee
- All file operations use synchronous APIs for reliability
- Failed validation returns null or throws, never corrupts
- Graceful degradation: plugin works without state file

---

## Architecture Decision 4: Tool Interface Design

### What
Two tools for Phase 1: `idumb_state_read` and `idumb_state_write`

### Why
- Minimal surface area for Trial 1
- Matches plan's tool-only approach
- Works with any OpenCode innate agent

### Tool Signatures

```typescript
// src/tools/state.ts
import { tool } from "@opencode-ai/plugin"

export const stateTools = {
  idumb_state_read: tool({
    description: "Read current iDumb governance state including anchors and compaction count",
    args: {},
    async execute(_args, context) {
      const state = readState(context.directory)
      if (!state) {
        return JSON.stringify({ 
          status: "uninitialized",
          message: "No state file found. State will be created on first write."
        })
      }
      return JSON.stringify(state, null, 2)
    }
  }),

  idumb_state_write: tool({
    description: "Update iDumb governance state (phase, validation count, etc.)",
    args: {
      phase: tool.schema.string().optional().describe("Current workflow phase"),
      increment_validation: tool.schema.boolean().optional().describe("Increment validation count")
    },
    async execute(args, context) {
      let state = readState(context.directory) ?? createDefaultState()
      
      if (args.phase) state.phase = args.phase
      if (args.increment_validation) {
        state.validation_count += 1
        state.last_validation = new Date().toISOString()
      }
      
      await writeState(context.directory, state)
      return JSON.stringify({ status: "updated", state })
    }
  })
}
```

### Non-Breaking Guarantee
- Tools only read/write to `.idumb/` directory
- No interference with OpenCode's innate behavior
- Optional arguments allow incremental updates

---

## Architecture Decision 5: Plugin Shell Design

### What
Minimal plugin entry point with compaction hook for Trial 1.

### Why
- Trial 1 focuses on compaction survival
- `experimental.session.compacting` is the critical hook
- Minimal shell validates integration before adding features

### Plugin Structure

```typescript
// src/plugin.ts
import type { Plugin } from "@opencode-ai/plugin"
import { stateTools } from "./tools/state"
import { readState, writeState, createDefaultState, log } from "./lib"

export const IdumbPlugin: Plugin = async (ctx) => {
  // Initialize state on first run
  const existingState = readState(ctx.directory)
  if (!existingState) {
    const initialState = createDefaultState()
    await writeState(ctx.directory, initialState)
    log(ctx.directory, "info", "Initialized iDumb state")
  }
  
  return {
    // Custom tools
    tool: stateTools,
    
    // Event subscription for session tracking
    event: async ({ event }) => {
      if (event.type === "session.created") {
        log(ctx.directory, "info", `Session created: ${event.properties?.info?.id}`)
      }
      if (event.type === "session.compacted") {
        // Track compaction count
        const state = readState(ctx.directory)
        if (state) {
          state.compaction_count += 1
          await writeState(ctx.directory, state)
          log(ctx.directory, "info", `Compaction #${state.compaction_count}`)
        }
      }
    },
    
    // CRITICAL: Compaction survival hook
    "experimental.session.compacting": async (input, output) => {
      const state = readState(ctx.directory)
      if (!state || state.anchors.length === 0) return
      
      // Format anchors for compaction context
      const anchorContext = formatAnchorsForCompaction(state.anchors)
      output.context.push(anchorContext)
      
      log(ctx.directory, "info", `Injected ${state.anchors.length} anchors into compaction`)
    }
  }
}

// Helper: Format anchors for LLM consumption
function formatAnchorsForCompaction(anchors: Anchor[]): string {
  const critical = anchors.filter(a => a.priority === "critical")
  const high = anchors.filter(a => a.priority === "high")
  const normal = anchors.filter(a => a.priority === "normal")
  
  let context = "## iDumb Governance Context (Preserved Anchors)\n\n"
  
  if (critical.length > 0) {
    context += "### CRITICAL (Must Preserve)\n"
    critical.forEach(a => {
      context += `- [${a.type}] ${a.content}\n`
    })
  }
  
  if (high.length > 0) {
    context += "\n### HIGH Priority\n"
    high.forEach(a => {
      context += `- [${a.type}] ${a.content}\n`
    })
  }
  
  if (normal.length > 0) {
    context += "\n### Normal Priority\n"
    normal.forEach(a => {
      context += `- [${a.type}] ${a.content}\n`
    })
  }
  
  return context
}

export default IdumbPlugin
```

---

## Integration Points

### Hook: `event` (session.created, session.compacted)
- **Purpose**: Track session lifecycle, increment compaction counter
- **Non-breaking guarantee**: Read-only observation, no modification of OpenCode behavior

### Hook: `experimental.session.compacting`
- **Purpose**: Inject anchor context into compaction prompt
- **Non-breaking guarantee**: Only appends to `output.context[]`, never replaces default behavior

### Hook: `tool` (custom tools)
- **Purpose**: Expose state read/write functionality to agents
- **Non-breaking guarantee**: Additive tools, no conflict with innate OpenCode tools

---

## Trial 1 Validation Criteria

| Criterion | Test Method | Pass Condition |
|-----------|-------------|----------------|
| State persists through compaction | Create anchor, force compaction, verify anchor exists | Anchor content unchanged |
| State file survives 5 compactions | Loop 5 compactions, verify state.compaction_count = 5 | Counter increments correctly |
| Anchors injected into compaction | Monitor output.context[] after hook | Anchor text present |
| Tools work with innate agents | Run idumb_state_read from default agent | Valid JSON returned |
| No console.log pollution | Run full test, check TUI | No background text |

---

## File Creation Order

1. `package.json` - Dependencies: `@opencode-ai/plugin`, `zod`
2. `tsconfig.json` - Strict mode, ES2022 target
3. `src/schemas/state.ts` - State and Anchor schemas
4. `src/schemas/config.ts` - Config schema
5. `src/schemas/index.ts` - Barrel export
6. `src/lib/persistence.ts` - Read/write utilities
7. `src/lib/logging.ts` - File-based logging
8. `src/lib/index.ts` - Barrel export
9. `src/tools/state.ts` - State tools
10. `src/plugin.ts` - Main plugin entry

---

## Ready for Implementation

This architecture is ready for `idumb-implementer` to execute. Key principles:

1. **Schema-first**: All data validated by Zod
2. **Atomic writes**: No corrupted state
3. **Tool-only exposure**: No markdown commands
4. **Hook mediation**: All integration through OpenCode hooks
5. **Minimal surface**: Only what's needed for Trial 1

**Next Step**: Run `idumb-implementer` to create the files in order.
