# Consolidated Implementation Plan: Output Style Functionality for iDumb

**Project:** iDumb Framework  
**Date:** 2026-02-04  
**Status:** Final - Ready for Implementation  
**Based on:** Plan A + Plan B-Updated (validated and merged)

---

## Executive Summary

This plan consolidates the best aspects of both previous plans:
- **Plan B's infrastructure**: Dedicated `styles/` directory, production-ready code, centralized management
- **Plan A's conceptual innovations**: Agent-level output-style YAML, session flow anchors, enforcement skill

### Core Approach

| Layer | Mechanism | Source |
|-------|-----------|--------|
| **Global Styles** | `.idumb/brain/styles/*.md` files | Plan B |
| **Agent Overrides** | `output-style:` in agent YAML frontmatter | Plan A |
| **Runtime Injection** | `experimental.chat.system.transform` hook | Both |
| **Session Anchoring** | New anchor types for style + flow | Plan A |
| **User Interface** | `/idumb:style` command + `idumb-style` tool | Plan B |
| **Compliance** | `output-style-enforcement` skill | Plan A |

---

## Hook Validation & Corrections

### ❌ Plan B Inaccuracies Found

| Claim in Plan B | Reality | Correction |
|-----------------|---------|------------|
| `session.created` is a hook | ❌ It's an **EVENT**, not a hook | Use `event` hook handler with `event.type === "session.created"` check |
| 3 hooks for style system | ❌ Only 2 proper hooks exist | Use `event` handler + 2 experimental hooks |

### ✅ Correct Hook Architecture

Based on validation against `idumb-core.ts` and plugin guidelines:

```typescript
// ACTUAL available hooks in OpenCode for output styles:
{
  // 1. EVENT HANDLER (not a dedicated hook!)
  event: async ({ event }) => {
    if (event.type === "session.created") {
      // Initialize style state here
    }
  },

  // 2. SYSTEM PROMPT MODIFICATION (PRIMARY - fires every message)
  "experimental.chat.system.transform": async (input, output) => {
    // input: { sessionID?: string; model: Model }
    // output: { system: string[] }
    output.system.push("Style instructions...")
  },

  // 3. MESSAGE MODIFICATION (already exists in idumb-core.ts)
  "experimental.chat.messages.transform": async (input, output) => {
    // Currently used for governance injection
    // Can be extended for style reminders
  },

  // 4. COMPACTION HOOK (already exists in idumb-core.ts)
  "experimental.session.compacting": async (input, output) => {
    // input: { sessionID: string }
    // output: { context: string[]; prompt?: string }
    output.context.push("Active style: governance")
  }
}
```

### Hook Timing Sequence (Corrected)

