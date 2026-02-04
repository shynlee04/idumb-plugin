# Phases 3 & 4: Output Style Implementation - Research

**Researched:** 2026-02-04
**Domain:** User Interface + Agent-Level Style Support
**Confidence:** HIGH

## Summary

This research investigates Phases 3 & 4 of the Output Style Implementation: User Interface (command + tool) and Agent-Level Style Support. After analyzing existing patterns in `src/commands/idumb/`, `src/tools/`, and `src/agents/`, the standard patterns are clear and well-established.

**Primary findings:**
1. Commands use YAML frontmatter with specific fields (description, id, parent, agent) and structured sections (objective, context, process, completion_format)
2. Tools use `@opencode-ai/plugin` `tool()` wrapper with `tool.schema.*` for argument validation
3. Agent frontmatter has extensive YAML with id, parent, mode, scope, temperature, permission blocks, and tools lists
4. Resolution strategy: Agent-level overrides global (simple override, not cascade merge)

**Primary recommendation:** Follow existing patterns exactly. The style command should mirror `/idumb:config`, and the style tool should mirror `idumb-config.ts` patterns.

---

## Phase 3: User Interface Research

### Command Patterns (from `src/commands/idumb/`)

**Observed from `init.md` (684 lines) and `status.md` (398 lines):**

#### YAML Frontmatter Fields (REQUIRED)

| Field | Purpose | Example |
|-------|---------|---------|
| `description` | Brief command purpose | "Manage and switch output styles" |
| `id` | Unique identifier | `cmd-style` |
| `parent` | Hierarchy parent | `commands-idumb` |
| `agent` | Primary executing agent | `idumb-supreme-coordinator` or `idumb-high-governance` |

**Example frontmatter (from init.md):**
```yaml
---
description: "Initialize iDumb governance for this project with bounce-back validation loops."
id: cmd-init
parent: commands-idumb
agent: idumb-supreme-coordinator
---
```

#### Body Structure (GSD Pattern)

Commands use structured XML-like sections:

| Section | Purpose |
|---------|---------|
| `<objective>` | Single paragraph explaining what the command does |
| `<execution_context>` | Reference files to read, agents involved |
| `<context>` | Usage examples, flags, arguments |
| `<process>` | Numbered steps with YAML pseudo-code |
| `<completion_format>` | Expected output formats (success/failure) |
| `<error_handling>` | Error codes and resolutions |
| `<governance>` | Delegation chain, critical rules, permissions |
| `<metadata>` | Category, priority, complexity, version |

**Key insight:** Commands are rich documentation with embedded workflow logic, not just help text.

#### Command-Tool Interaction Pattern

Commands reference tools using this pattern (from status.md):
```yaml
Use tool: idumb-state

Read:
  - version
  - initialized
  - framework
```

Or inline:
```yaml
Use tool: idumb-validate_freshness

maxAgeHours: 48
```

**Command executes workflow logic, tool provides data access.** Commands are primary; tools are secondary.

---

### Tool Patterns (from `src/tools/`)

**Observed from `idumb-state.ts` (557 lines) and `idumb-config.ts` (1022 lines):**

#### Tool Definition Pattern

```typescript
import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// Interface definitions
interface MyToolState { ... }

// Helper functions (private)
function getPath(directory: string): string { ... }
function readData(directory: string): MyToolState { ... }
function writeData(directory: string, state: MyToolState): void { ... }

// Tool exports (public)
export const read = tool({
  description: "Description of what this action does",
  args: {
    // Optional args with tool.schema.*
    section: tool.schema.string().optional().describe("Description"),
  },
  async execute(args, context) {
    // context.directory is available
    // context.agent is available
    const result = readData(context.directory)
    return JSON.stringify(result, null, 2)
  },
})

// Named exports for sub-actions
export const write = tool({ ... })
export const list = tool({ ... })

// Default export for primary action
export default read
```

#### Schema Definition Pattern

```typescript
args: {
  // String with enum validation
  action: tool.schema.enum(["list", "set", "info", "reset"]),
  
  // Optional string
  style: tool.schema.string().optional(),
  
  // Boolean
  verbose: tool.schema.boolean().optional().describe("Include details"),
  
  // Number
  limit: tool.schema.number().optional().describe("Max items"),
}
```

#### Context Access

Tools access directory via `context.directory`:
```typescript
const statePath = join(context.directory, ".idumb", "idumb-brain", "state.json")
```

