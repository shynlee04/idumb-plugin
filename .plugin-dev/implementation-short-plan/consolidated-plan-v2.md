# Consolidated Implementation Plan V2: Output Style Functionality for iDumb

**Project:** iDumb Framework  
**Date:** 2026-02-04  
**Version:** 2.0 (Research-Corrected)  
**Status:** Ready for Implementation  
**Based on:** Original Plan + 4-Agent Research Synthesis

---

## Executive Summary

This corrected plan incorporates findings from comprehensive research by 4 specialized agents. Key changes from v1:

| Change | Reason |
|--------|--------|
| **Added Phase 0** | Memory leak and race condition fixes required first |
| **Corrected all paths** | `src/lib/` → `src/plugins/lib/` |
| **Fixed hook usage** | `command.executed` event, not `command.execute.after` |
| **Added token budgets** | Compaction context limits |
| **Simplified anchors** | JSON string serialization for compatibility |

### Core Architecture (Validated)

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **Global Styles** | `.idumb/brain/styles/*.md` files | ✅ Validated |
| **Agent Overrides** | `output-style:` in agent YAML frontmatter | ✅ Validated |
| **Runtime Injection** | `experimental.chat.system.transform` hook | ✅ Hook exists |
| **Session Anchoring** | Anchor types with JSON-serialized content | ⚠️ Corrected |
| **User Interface** | `/idumb:style` command + `idumb-style` tool | ✅ Validated |
| **Cache Invalidation** | `command.executed` event handler | ⚠️ Corrected |

---

## Phase 0: Memory Management Prerequisites (BLOCKING)

**Time Estimate:** ~2 hours  
**Priority:** CRITICAL - Must complete before other phases

### Why Phase 0 Exists

Research discovered critical issues in the existing codebase:
1. **Memory Leak:** `sessionTrackers` Map never cleans up old sessions
2. **Race Condition:** `state.json` has no file locking for concurrent access
3. **These issues will be AMPLIFIED** by adding `styleCache` to trackers

---

### Task 0.1: Implement Session Tracker Cleanup

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** After line 118 (after sessionTrackers Map definition)  
**Lines:** +35

```typescript
// ========================================================================
// SESSION CLEANUP (Phase 0 - Memory Management)
// ========================================================================

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_SESSIONS = 100

function cleanupStaleSessions(directory: string): void {
  const now = Date.now()
  const toDelete: string[] = []
  
  sessionTrackers.forEach((tracker, sessionId) => {
    const lastActivity = tracker.lastActivity?.getTime() || 0
    if (now - lastActivity > SESSION_TTL_MS) {
      toDelete.push(sessionId)
    }
  })
  
  // LRU eviction if over max
  if (sessionTrackers.size > MAX_SESSIONS) {
    const sorted = [...sessionTrackers.entries()]
      .sort((a, b) => {
        const aTime = a[1].lastActivity?.getTime() || 0
        const bTime = b[1].lastActivity?.getTime() || 0
        return aTime - bTime
      })
    while (sorted.length > MAX_SESSIONS) {
      const [id] = sorted.shift()!
      if (!toDelete.includes(id)) {
        toDelete.push(id)
      }
    }
  }
  
  if (toDelete.length > 0) {
    toDelete.forEach(id => sessionTrackers.delete(id))
    log(directory, `[CLEANUP] Removed ${toDelete.length} stale sessions`)
  }
}
```

**Integration Point:** Call `cleanupStaleSessions(directory)` in:
- `session.idle` event handler (line 202)
- `session.created` event handler (line 131)

---

### Task 0.2: Add State.json Atomic Writes

**File:** `src/plugins/lib/state.ts` (MODIFY)  
**Location:** Replace `writeState` function  
**Lines:** +10 (net change)

```typescript
import { renameSync } from "fs"

export function writeState(directory: string, state: IdumbState): void {
  const statePath = getStatePath(directory)
  const tempPath = statePath + ".tmp." + Date.now()
  
  try {
    // Write to temp file first
    writeFileSync(tempPath, JSON.stringify(state, null, 2))
    // Atomic rename (safe on POSIX, mostly safe on Windows)
    renameSync(tempPath, statePath)
  } catch (error) {
    // Clean up temp file on failure
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
      }
    } catch {}
    throw error
  }
}
```

**Required Import:** Add `unlinkSync` to fs imports.

---

### Task 0.3: Add Compaction Token Budget

**File:** `src/plugins/lib/governance-builder.ts` (MODIFY)  
**Location:** In `buildCompactionContext` function  
**Lines:** +15