```
┌──────────────────────────────────────────────────────────────────────┐
│ SESSION START                                                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  event({ type: "session.created" })                                   │
│       │                                                               │
│       ▼                                                               │
│  (iDumb already handles this at line 131 of idumb-core.ts)           │
│  → Add style initialization here                                      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FIRST USER MESSAGE                                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  experimental.chat.messages.transform                                 │
│       │ (currently for governance, extend for style reminders)       │
│       ▼                                                               │
│  experimental.chat.system.transform  ◀─── NEW: STYLE INJECTION       │
│       │                                                               │
│       ▼                                                               │
│  [LLM processes with modified system prompt]                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ MID-SESSION MESSAGES                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Same hooks fire for every message:                                  │
│  - messages.transform: governance + style reminders                  │
│  - system.transform: style injection (NEW)                          │
│                                                                       │
│  Tool calls:                                                          │
│  - tool.execute.before/after (existing, no changes needed for style) │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ COMPACTION                                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  experimental.session.compacting                                      │
│       │ (currently at line 316 of idumb-core.ts)                     │
│       ▼                                                               │
│  Add style anchor to output.context                                  │
│  → Ensures style survives compaction                                 │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Hook Coherence & Chain Safety

### Verified from Plugin Guidelines

| Guarantee | Description | Impact |
|-----------|-------------|--------|
| **Fail-Safe** | OpenCode wraps all hooks in try/catch | Plugin errors won't crash OpenCode |
| **Sequential** | Hooks run in load order (global → project) | iDumb hooks always run |
| **No Short-Circuit** | Cannot prevent other hooks from running | Style injection safe alongside other plugins |
| **Output Mutation Only** | Modify `output`, not `input` | Clean separation of concerns |

### Coherence Strategies

#### 1. Idempotency (from Plan B - correct)
```typescript
const STYLE_MARKER = "[IDUMB_STYLE:"
if (output.system.some(s => s.includes(STYLE_MARKER))) {
  return // Already injected this message
}
output.system.push(`${STYLE_MARKER}${activeStyle}]\n${instructions}`)
```

#### 2. Session Isolation (from Plan B - enhanced)
```typescript
// Store in existing session tracker structure (line 112 of idumb-core.ts)
const sessionTrackers = new Map<string, {
  sessionId: string
  // ... existing fields
  activeStyle?: string  // NEW: Add to existing tracker
  styleCache?: StyleContent  // NEW: Cached parsed style
}>()
```

#### 3. Cache Invalidation (new - not in either plan)
```typescript
// Clear cache when style changes via command
"command.execute.after": async (input, output) => {
  if (input.name === 'idumb:style') {
    const sessionId = input.sessionID
    const tracker = sessionTrackers.get(sessionId)
    if (tracker) {
      tracker.styleCache = undefined  // Force re-parse
    }
  }
}
```

---

## Detailed Task Breakdown

### Phase 1: Core Infrastructure (~4 hours)

#### Task 1.1: Create Style Library Module
**File:** `src/lib/styles.ts` (NEW)  
**Lines:** ~120  
**Dependencies:** None

```typescript
// Functions to implement:
export function getStylesDir(directory: string): string
export function loadActiveStyle(directory: string): string | null
export function setActiveStyle(directory: string, styleName: string): boolean
export function parseStyleFile(stylePath: string): StyleContent | null
export function listAvailableStyles(directory: string): string[]
export function createStyleFile(directory: string, name: string, config: StyleConfig): void

// Types to define:
export interface StyleConfig {
  name: string
  description: string
  keepCodingInstructions: boolean
  mode: 'global' | 'agent'
  compatibility: string[]
}

export interface StyleContent extends StyleConfig {
  instructions: string
}
```

**Specific Changes:**
1. Create file with YAML frontmatter parsing (use existing pattern from agent files)
2. Implement lazy loading with file caching
3. Use `log()` from `./logging.ts` for all output

---

#### Task 1.2: Create Default Style Files
**Location:** `.idumb/brain/styles/` (NEW directory)  
**Files:** 5 markdown files  
**Lines:** ~200 total

| File | Description |
|------|-------------|
| `default.md` | Standard iDumb behavior (no extra instructions) |
| `governance.md` | Enhanced governance reporting |
| `verbose.md` | Detailed explanations and reasoning |
| `terse.md` | Minimal output, action-focused |
| `learning.md` | Educational mode with insights |

**Template for each:**
```markdown
---
name: Governance Style
description: Enhanced governance prompts for iDumb agents
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

# Style Instructions

You are operating in **Governance Mode**. Follow these guidelines:

## Output Format
- Structure all responses as governance reports
- Include evidence tables when referencing decisions
- Track and report all delegations in hierarchy format