**CRITICAL:** No console.log - causes TUI pollution. Use file logging instead.

#### File Organization

Tools export multiple named functions for sub-actions:
```typescript
// idumb-state.ts exports:
export const read = tool({...})      // idumb-state_read
export const write = tool({...})     // idumb-state_write
export const anchor = tool({...})    // idumb-state_anchor
export const history = tool({...})   // idumb-state_history
export const getAnchors = tool({...})// idumb-state_getAnchors
export default read                  // idumb-state
```

---

### Style Command Recommendation

**File:** `src/commands/idumb/style.md`
**Agent:** `idumb-supreme-coordinator` (like other utility commands)
**Pattern:** Mirror `status.md` structure (read-heavy, simple actions)

```yaml
---
description: "Manage and switch output styles for AI responses"
id: cmd-style
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:style

<objective>
Manage output styles that customize how AI agents format their responses.
List available styles, set active style, view style details, or reset to default.
</objective>

<context>

## Usage

/idumb:style                     # List all styles + show current
/idumb:style <name>              # Set active style
/idumb:style --info <name>       # Show style details
/idumb:style --reset             # Reset to default

## Available Styles

| Style | Description |
|-------|-------------|
| `default` | Standard iDumb behavior (no extra instructions) |
| `governance` | Enhanced governance reporting with evidence tables |
| `verbose` | Detailed explanations and reasoning |
| `terse` | Minimal output, action-focused |
| `learning` | Educational mode with insights |

</context>
```

**Edge case - invalid style name:**
```yaml
if_style_not_found:
  report:
    error: "Style '{name}' not found"
    available: [list of valid styles]
    suggestion: "Run /idumb:style to see available styles"
```

---

### Style Tool Recommendation

**File:** `src/tools/idumb-style.ts`
**Pattern:** Mirror `idumb-config.ts` structure

```typescript
import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"

interface StyleConfig {
  name: string
  description: string
  keepCodingInstructions: boolean
  mode: 'global' | 'agent'
  compatibility: string[]
}

interface StyleContent extends StyleConfig {
  instructions: string
}

function getStylesDir(directory: string): string {
  return join(directory, ".idumb", "idumb-brain", "styles")
}

function parseStyleFile(filePath: string): StyleContent | null { ... }
function listStyles(directory: string): string[] { ... }
function getActiveStyle(directory: string): string { ... }
function setActiveStyle(directory: string, styleName: string): boolean { ... }

// List available styles
export const list = tool({
  description: "List all available output styles",
  args: {},
  async execute(args, context) { ... },
})

// Set active style
export const set = tool({
  description: "Set the active output style",
  args: {
    style: tool.schema.string().describe("Style name to activate"),
  },
  async execute(args, context) { ... },
})

// Get style info
export const info = tool({
  description: "Get details about a specific style",
  args: {
    style: tool.schema.string().describe("Style name"),
  },
  async execute(args, context) { ... },
})

// Reset to default
export const reset = tool({
  description: "Reset to default style",
  args: {},
  async execute(args, context) { ... },
})

// Default: list with current highlighted
export default list
```

**Edge case - concurrent style changes:**
Session trackers already exist in `idumb-core.ts` (line 112-118). Style changes should:
1. Update `state.json` (persistent)
2. Clear session tracker cache (force re-read on next message)

This is already addressed in the consolidated plan (Task 2.5 - cache invalidation).

---

## Phase 4: Agent-Level Style Support Research

### Agent YAML Frontmatter (Current Fields)

**Observed from 6 agent files:**

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `description` | string | YES | Brief agent purpose |
| `id` | string | YES | Unique identifier (agent-idumb-{name}) |
| `parent` | string | YES | Hierarchy parent (null for supreme) |
| `mode` | enum | YES | `primary`, `all`, `hidden` |
| `scope` | enum | YES | `bridge`, `meta`, `project`, `dev` |
| `temperature` | number | NO | LLM temperature (0.1-0.3 typical) |
| `permission` | object | YES | Detailed permission blocks |
| `tools` | object | YES | Tool access map |

**Example permission block (from supreme-coordinator.md):**
```yaml
permission:
  task:
    "idumb-high-governance": allow
    "idumb-mid-coordinator": allow
    # ... more agents
  bash:
    "git status": allow
    "git diff*": allow
  edit: deny
  write: deny
```