```typescript
const MAX_COMPACTION_CONTEXT_CHARS = 3000 // Conservative limit

export function buildCompactionContext(
  directory: string, 
  config: InlineIdumbConfig,
  existingContextSize: number = 0  // NEW parameter
): string {
  const remaining = MAX_COMPACTION_CONTEXT_CHARS - existingContextSize
  
  if (remaining < 200) {
    log(directory, "[COMPACTION] Budget exceeded, returning minimal context")
    return `[iDumb: Phase ${readState(directory)?.phase || 'unknown'}]`
  }
  
  // ... existing logic, but truncate if over budget
  const context = lines.join("\n")
  if (context.length > remaining) {
    return context.substring(0, remaining - 50) + "\n[...truncated]"
  }
  return context
}
```

---

## Phase 1: Core Infrastructure (~4 hours)

### Task 1.1: Create Style Library Module

**File:** `src/plugins/lib/styles.ts` (NEW)  
**Lines:** ~130

```typescript
/**
 * Style Management Library
 * 
 * Handles loading, parsing, and caching of output style files.
 * CRITICAL: NO console.log - causes TUI background text exposure
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, basename } from "path"
import { log } from "./logging"

// ========================================================================
// TYPES
// ========================================================================

export interface StyleConfig {
  name: string
  description: string
  keepCodingInstructions: boolean
  mode: 'global' | 'agent'
  compatibility: string[]
}

export interface StyleContent extends StyleConfig {
  instructions: string
  raw: string
}

// ========================================================================
// PATHS
// ========================================================================

export function getStylesDir(directory: string): string {
  return join(directory, ".idumb", "idumb-brain", "styles")
}

export function ensureStylesDir(directory: string): string {
  const stylesDir = getStylesDir(directory)
  if (!existsSync(stylesDir)) {
    mkdirSync(stylesDir, { recursive: true })
    log(directory, `[STYLE] Created styles directory: ${stylesDir}`)
  }
  return stylesDir
}

// ========================================================================
// PARSING
// ========================================================================

export function parseStyleFile(stylePath: string): StyleContent | null {
  try {
    if (!existsSync(stylePath)) {
      return null
    }
    
    const raw = readFileSync(stylePath, "utf-8")
    if (!raw.trim()) {
      return null
    }
    
    // Extract YAML frontmatter
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
    if (!match) {
      // No frontmatter, treat entire content as instructions
      return {
        name: basename(stylePath, ".md"),
        description: "",
        keepCodingInstructions: true,
        mode: "global",
        compatibility: ["idumb"],
        instructions: raw.trim(),
        raw
      }
    }
    
    const [, frontmatter, content] = match
    const config = parseYamlFrontmatter(frontmatter)
    
    return {
      name: config.name || basename(stylePath, ".md"),
      description: config.description || "",
      keepCodingInstructions: config["keep-coding-instructions"] !== false,
      mode: config.mode || "global",
      compatibility: config.compatibility || ["idumb"],
      instructions: content.trim(),
      raw
    }
  } catch (error) {
    return null
  }
}

function parseYamlFrontmatter(yaml: string): Record<string, any> {
  const result: Record<string, any> = {}
  const lines = yaml.split("\n")
  
  for (const line of lines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue
    
    const key = line.substring(0, colonIndex).trim()
    let value: any = line.substring(colonIndex + 1).trim()
    
    // Handle arrays: [item1, item2]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s: string) => s.trim())
    }
    // Handle booleans
    else if (value === "true") value = true
    else if (value === "false") value = false
    
    result[key] = value
  }
  
  return result
}

// ========================================================================
// STYLE OPERATIONS
// ========================================================================

export function listAvailableStyles(directory: string): string[] {
  const stylesDir = getStylesDir(directory)
  if (!existsSync(stylesDir)) {
    return ["default"]
  }
  
  try {
    const files = readdirSync(stylesDir)
    return files
      .filter(f => f.endsWith(".md"))
      .map(f => f.replace(".md", ""))
  } catch {
    return ["default"]
  }
}

export function loadStyle(directory: string, styleName: string): StyleContent | null {
  if (styleName === "default") {
    return {
      name: "default",
      description: "Standard iDumb behavior",
      keepCodingInstructions: true,
      mode: "global",
      compatibility: ["idumb"],
      instructions: "",
      raw: ""
    }
  }
  
  const stylePath = join(getStylesDir(directory), `${styleName}.md`)
  return parseStyleFile(stylePath)
}

export function loadActiveStyle(directory: string, state: any): StyleContent | null {
  const styleName = state?.activeStyle || "default"
  return loadStyle(directory, styleName)
}
```

---

### Task 1.2: Create Default Style Files

**Location:** `.idumb/brain/styles/` (NEW directory)  
**Files:** 5 markdown files

#### default.md (~10 lines)
```markdown
---
name: default
description: Standard iDumb behavior with no additional instructions
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

# Default Style

No additional style instructions. Use standard iDumb governance patterns.
```