## Behavioral Modifications
- Always check state before actions
- Verify permissions before file operations
...
```

---

#### Task 1.3: Extend State Schema
**File:** `.idumb/brain/state.json` (MODIFY)  
**Lines:** +3

**Add to schema:**
```json
{
  "activeStyle": "default",
  "styleHistory": [
    {"style": "default", "activatedAt": "2026-02-04T22:00:00Z", "by": "session_start"}
  ]
}
```

**Implementation:**
1. Update `getDefaultState()` in `src/lib/state.ts` to include these fields
2. Add `styleHistory` as an array of `{style, activatedAt, by}` objects
3. Limit history to last 50 entries to prevent bloat

---

### Phase 2: Plugin Hook Implementation (~6 hours)

#### Task 2.1: Add `experimental.chat.system.transform` Hook
**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** After line 332 (after `experimental.session.compacting`)  
**Lines:** +45

```typescript
// ========================================================================
// SYSTEM PROMPT TRANSFORMATION (Output Style Injection)
// ========================================================================

"experimental.chat.system.transform": async (input: any, output: any) => {
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

    // Skip injection for default style
    if (activeStyle === 'default') {
      return
    }

    // Idempotency check
    const marker = `[IDUMB_STYLE:${activeStyle}]`
    if (output.system.some((s: string) => s.includes(marker))) {
      return // Already injected
    }

    // Load from cache or parse file
    let styleContent = tracker?.styleCache
    if (!styleContent) {
      const stylePath = join(getStylesDir(directory), `${activeStyle}.md`)
      styleContent = parseStyleFile(stylePath)
      
      if (styleContent && tracker) {
        tracker.styleCache = styleContent
      }
    }

    // Inject with marker
    if (styleContent?.instructions) {
      output.system.push(`${marker}\n${styleContent.instructions}`)
      log(directory, `[STYLE] Injected ${activeStyle} (${styleContent.instructions.length} chars)`)
    }
  } catch (error) {
    log(directory, `[ERROR] system.transform failed: ${error}`)
    // Graceful degradation - continue without style
  }
},
```

---

#### Task 2.2: Extend Session Tracker for Style
**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** Line 112-118 (existing `sessionTrackers` Map)  
**Lines:** +2

```diff
 const sessionTrackers = new Map<string, {
   sessionId: string
   startTime: Date
   violationCount: number
   lastActivity: Date
   governanceInjected: boolean
+  activeStyle?: string
+  styleCache?: StyleContent
 }>()
```

---

#### Task 2.3: Initialize Style in Session Created Event
**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** Line 131-167 (inside `event.type === "session.created"` block)  
**Lines:** +10

```typescript
// Add after line 149 (after getStallDetectionState call)

// Initialize output style for this session
const state = readState(directory)
const activeStyle = state?.activeStyle || 'default'
const tracker = sessionTrackers.get(sessionId)
if (tracker) {
  tracker.activeStyle = activeStyle
  log(directory, `[STYLE] Session ${sessionId} initialized with style: ${activeStyle}`)
}
```

---

#### Task 2.4: Add Style Anchor to Compaction Hook
**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** Line 316-332 (existing `experimental.session.compacting` hook)  
**Lines:** +15

```typescript
// Add after line 325 (after output.context.push(context))

// Preserve active style across compaction
const state = readState(directory)
if (state?.activeStyle && state.activeStyle !== 'default') {
  output.context.push(`
## Active Output Style
Style: ${state.activeStyle}
This style was active before compaction and should remain active.
Instructions for this style are injected via system prompt.
`)
  log(directory, `[STYLE] Preserved style '${state.activeStyle}' across compaction`)
}
```

---

#### Task 2.5: Add Cache Invalidation to Command Hook
**File:** `src/plugins/idumb-core.ts` (MODIFY)  
**Location:** Line 816+ (existing `command.execute.before` hook)  
**Lines:** +12

> **NOTE:** Check if `command.execute.after` exists. If not, add it.

```typescript
// If command.execute.after doesn't exist, add it:
"command.execute.after": async (input: any, output: any) => {
  try {
    // Clear style cache when style command executed
    if (input.name === 'idumb:style') {
      const sessionId = input.sessionID
      const tracker = sessionTrackers.get(sessionId)
      if (tracker) {
        tracker.styleCache = undefined
        log(directory, `[STYLE] Cache cleared after style change`)
      }
    }
  } catch (error) {
    log(directory, `[ERROR] command.execute.after: ${error}`)
  }
},
```

---

### Phase 3: User Interface (~3 hours)

#### Task 3.1: Create Style Command
**File:** `src/commands/idumb/style.md` (NEW)  
**Lines:** ~50

```markdown
---
description: Manage and switch output styles
agent: idumb-high-governance
mode: all
---