**Example tools block:**
```yaml
tools:
  task: true
  todoread: true
  todowrite: true
  read: true
  glob: true
  grep: true
  idumb-state: true
  idumb-state_read: true
  # ...
```

### Current Agent Categories

| Agent | Scope | Output Style Needs |
|-------|-------|--------------------|
| `idumb-supreme-coordinator` | bridge | governance-report (comprehensive, evidence tables) |
| `idumb-builder` | dev | implementation-summary (file lists, diffs) |
| `idumb-research-synthesizer` | project | research-synthesis (findings, conflicts, recommendations) |
| `idumb-debugger` | project | debug-analysis (hypothesis, evidence, isolation) |
| `idumb-planner` | bridge | plan-specification (tasks, dependencies, criteria) |
| `idumb-verifier` | project | verification-report (levels, gaps, diagnosis) |

**All 22 agents listed in `src/agents/`:**
1. idumb-builder.md
2. idumb-codebase-mapper.md
3. idumb-debugger.md
4. idumb-high-governance.md
5. idumb-integration-checker.md
6. idumb-low-validator.md
7. idumb-meta-builder.md
8. idumb-meta-validator.md
9. idumb-mid-coordinator.md
10. idumb-phase-researcher.md
11. idumb-plan-checker.md
12. idumb-planner.md
13. idumb-project-coordinator.md
14. idumb-project-executor.md
15. idumb-project-explorer.md
16. idumb-project-researcher.md
17. idumb-project-validator.md
18. idumb-research-synthesizer.md
19. idumb-roadmapper.md
20. idumb-skeptic-validator.md
21. idumb-supreme-coordinator.md
22. idumb-verifier.md

### Proposed `output-style:` Schema Extension

Add to agent YAML frontmatter:

```yaml
output-style:
  format: governance-report      # Style template name
  sections:                      # Required output sections
    - status-header
    - evidence-table
    - sub-delegations
    - state-changes
    - recommendations
  tone: confident-factual        # Output tone
  length: comprehensive          # concise | moderate | comprehensive
```

**Where is frontmatter parsed?**

Agent frontmatter is NOT parsed by iDumb code currently. OpenCode's agent loading system handles this. The `output-style:` section would be:
1. Injected into system prompt via `experimental.chat.system.transform` hook
2. Read by the plugin at message transform time
3. Used to augment global style with agent-specific overrides

**Implementation approach:**
- Add parsing logic to `idumb-core.ts` (similar to how governance prefix is built)
- Read agent file, parse YAML frontmatter, extract `output-style:` section
- Merge with global style before injection

### 6 Key Agents for Style Overrides

| Priority | Agent | Style Format | Rationale |
|----------|-------|--------------|-----------|
| 1 | idumb-supreme-coordinator | governance-report | Top-level, user-facing |
| 2 | idumb-builder | implementation-summary | File operations need clean evidence |
| 3 | idumb-verifier | verification-report | Detailed multi-level output |
| 4 | idumb-planner | plan-specification | Must be executable prompts |
| 5 | idumb-debugger | debug-analysis | Scientific method structure |
| 6 | idumb-research-synthesizer | research-synthesis | Integration of multiple sources |

### Style Resolution Order

**Proposed resolution (override, not cascade):**

```
1. Check agent's output-style: in YAML frontmatter
   - If present: USE THIS (agent wins)
   - If absent: fall through

2. Check global activeStyle in state.json
   - If not "default": USE THIS (global style)
   - If "default": no extra instructions

3. Default: No style injection
```