#### governance.md (~60 lines)
```markdown
---
name: governance
description: Enhanced governance reporting with evidence tables
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

# Governance Style

You are operating in **Governance Mode**. Follow these enhanced guidelines:

## Output Format

Structure all responses as governance reports with:

1. **Status Header**
   - Clear status: COMPLETE | PARTIAL | FAILED | BLOCKED
   - Timestamp in ISO 8601 format
   - Primary agent/delegation target

2. **Evidence Table**
   | Item | Proof |
   |------|-------|
   | Files changed | [list paths] |
   | State updates | [describe changes] |
   | Validation | [pass/fail with details] |

3. **Sub-Delegations** (if applicable)
   | Agent | Task | Result | Evidence |
   |-------|------|--------|----------|

4. **State Changes**
   - Phase transitions
   - TODOs created/updated/completed
   - Anchors added

5. **Recommendations**
   - Next actions (numbered)
   - Blockers requiring resolution

## Behavioral Guidelines

- Always check state before actions
- Verify permissions before file operations
- Track all delegations in hierarchy format
- Provide evidence for every claim
```

#### verbose.md (~50 lines)
```markdown
---
name: verbose
description: Detailed explanations and reasoning for learning
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

# Verbose Style

Provide comprehensive explanations with full reasoning chains.

## Output Guidelines

1. **Explain the "Why"**
   - Before each action, explain why it's necessary
   - Connect actions to the overall goal
   - Reference relevant documentation or patterns

2. **Show Your Work**
   - Include intermediate steps
   - Display command outputs (summarized if long)
   - Explain error messages and resolutions

3. **Teach as You Go**
   - Define technical terms on first use
   - Provide context for decisions
   - Suggest learning resources when relevant

4. **Structure for Clarity**
   - Use headers liberally
   - Include code blocks with syntax highlighting
   - Add inline comments in code samples
```

#### terse.md (~30 lines)
```markdown
---
name: terse
description: Minimal output, action-focused responses
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

# Terse Style

Minimal output. Actions over explanations.

## Rules

- Max 3 sentences per response unless code
- No preamble or pleasantries
- Use bullet points, not paragraphs
- Code without explanation unless asked
- Status in one line: `✅ Done: [action]` or `❌ Failed: [reason]`
```

#### learning.md (~50 lines)
```markdown
---
name: learning
description: Educational mode with insights and explanations
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

# Learning Style

Optimize for user understanding and skill development.

## Output Guidelines

1. **Concept Introduction**
   - Introduce concepts before using them
   - Provide brief background on patterns/tools
   - Link to documentation when helpful

2. **Decision Transparency**
   - Explain why this approach vs alternatives
   - Highlight trade-offs made
   - Note edge cases and gotchas

3. **Interactive Elements**
   - Ask clarifying questions
   - Offer choices when multiple paths exist
   - Confirm understanding at key points

4. **Summary Sections**
   - End with "Key Takeaways" for complex tasks
   - Highlight transferable skills
   - Suggest related topics to explore
```

---

### Task 1.3: Extend State Schema

**File:** `src/plugins/lib/state.ts` (MODIFY)  
**Location:** In `getDefaultState()` function  
**Lines:** +5

```typescript
export function getDefaultState(): IdumbState {
  return {
    version: "0.3.1",  // Bump version
    initialized: new Date().toISOString(),
    framework: "idumb",
    phase: "init",
    session: { current: null, count: 0 },
    governance: { level: "strict", autoExpert: "default", research: "comprehensive" },
    lastValidation: null,
    validationCount: 0,
    anchors: [],
    history: [],
    // NEW: Output style tracking
    activeStyle: "default",
    styleHistory: []
  }
}
```

**Also update `IdumbState` interface in `types.ts`:**
```typescript
export interface IdumbState {
  // ... existing fields
  activeStyle?: string
  styleHistory?: Array<{
    style: string
    activatedAt: string
    by: string
  }>
}
```

---

### Task 1.4: Update Barrel Export

**File:** `src/plugins/lib/index.ts` (MODIFY)  
**Lines:** +10

```typescript
// Add to exports
export {
  getStylesDir,
  ensureStylesDir,
  parseStyleFile,
  listAvailableStyles,
  loadStyle,
  loadActiveStyle,
  type StyleConfig,
  type StyleContent
} from "./styles"
```

---

## Phase 2: Plugin Hook Implementation (~6 hours)

### Task 2.1: Add `experimental.chat.system.transform` Hook

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** After line 332 (after `experimental.session.compacting`)  
**Lines:** +50