# Style Management

## Usage

/idumb:style                     # List available styles + show current
/idumb:style <name>              # Set active style
/idumb:style --info <name>       # Show style details
/idumb:style --reset             # Reset to default

## Workflow

1. When user runs `/idumb:style`:
   - Read all `.md` files from `.idumb/brain/styles/`
   - Parse each file's frontmatter for name and description
   - Display list with current style highlighted

2. When user runs `/idumb:style <name>`:
   - Validate style exists
   - Update `state.json` with new `activeStyle`
   - Add to `styleHistory`
   - Confirm change to user

3. When user runs `/idumb:style --reset`:
   - Set `activeStyle` to "default"
   - Clear style cache

## Available Styles

- **default** - Standard iDumb behavior (no extra instructions)
- **governance** - Enhanced governance reporting with evidence tables
- **verbose** - Detailed explanations and reasoning
- **terse** - Minimal output, action-focused
- **learning** - Educational explanations with insights
```

---

#### Task 3.2: Create Style Tool (Optional Enhancement)
**File:** `src/tools/idumb-style.ts` (NEW)  
**Lines:** ~80

```typescript
import { tool } from "@opencode-ai/plugin"
import { getStylesDir, setActiveStyle, listAvailableStyles, parseStyleFile } from "../lib/styles"
import { log } from "../lib/logging"
import { join } from "path"

export const idumbStyleTool = tool({
  description: "Manage output styles for iDumb agents",
  args: {
    action: tool.schema.enum(["list", "set", "info", "reset"]),
    style: tool.schema.string().optional()
  },
  async execute(args, context) {
    const { directory } = context
    
    switch (args.action) {
      case "list":
        const styles = listAvailableStyles(directory)
        return `Available styles:\n${styles.map(s => `- ${s}`).join('\n')}`
      
      case "set":
        if (!args.style) return "Error: style name required"
        const success = setActiveStyle(directory, args.style)
        return success 
          ? `Style changed to: ${args.style}` 
          : `Style not found: ${args.style}`
      
      case "info":
        if (!args.style) return "Error: style name required"
        const stylePath = join(getStylesDir(directory), `${args.style}.md`)
        const content = parseStyleFile(stylePath)
        return content 
          ? `Name: ${content.name}\nDescription: ${content.description}\nMode: ${content.mode}`
          : "Style not found"
      
      case "reset":
        setActiveStyle(directory, "default")
        return "Style reset to default"
    }
  }
})
```

---

### Phase 4: Agent-Level Style Support (~2 hours)

#### Task 4.1: Extend Agent YAML Schema in Parser
**File:** `src/lib/governance.ts` or wherever agent parsing happens (MODIFY)  
**Lines:** +15

Add parsing for `output-style:` section in agent frontmatter:

```typescript
// Add to agent parsing logic
interface AgentOutputStyle {
  format?: string
  sections?: string[]
  tone?: string
  length?: 'concise' | 'moderate' | 'comprehensive'
}