**Why override, not cascade?**
- Simpler mental model
- Agent roles are distinct (a debugger shouldn't get "governance" style)
- Avoids complex merge semantics

**Conflict handling:**
- Agent-level ALWAYS wins over global
- If agent specifies `output-style:`, global style is ignored for that agent
- If agent has NO `output-style:`, global applies

---

## Edge Cases & Risks

### Edge Case 1: Invalid Style Name

**Risk:** User runs `/idumb:style nonexistent`
**Mitigation:**
```typescript
const styles = listStyles(directory)
if (!styles.includes(styleName)) {
  return JSON.stringify({
    error: `Style '${styleName}' not found`,
    available: styles,
    suggestion: "Run /idumb:style to see available styles"
  })
}
```

### Edge Case 2: Concurrent Style Changes

**Risk:** Two sessions change style simultaneously
**Mitigation:**
- Style stored in `state.json` (file-level atomic writes)
- Session trackers cache style per-session
- Cache cleared on style change (Task 2.5)
- Last write wins (acceptable for single-user scenario)

### Edge Case 3: Style File Corruption

**Risk:** Style `.md` file has invalid YAML frontmatter
**Mitigation:**
```typescript
function parseStyleFile(path: string): StyleContent | null {
  try {
    const content = readFileSync(path, 'utf8')
    // Parse YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return null
    // Parse and validate
    ...
  } catch {
    log(directory, `[STYLE ERROR] Failed to parse ${path}`)
    return null  // Graceful degradation
  }
}
```

### Edge Case 4: Global vs Agent-Level Conflict

**Risk:** Global style is "terse", agent style is "verbose"
**Mitigation:** Agent wins, no merge. Simple override semantics.

### Edge Case 5: Agent File Without output-style

**Risk:** Most agents won't have output-style initially
**Mitigation:** Fall through to global style. Only agents with explicit `output-style:` override.

### Edge Case 6: Style Changes Mid-Conversation

**Risk:** User changes style; previous context has old style
**Mitigation:**
- Idempotency marker: `[IDUMB_STYLE:styleName]`
- Each message gets fresh style injection
- Old messages retain their style (acceptable)

---

## Corrections to Consolidated Plan

### Correction 1: Agent Frontmatter Parsing Location

**Plan says:** `src/lib/governance.ts` or wherever agent parsing happens
**Reality:** No `src/lib/` directory exists. Agent parsing is done inline in `idumb-core.ts`.

**Fix:** Add parsing logic directly to `idumb-core.ts` in the `experimental.chat.system.transform` hook.

### Correction 2: Tool Export Pattern

**Plan shows:**
```typescript
export const idumbStyleTool = tool({...})
```

**Correct pattern (from existing tools):**
```typescript
// Named exports for sub-actions
export const list = tool({...})
export const set = tool({...})

// Default export for primary action
export default list
```

### Correction 3: Command Mode Field

**Plan shows:** `mode: all`
**Existing commands have:** No `mode` field in frontmatter

The `mode` field is for agents, not commands. Commands use `agent:` to specify which agent handles them.

### Correction 4: Session Tracker Extension

**Plan says:** Line 112-118 has sessionTrackers Map
**Reality:** Confirmed at line 112-118:
```typescript
const sessionTrackers = new Map<string, {
  sessionId: string
  startTime: Date
  violationCount: number
  lastActivity: Date
  governanceInjected: boolean
}>()
```

Adding `activeStyle?: string` and `styleCache?: StyleContent` is correct.

---

## Implementation Checklist

### Phase 3 Tasks

- [ ] **3.1** Create `src/commands/idumb/style.md`
  - Follow `status.md` pattern
  - Include usage, flags, available styles
  - Add error handling section

- [ ] **3.2** Create `src/tools/idumb-style.ts`
  - Follow `idumb-config.ts` pattern
  - Export: list, set, info, reset, default
  - Use `tool.schema.*` for validation

### Phase 4 Tasks

- [ ] **4.1** Extend agent YAML schema
  - Add `output-style:` section definition
  - Document format, sections, tone, length fields

- [ ] **4.2** Update 6 key agents with output-style
  - supreme-coordinator: governance-report
  - builder: implementation-summary
  - verifier: verification-report
  - planner: plan-specification
  - debugger: debug-analysis
  - research-synthesizer: research-synthesis

- [ ] **4.3** Implement style resolution in idumb-core.ts
  - Parse agent frontmatter
  - Resolve agent vs global
  - Inject into system.transform hook

---

## Sources

### Primary (HIGH confidence)
- `src/commands/idumb/init.md` - Command pattern reference
- `src/commands/idumb/status.md` - Command pattern reference
- `src/tools/idumb-state.ts` - Tool pattern reference
- `src/tools/idumb-config.ts` - Tool pattern reference
- `src/agents/idumb-supreme-coordinator.md` - Agent frontmatter reference
- `src/agents/idumb-builder.md` - Agent frontmatter reference
- `src/plugins/idumb-core.ts` - Plugin hook patterns

### Secondary (MEDIUM confidence)
- `.plugin-dev/implementation-short-plan/consolidated-plan.md` - Implementation plan
- AGENTS.md - Project documentation

---

## Ready for Planning

Research complete. Phase 3 & 4 patterns are well-established and can proceed to implementation.