```typescript
// ========================================================================
// SYSTEM PROMPT TRANSFORMATION (Output Style Injection)
// ========================================================================

"experimental.chat.system.transform": async (
  input: { sessionID?: string; model?: any },
  output: { system: string[] }
) => {
  try {
    const sessionId = input.sessionID || 'unknown'
    log(directory, `[STYLE] System transform for session ${sessionId}`)

    // Get session-specific style (from tracker or state)
    const tracker = sessionTrackers.get(sessionId)
    let activeStyle = tracker?.activeStyle
    
    if (!activeStyle) {
      // Fall back to state.json
      const state = readState(directory)
      activeStyle = state?.activeStyle || 'default'
      
      // Cache in tracker for future messages
      if (tracker) {
        tracker.activeStyle = activeStyle
      }
    }

    // Skip injection for default style (no extra instructions)
    if (activeStyle === 'default') {
      log(directory, `[STYLE] Default style, skipping injection`)
      return
    }

    // Idempotency check - use unique marker
    const STYLE_MARKER = `<!-- IDUMB:STYLE:${activeStyle} -->`
    if (output.system.some((s: string) => s.includes('<!-- IDUMB:STYLE:'))) {
      log(directory, `[STYLE] Already injected, skipping`)
      return
    }

    // Load from cache or parse file
    let styleContent = tracker?.styleCache
    if (!styleContent) {
      styleContent = loadStyle(directory, activeStyle)
      
      if (styleContent && tracker) {
        tracker.styleCache = styleContent
      }
    }

    // Inject with marker
    if (styleContent?.instructions) {
      const injection = `${STYLE_MARKER}\n\n## Output Style: ${activeStyle}\n\n${styleContent.instructions}`
      output.system.push(injection)
      log(directory, `[STYLE] Injected '${activeStyle}' (${styleContent.instructions.length} chars)`)
    }
  } catch (error) {
    log(directory, `[ERROR] system.transform failed: ${error instanceof Error ? error.message : String(error)}`)
    // Graceful degradation - continue without style
  }
},
```

---

### Task 2.2: Extend Session Tracker Interface

**File:** `src/plugins/lib/types.ts` (MODIFY)  
**Location:** SessionTracker interface  
**Lines:** +4

```typescript
export interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  violationCount: number
  governanceInjected: boolean
  lastActivity?: Date           // For cleanup TTL
  // NEW: Output style support
  activeStyle?: string
  styleCache?: StyleContent
}
```

**File:** `src/plugins/lib/session-tracker.ts` (MODIFY)  
**Location:** `getSessionTracker` function  
**Lines:** +2

```typescript
export function getSessionTracker(sessionId: string): SessionTracker {
  if (!sessionTrackers.has(sessionId)) {
    sessionTrackers.set(sessionId, {
      firstToolUsed: false,
      firstToolName: null,
      agentRole: null,
      violationCount: 0,
      governanceInjected: false,
      lastActivity: new Date(),     // NEW
      activeStyle: undefined,       // NEW
      styleCache: undefined         // NEW
    })
  }
  
  // Update last activity on access
  const tracker = sessionTrackers.get(sessionId)!
  tracker.lastActivity = new Date()
  
  return tracker
}
```

---

### Task 2.3: Initialize Style in Session Created Event

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** Line 149 (after `getStallDetectionState` call)  
**Lines:** +12

```typescript
// Initialize output style for this session
const state = readState(directory)
const activeStyle = state?.activeStyle || 'default'
const tracker = sessionTrackers.get(sessionId)
if (tracker) {
  tracker.activeStyle = activeStyle
  log(directory, `[STYLE] Session ${sessionId} initialized with style: ${activeStyle}`)
}

// Run cleanup on new session creation
cleanupStaleSessions(directory)
```

---

### Task 2.4: Add Style to Compaction Hook

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** Line 325 (in `experimental.session.compacting`, after `output.context.push(context)`)  
**Lines:** +12

```typescript
// Preserve active style across compaction (minimal format)
const state = readState(directory)
if (state?.activeStyle && state.activeStyle !== 'default') {
  // Check budget before adding
  const currentSize = output.context.join('').length
  const styleNote = `\n[Active Style: ${state.activeStyle}]`
  
  if (currentSize + styleNote.length < MAX_COMPACTION_CONTEXT_CHARS) {
    output.context.push(styleNote)
    log(directory, `[STYLE] Preserved '${state.activeStyle}' in compaction context`)
  } else {
    log(directory, `[STYLE] Skipped style in compaction - budget exceeded`)
  }
}
```

---

### Task 2.5: Add Cache Invalidation via Event

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** In `event` handler, after `command.executed` check (line 261-269)  
**Lines:** +15

```typescript
// Existing command.executed handler
if (event.type === "command.executed") {
  const command = event.properties?.command || ""
  log(directory, `[CMD] Command executed: ${command}`)

  // Track iDumb commands
  if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
    addHistoryEntry(directory, `idumb_command:${command}`, "plugin", "pass")
  }
  
  // NEW: Clear style cache when style command executed
  if (command === "idumb:style" || command.startsWith("idumb:style ")) {
    log(directory, `[STYLE] Style command detected, clearing all caches`)
    for (const [sessionId, tracker] of sessionTrackers) {
      tracker.styleCache = undefined
      // Don't clear activeStyle - let it reload from state on next message
    }
  }
}
```

---

## Phase 3: User Interface (~3 hours)

### Task 3.1: Create Style Command

**File:** `src/commands/idumb/style.md` (NEW)  
**Lines:** ~100

```markdown
---
description: Manage and switch output styles for iDumb agents
id: idumb:style
parent: idumb
---