function parseAgentOutputStyle(frontmatter: string): AgentOutputStyle | null {
  // Parse output-style YAML section
  const match = frontmatter.match(/output-style:\s*([\s\S]*?)(?=\n\w|$)/)
  if (!match) return null
  
  // Parse sub-properties
  return {
    format: extractProperty(match[1], 'format'),
    sections: extractListProperty(match[1], 'sections'),
    tone: extractProperty(match[1], 'tone'),
    length: extractProperty(match[1], 'length') as any
  }
}
```

---

#### Task 4.2: Update Key Agent Files
**Files:** 6 agent files (MODIFY)  
**Lines:** +10 each (60 total)

Add `output-style:` section to frontmatter of:

| Agent File | Style Format |
|------------|--------------|
| `idumb-supreme-coordinator.md` | governance-report |
| `idumb-builder.md` | implementation-summary |
| `idumb-research-synthesizer.md` | research-synthesis |
| `idumb-debugger.md` | debug-analysis |
| `idumb-planner.md` | plan-specification |
| `idumb-verifier.md` | verification-report |

**Example for supreme-coordinator:**
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

---

### Phase 5: Session Flow Anchoring (~3 hours)

#### Task 5.1: Add New Anchor Types
**File:** `src/lib/types.ts` (MODIFY)  
**Lines:** +20

```typescript
// Extend Anchor type
export interface StyleAnchor extends Anchor {
  type: 'output_style'
  content: {
    agent: string
    style: string
    lastResponse?: string  // Optional: pattern of last response
  }
}

export interface SessionFlowAnchor extends Anchor {
  type: 'session_flow'
  content: {
    hierarchy: string[]  // Agent delegation chain
    workflow: string     // Current workflow/phase
    fileTree: string[]   // Files modified this session
    artifacts: string[]  // Planning artifacts created
  }
}
```

---

#### Task 5.2: Implement Anchor Handlers
**File:** `src/lib/state.ts` (MODIFY)  
**Lines:** +40

```typescript
export function createStyleAnchor(
  directory: string, 
  agent: string, 
  style: string,
  lastResponse?: string
): void {
  const state = readState(directory)
  const anchor: StyleAnchor = {
    id: `style-${Date.now()}`,
    type: 'output_style',
    content: { agent, style, lastResponse },
    priority: 'high',
    timestamp: new Date().toISOString()
  }
  
  state.anchors = state.anchors || []
  
  // Remove old style anchors for same agent
  state.anchors = state.anchors.filter(
    a => !(a.type === 'output_style' && a.content?.agent === agent)
  )
  
  state.anchors.push(anchor)
  writeState(directory, state)
}

export function createSessionFlowAnchor(
  directory: string,
  hierarchy: string[],
  workflow: string,
  fileTree: string[],
  artifacts: string[]
): void {
  const state = readState(directory)
  const anchor: SessionFlowAnchor = {
    id: `flow-${Date.now()}`,
    type: 'session_flow',
    content: { hierarchy, workflow, fileTree, artifacts },
    priority: 'critical',
    timestamp: new Date().toISOString()
  }
  
  state.anchors = state.anchors || []
  
  // Keep only latest session flow anchor
  state.anchors = state.anchors.filter(a => a.type !== 'session_flow')
  state.anchors.push(anchor)
  
  writeState(directory, state)
}
```

---

### Phase 6: Enforcement Skill (~2 hours)

#### Task 6.1: Create Output Style Enforcement Skill
**File:** `.agents/skills/output-style-enforcement/SKILL.md` (NEW)  
**Lines:** ~80

```markdown
---
name: output-style-enforcement
description: Ensures agents follow their designated output style
autoload: on-deviation
---

# Output Style Enforcement Skill

This skill monitors agent responses and provides correction hints when
the output deviates from the agent's designated style.

## When to Activate

This skill is triggered when:
- Agent response doesn't match expected format for their role
- Missing required sections (evidence, recommendations, etc.)
- Tone doesn't match agent's designated style

## Enforcement Logic

1. **Parse Agent's Expected Style**
   - Read agent's `output-style:` configuration from frontmatter
   - Extract expected: format, sections, tone, length

2. **Analyze Current Response**
   - Check for presence of expected sections
   - Estimate tone from language patterns
   - Measure response length against expectation

3. **Generate Correction Hint** (if deviation detected)
   - Inject reminder into next message transform
   - Example: "Remember: Your role requires governance-report format with evidence tables."

## Integration

This skill works with `experimental.chat.messages.transform` hook to inject
reminders when deviation is detected.

## Thresholds