<objective>
Manage output styles that control how iDumb agents format their responses.
</objective>

<execution_context>
- Agent: @idumb-high-governance (read/write state access)
- Trigger: User runs `/idumb:style [action] [args]`
- Scope: Session-wide style changes, persisted to state.json
</execution_context>

<context>
Output styles modify how agents structure and format their responses without changing their core behavior. Styles are defined as markdown files in `.idumb/brain/styles/`.

Available actions:
- (no args): List all styles, highlight current
- `<name>`: Switch to specified style
- `--info <name>`: Show style details
- `--reset`: Return to default style
</context>

<process>

## Step 1: Parse Arguments

Extract action from user input:
- No arguments → LIST action
- Style name → SET action
- `--info <name>` → INFO action
- `--reset` → RESET action

## Step 2: Execute Action

### LIST Action
1. Read `.idumb/brain/styles/` directory
2. Parse each `.md` file's frontmatter for name/description
3. Read current style from `state.json.activeStyle`
4. Display formatted list with current highlighted

Output format:
```
## Available Styles

→ **governance** (current)
  Enhanced governance reporting with evidence tables

  **verbose**
  Detailed explanations and reasoning

  **terse**
  Minimal output, action-focused

  **learning**
  Educational mode with insights

  **default**
  Standard iDumb behavior
```

### SET Action
1. Validate style exists in styles directory
2. If not found, show error with available styles
3. Update `state.json`:
   - Set `activeStyle` to new style name
   - Append to `styleHistory` (limit 50 entries)
4. Confirm change

Output: `✅ Style changed to: **{name}**`

### INFO Action
1. Load style file from styles directory
2. Parse frontmatter and content
3. Display full details

Output format:
```
## Style: {name}

**Description:** {description}
**Mode:** {mode}
**Keep Coding Instructions:** {yes/no}

### Instructions Preview
{first 500 chars of instructions}...
```

### RESET Action
1. Set `state.json.activeStyle` to "default"
2. Clear styleHistory (optional)
3. Confirm reset

Output: `✅ Style reset to **default**`

</process>

<completion_format>

## Success Response
- Clear confirmation of action taken
- Current active style shown
- No further action needed

## Error Response
- Specific error message
- Suggestion for resolution
- List available styles if style not found

</completion_format>
```

---

### Task 3.2: Create Style Tool

**File:** `src/tools/idumb-style.ts` (NEW)  
**Lines:** ~120

```typescript
/**
 * iDumb Style Management Tool
 * 
 * Provides programmatic access to output style operations.
 * Used by /idumb:style command and direct agent invocation.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { join } from "path"
import { 
  getStylesDir, 
  listAvailableStyles, 
  loadStyle,
  parseStyleFile 
} from "./lib/styles"
import { readState, writeState } from "./lib/state"
import { log } from "./lib/logging"

// ========================================================================
// LIST - Show available styles
// ========================================================================

export const list = tool({
  name: "idumb-style_list",
  description: "List all available output styles with current selection",
  parameters: z.object({}),
  
  async execute(args, context) {
    const { directory } = context
    const styles = listAvailableStyles(directory)
    const state = readState(directory)
    const current = state?.activeStyle || "default"
    
    const output = styles.map(name => {
      const style = loadStyle(directory, name)
      const marker = name === current ? "→ " : "  "
      const currentTag = name === current ? " (current)" : ""
      return `${marker}**${name}**${currentTag}\n    ${style?.description || "No description"}`
    }).join("\n\n")
    
    return `## Available Styles\n\n${output}`
  }
})

// ========================================================================
// SET - Change active style
// ========================================================================

export const set = tool({
  name: "idumb-style_set",
  description: "Set the active output style",
  parameters: z.object({
    style: z.string().describe("Name of the style to activate")
  }),
  
  async execute(args, context) {
    const { directory } = context
    const { style: styleName } = args
    
    // Validate style exists
    const available = listAvailableStyles(directory)
    if (!available.includes(styleName) && styleName !== "default") {
      return `❌ Style not found: **${styleName}**\n\nAvailable styles: ${available.join(", ")}`
    }
    
    // Update state
    const state = readState(directory) || {}
    const previousStyle = state.activeStyle || "default"
    
    state.activeStyle = styleName
    state.styleHistory = state.styleHistory || []
    state.styleHistory.push({
      style: styleName,
      activatedAt: new Date().toISOString(),
      by: "idumb-style_set"
    })
    
    // Limit history to 50 entries
    if (state.styleHistory.length > 50) {
      state.styleHistory = state.styleHistory.slice(-50)
    }
    
    writeState(directory, state)
    log(directory, `[STYLE] Changed from '${previousStyle}' to '${styleName}'`)
    
    return `✅ Style changed to: **${styleName}**\n\nPrevious: ${previousStyle}`
  }
})

// ========================================================================
// INFO - Show style details
// ========================================================================

export const info = tool({
  name: "idumb-style_info",
  description: "Show detailed information about a style",
  parameters: z.object({
    style: z.string().describe("Name of the style to inspect")
  }),
  
  async execute(args, context) {
    const { directory } = context
    const { style: styleName } = args
    
    const style = loadStyle(directory, styleName)
    if (!style) {
      return `❌ Style not found: **${styleName}**`
    }
    
    const preview = style.instructions.length > 500 
      ? style.instructions.substring(0, 500) + "..."
      : style.instructions
    
    return `## Style: ${style.name}

**Description:** ${style.description || "None"}
**Mode:** ${style.mode}
**Keep Coding Instructions:** ${style.keepCodingInstructions ? "Yes" : "No"}
**Compatibility:** ${style.compatibility.join(", ")}

### Instructions Preview

${preview || "(No additional instructions)"}`
  }
})

// ========================================================================
// RESET - Return to default style
// ========================================================================

export const reset = tool({
  name: "idumb-style_reset",
  description: "Reset to default output style",
  parameters: z.object({}),
  
  async execute(args, context) {
    const { directory } = context
    
    const state = readState(directory) || {}
    const previousStyle = state.activeStyle || "default"
    
    state.activeStyle = "default"
    state.styleHistory = state.styleHistory || []
    state.styleHistory.push({
      style: "default",
      activatedAt: new Date().toISOString(),
      by: "idumb-style_reset"
    })
    
    writeState(directory, state)
    log(directory, `[STYLE] Reset from '${previousStyle}' to 'default'`)
    
    return `✅ Style reset to **default**\n\nPrevious: ${previousStyle}`
  }
})

// ========================================================================
// DEFAULT EXPORT
// ========================================================================

export default { list, set, info, reset }
```

---

## Phase 4: Agent-Level Style Support (~2 hours)

### Task 4.1: Parse Agent Output-Style in System Transform

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** In `experimental.chat.system.transform` hook  
**Lines:** +25

Add agent-level style detection before global style:

```typescript
// Check for agent-level style override
let agentStyle: StyleContent | null = null
if (tracker?.agentRole) {
  const agentStyleConfig = getAgentOutputStyle(tracker.agentRole, directory)
  if (agentStyleConfig) {
    // Agent style overrides global
    agentStyle = {
      name: `${tracker.agentRole}-style`,
      description: `Agent-specific style for ${tracker.agentRole}`,
      keepCodingInstructions: true,
      mode: 'agent',
      compatibility: ['idumb'],
      instructions: formatAgentStyleInstructions(agentStyleConfig),
      raw: ''
    }
    log(directory, `[STYLE] Using agent-level style for ${tracker.agentRole}`)
  }
}

// Use agent style if available, otherwise global
const effectiveStyle = agentStyle || styleContent
```

**Helper function:**
```typescript
function getAgentOutputStyle(agentRole: string, directory: string): AgentOutputStyle | null {
  // This would parse the agent's frontmatter
  // For now, return null (implement in full version)
  return null
}

function formatAgentStyleInstructions(config: AgentOutputStyle): string {
  const lines = [`## Agent Output Style: ${config.format}`]
  
  if (config.sections?.length) {
    lines.push("\n### Required Sections")
    config.sections.forEach(s => lines.push(`- ${s}`))
  }
  
  if (config.tone) {
    lines.push(`\n### Tone: ${config.tone}`)
  }
  
  if (config.length) {
    lines.push(`\n### Length: ${config.length}`)
  }
  
  return lines.join("\n")
}
```

---

### Task 4.2: Update Key Agent Files

**Files to modify:** 6 agent files  
**Lines per file:** +12

Add `output-style:` section to YAML frontmatter:

#### idumb-supreme-coordinator.md
```yaml
output-style:
  format: governance-report
  sections:
    - status-header
    - evidence-table
    - sub-delegations
    - state-changes
    - recommendations
  tone: confident-factual
  length: comprehensive
```

#### idumb-builder.md
```yaml
output-style:
  format: implementation-summary
  sections:
    - files-changed
    - code-highlights
    - verification-status
  tone: technical-precise
  length: moderate
```

#### idumb-verifier.md
```yaml
output-style:
  format: verification-report
  sections:
    - verification-matrix
    - evidence-collected
    - gaps-identified
    - verdict
  tone: analytical
  length: comprehensive
```

#### idumb-planner.md
```yaml
output-style:
  format: plan-specification
  sections:
    - objective
    - task-breakdown
    - dependencies
    - success-criteria
  tone: structured-clear
  length: comprehensive
```

#### idumb-debugger.md
```yaml
output-style:
  format: debug-analysis
  sections:
    - symptoms
    - hypotheses
    - investigation-log
    - root-cause
    - fix-verification
  tone: methodical
  length: comprehensive
```

#### idumb-research-synthesizer.md
```yaml
output-style:
  format: research-synthesis
  sections:
    - key-findings
    - source-analysis
    - recommendations
    - confidence-levels
  tone: academic-accessible
  length: comprehensive
```

---

## Phase 5: Session Flow Anchoring (~3 hours)

### Task 5.1: Add Anchor Type Constants

**File:** `src/plugins/lib/types.ts` (MODIFY)  
**Lines:** +3

```typescript
export type AnchorType = 
  | "decision" 
  | "context" 
  | "checkpoint" 
  | "output_style"    // NEW
  | "session_flow"    // NEW
```

---

### Task 5.2: Implement Style Anchor Handler

**File:** `src/plugins/lib/state.ts` (MODIFY)  
**Lines:** +35

```typescript
export function createStyleAnchor(
  directory: string, 
  agent: string, 
  style: string
): void {
  const state = readState(directory)
  if (!state) return
  
  // Serialize content as JSON string for compatibility
  const anchorContent = JSON.stringify({ agent, style, timestamp: new Date().toISOString() })
  
  const anchor: Anchor = {
    id: `style-${Date.now()}`,
    created: new Date().toISOString(),
    type: 'output_style',
    content: anchorContent,
    priority: 'high'
  }
  
  state.anchors = state.anchors || []
  
  // Replace policy: one style anchor per agent
  state.anchors = state.anchors.filter(a => {
    if (a.type !== 'output_style') return true
    try {
      const parsed = JSON.parse(a.content)
      return parsed.agent !== agent
    } catch {
      return true
    }
  })
  
  state.anchors.push(anchor)
  writeState(directory, state)
  
  log(directory, `[ANCHOR] Created style anchor for ${agent}: ${style}`)
}

export function getStyleAnchors(directory: string): Array<{ agent: string; style: string }> {
  const state = readState(directory)
  if (!state?.anchors) return []
  
  return state.anchors
    .filter(a => a.type === 'output_style')
    .map(a => {
      try {
        return JSON.parse(a.content)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}
```

---

### Task 5.3: Create Session Flow Anchor on Major Events

**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** In session.idle event handler  
**Lines:** +20

```typescript
// Create session flow anchor before cleanup
if (sessionId && sessionTrackers.has(sessionId)) {
  const tracker = sessionTrackers.get(sessionId)
  
  // Create session flow anchor for context preservation
  const flowContent = JSON.stringify({
    sessionId,
    duration: Date.now() - tracker.startTime.getTime(),
    agentRole: tracker.agentRole,
    activeStyle: tracker.activeStyle,
    violations: tracker.violationCount,
    timestamp: new Date().toISOString()
  })
  
  const state = readState(directory)
  if (state) {
    // Keep only latest session flow anchor
    state.anchors = (state.anchors || []).filter(a => a.type !== 'session_flow')
    state.anchors.push({
      id: `flow-${Date.now()}`,
      created: new Date().toISOString(),
      type: 'session_flow',
      content: flowContent,
      priority: 'normal'
    })
    writeState(directory, state)
  }
}
```

---

## Phase 6: Enforcement Skill (~2 hours)

### Task 6.1: Create Output Style Enforcement Skill

**File:** `src/skills/output-style-enforcement/SKILL.md` (NEW)  
**Lines:** ~120

```markdown
---
name: output-style-enforcement
description: Monitors agent responses for style compliance and provides correction hints
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: style-enforcement
  package: STYLE
  activation: manual
---

# Output Style Enforcement Skill

## Purpose

Guide agents to follow their designated output styles through pattern-based detection and reminder injection. This skill provides reference documentation for AI behavior - actual enforcement happens in the plugin hooks.

## Scope

This skill applies to:
- All iDumb agents with `output-style:` configuration
- Global styles set via `/idumb:style` command
- Style anchors that survive compaction

## Detection Patterns

### 1. Section Compliance

Expected sections are defined in the agent's `output-style.sections[]` array.

**Detection Method:** Regex for heading patterns
```javascript
const sectionPattern = /^#{1,3}\s+(.+)$/gm
const headings = response.match(sectionPattern)
const missingCount = expectedSections.filter(s => 
  !headings.some(h => h.toLowerCase().includes(s.toLowerCase()))
).length
```

**Threshold:** Trigger reminder if >50% expected sections missing

### 2. Length Compliance

Expected length categories:
- `concise`: <300 words
- `moderate`: 300-800 words  
- `comprehensive`: >800 words

**Detection Method:** Word count
```javascript
const wordCount = response.split(/\s+/).length
```

**Threshold:** Trigger if >2x or <0.5x expected

### 3. Format Elements

Check for expected format elements:
- `evidence-table` → Look for markdown table syntax `|---|`
- `code-highlights` → Look for code blocks ``` 
- `bullet-lists` → Look for `- ` or `* ` patterns

## Enforcement Actions

When deviation detected (in `experimental.chat.messages.transform`):

1. **Log deviation** to governance history
2. **Inject reminder** in next message transform:

```
[STYLE REMINDER]
Your designated output style is: {style_name}
Expected sections: {missing_sections}
Current length: {word_count} words (expected: {expected_length})
Please structure your next response accordingly.
```

3. **Track pattern** for session flow anchor
4. **Never block** - reminders only

## Integration Points

### Works With
- `experimental.chat.messages.transform` hook (reminder injection)
- `idumb-state_anchor` (deviation tracking)
- `idumb-orchestrator` (coordination)

### Does NOT
- Automatically load (skills are reference documents)
- Block responses (only remind)
- Perform semantic analysis (too expensive)

## Thresholds

| Check | Trigger Condition | Action |
|-------|-------------------|--------|
| Missing Sections | >50% expected missing | Reminder |
| Wrong Length | >2x or <0.5x expected | Reminder |
| Missing Format | Key format element absent | Soft reminder |
| Repeated Violation | 3+ in same session | Stronger reminder |

## Example Reminder Injection

When deviation detected, add to next `messages.transform`:

```markdown
---
⚠️ **Style Deviation Detected**

Your designated style is **governance-report** which requires:
- ✅ status-header (found)
- ❌ evidence-table (missing)
- ❌ recommendations (missing)

Please include these sections in your response.
---
```

## Limitations

1. **Pattern-based only** - Cannot detect semantic tone
2. **False positives possible** - Some responses legitimately skip sections
3. **No blocking** - User experience over enforcement
4. **Memory cost** - Tracking adds to session state

## Configuration

Style enforcement can be configured in `.idumb/brain/config.json`:

```json
{
  "style": {
    "enforcement": "reminder",  // "reminder" | "silent" | "strict"
    "reminderFrequency": 3,     // Remind every N violations
    "trackHistory": true        // Log violations to history
  }
}
```
```

---

## Implementation Checklist

### Phase 0 (BLOCKING)
- [ ] Task 0.1: Session tracker cleanup function
- [ ] Task 0.2: Atomic writes for state.json
- [ ] Task 0.3: Compaction token budget

### Phase 1: Core Infrastructure
- [ ] Task 1.1: `src/plugins/lib/styles.ts`
- [ ] Task 1.2: Default style files (5 files)
- [ ] Task 1.3: State schema extension
- [ ] Task 1.4: Barrel export update

### Phase 2: Plugin Hooks
- [ ] Task 2.1: `experimental.chat.system.transform` hook
- [ ] Task 2.2: Session tracker interface extension
- [ ] Task 2.3: Style initialization in session.created
- [ ] Task 2.4: Style in compaction context
- [ ] Task 2.5: Cache invalidation via event

### Phase 3: User Interface
- [ ] Task 3.1: `/idumb:style` command
- [ ] Task 3.2: `idumb-style` tool

### Phase 4: Agent Styles
- [ ] Task 4.1: Agent style parsing
- [ ] Task 4.2: Update 6 agent files

### Phase 5: Anchoring
- [ ] Task 5.1: Anchor type constants
- [ ] Task 5.2: Style anchor handler
- [ ] Task 5.3: Session flow anchor

### Phase 6: Enforcement
- [ ] Task 6.1: Enforcement skill

---

## Verification Plan

### Automated
```bash
npm run typecheck          # TypeScript validation
npm run install:local      # Reinstall plugin
```

### Manual Testing

| Test | Steps | Expected |
|------|-------|----------|
| **Style Init** | Start new session | Log: "initialized with style: default" |
| **Style Injection** | Set governance style, send message | System prompt includes `<!-- IDUMB:STYLE:governance -->` |
| **Idempotency** | Send 3 messages | Style injected once per message |
| **Style Switch** | `/idumb:style verbose` | Cache cleared, next message uses verbose |
| **Compaction** | Trigger compaction | "[Active Style: xxx]" in context |
| **Memory** | Run 24+ hours | No sessionTracker growth |
| **Race Condition** | Two tabs, change style | No state.json corruption |

---

## Rollback Strategy

1. **Revert idumb-core.ts** (git checkout)
2. **Keep style files** (harmless if unused)
3. **Remove state fields** (set activeStyle to null)
4. **Reinstall**: `npm run install:local`

---

*Plan Version: 2.0 | Based on: 4-Agent Research Synthesis | Ready for Implementation*