- **Missing Sections**: Trigger if >50% expected sections missing
- **Wrong Tone**: Trigger if detected tone confidence <70% match
- **Wrong Length**: Trigger if response >2x or <0.5x expected length

## Example Output

When deviation detected, add to next message:

[STYLE REMINDER]
Your designated output style is: governance-report
Expected sections: status-header, evidence-table, recommendations
Please structure your response accordingly.
```

---

## File Summary

### New Files (9)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/styles.ts` | ~120 | Style management utilities |
| `src/tools/idumb-style.ts` | ~80 | Style management tool |
| `src/commands/idumb/style.md` | ~50 | Style command |
| `.idumb/brain/styles/default.md` | ~10 | Default style (minimal) |
| `.idumb/brain/styles/governance.md` | ~50 | Governance style |
| `.idumb/brain/styles/verbose.md` | ~50 | Verbose style |
| `.idumb/brain/styles/terse.md` | ~30 | Terse style |
| `.idumb/brain/styles/learning.md` | ~50 | Learning style |
| `.agents/skills/output-style-enforcement/SKILL.md` | ~80 | Enforcement skill |

### Modified Files (6)

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `src/plugins/idumb-core.ts` | +80 | Add system.transform hook, extend session tracker |
| `src/lib/state.ts` | +60 | Add anchor handlers, extend schema |
| `src/lib/types.ts` | +20 | Add anchor types |
| `.idumb/brain/state.json` | +5 | Add activeStyle, styleHistory |
| Agent files (6) | +60 | Add output-style YAML sections |

**Total Estimated Changes:** ~700 lines across 15 files

---

## Verification Plan

### Automated Tests

```bash
# Run after implementation
npm run typecheck                     # TypeScript validation
npm run test:lib:styles              # Style library unit tests
npm run test:plugin:hooks            # Hook integration tests
```

### Manual Verification

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **Style Initialization** | Start new session | `[STYLE] Session xxx initialized with style: default` in logs |
| **Style Injection** | Set governance style, send message | System prompt includes `[IDUMB_STYLE:governance]` marker |
| **Idempotency** | Send 3 messages with same style | Style injected exactly once per message |
| **Style Switching** | Run `/idumb:style verbose` | Logs show cache cleared, next message uses verbose |
| **Compaction Survival** | Trigger compaction, check context | "Active Output Style: xxx" in compaction context |
| **TUI Stability** | Run 10 style switches | No console.log output, no crashes |
| **Graceful Degradation** | Corrupt a style file | Falls back to default, logs error |

---

## Rollback Strategy

1. **Revert idumb-core.ts changes** (git checkout)
2. **Keep style files** (harmless if unused)
3. **Remove `activeStyle` from state.json** (set to null)
4. **Reinstall plugin**: `npm run install:local`

---

## Open Questions for User

1. **Style inheritance?** Should agent-level `output-style:` override or merge with global styles?
2. **Style migration?** Create converter for Claude Code output styles?
3. **History limit?** Keep last N style activations (proposed: 50)?
4. **Enforcement strictness?** How aggressive should the enforcement skill be?

---

## Implementation Order

Recommended sequence with dependencies:

```
Phase 1 ─► Phase 2 ─► Phase 3 ─► Phase 4 ─► Phase 5 ─► Phase 6
   │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼
  1.1       2.1        3.1        4.1        5.1        6.1
   │          │          │          │          │
   └──1.2─────┴──2.2──┐  │          │          │
        │             │  │          │          │
        └──1.3────────┴──┴──2.3──┐  │          │
                      │          │  │          │
                      2.4        │  4.2        │
                      │          │  │          │
                      2.5        │  │          │
                                 │  │          │
                                3.2 │          │
                                    │          │
                                    5.2        │
```

**Critical Path:** 1.1 → 2.1 → 2.2 → 2.3 → 3.1 (minimum viable)

**Nice-to-have:** 3.2, 4.x, 5.x, 6.x
