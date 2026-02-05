# Research Synthesis: Output Style Implementation

**Project:** iDumb Framework - Output Style Feature  
**Date:** 2026-02-04  
**Status:** Research Complete - Ready for Corrected Plan  
**Research Agents:** 4 parallel researchers + 1 skeptic validator

---

## Executive Summary

This document synthesizes research from 4 specialized agents investigating the consolidated plan for Output Style functionality. The research revealed **3 critical issues** requiring immediate attention before implementation, **12 plan corrections**, and validated the core hook architecture.

### Key Outcomes

| Category | Finding |
|----------|---------|
| **VERIFIED** | `experimental.chat.system.transform` hook exists and has correct signature |
| **VERIFIED** | Sequential hook execution guaranteed by OpenCode |
| **CORRECTED** | Path should be `src/plugins/lib/styles.ts` NOT `src/lib/styles.ts` |
| **CORRECTED** | Use `command.executed` event, NOT `command.execute.after` hook |
| **CRITICAL FIX** | Memory leak in sessionTrackers - requires Phase 0 |
| **CRITICAL FIX** | State.json race condition - requires file locking |
| **CRITICAL FIX** | Compaction token budget - requires size limits |

---

## Part 1: Critical Issues Requiring Phase 0

### Issue 1: Session Tracker Memory Leak (CRITICAL)

**Location:** `src/plugins/lib/session-tracker.ts` line 35 and `idumb-core.ts` line 112

**Problem:** The `sessionTrackers` Map is never garbage collected for old sessions. Adding `styleCache` (~2-5KB per session) will accelerate memory exhaustion.

**Evidence:**
- `session.idle` event calls `sessionTrackers.delete(sessionId)` (line 229)
- BUT: Not all sessions trigger idle, crashed sessions never clean up
- No TTL or LRU eviction mechanism exists

**Required Fix:**
```typescript
// Add at module level
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_SESSIONS = 100

function cleanupStaleSessions(): void {
  const now = Date.now()
  const toDelete: string[] = []
  
  sessionTrackers.forEach((tracker, sessionId) => {
    if (now - tracker.lastActivity.getTime() > SESSION_TTL_MS) {
      toDelete.push(sessionId)
    }
  })
  
  // LRU eviction if over max
  if (sessionTrackers.size > MAX_SESSIONS) {
    const sorted = [...sessionTrackers.entries()]
      .sort((a, b) => a[1].lastActivity.getTime() - b[1].lastActivity.getTime())
    while (sorted.length > MAX_SESSIONS) {
      const [id] = sorted.shift()!
      toDelete.push(id)
    }
  }
  
  toDelete.forEach(id => sessionTrackers.delete(id))
}
```

### Issue 2: State.json Race Condition (HIGH)

**Location:** `src/plugins/lib/state.ts` lines 34-58

**Problem:** Multiple sessions (tabs, VSCode windows) can read/write state.json concurrently, causing data loss.

**Evidence:**
- Current code uses raw `writeFileSync` with NO locking
- OpenCode's own storage API uses proper locking (guidelines line 900-918)

**Required Fix (Option A - Atomic Write):**
```typescript
import { renameSync } from "fs"

export function writeState(directory: string, state: IdumbState): void {
  const statePath = getStatePath(directory)
  const tempPath = statePath + ".tmp"
  writeFileSync(tempPath, JSON.stringify(state, null, 2))
  renameSync(tempPath, statePath) // Atomic on most filesystems
}
```

### Issue 3: Compaction Token Budget (HIGH)

**Location:** `idumb-core.ts` lines 316-332

**Problem:** Compaction triggers because context is TOO LARGE. Adding more context could cause failures or crowd out critical information.

**Required Fix:**
```typescript
const MAX_CONTEXT_CHARS = 2000 // Conservative limit

"experimental.session.compacting": async (input, output) => {
  const existingSize = output.context.join('').length
  const remaining = MAX_CONTEXT_CHARS - existingSize
  
  if (remaining < 100) {
    log(directory, "[STYLE] Skipping compaction context - budget exceeded")
    return
  }
  
  // Minimal style context - just the name, not full description
  const state = readState(directory)
  if (state?.activeStyle && state.activeStyle !== 'default') {
    const styleNote = `[Style: ${state.activeStyle}]`
    if (styleNote.length < remaining) {
      output.context.push(styleNote)
    }
  }
}
```

---

## Part 2: Plan Corrections Summary

### Path Corrections

| Original Path | Corrected Path | Reason |
|---------------|----------------|--------|
| `src/lib/styles.ts` | `src/plugins/lib/styles.ts` | `src/lib/` doesn't exist; all lib code is in `src/plugins/lib/` |
| `src/lib/types.ts` | `src/plugins/lib/types.ts` | Same reason |
| `src/lib/state.ts` | `src/plugins/lib/state.ts` | Same reason |
| `src/lib/governance.ts` | Doesn't exist | Agent parsing is in `idumb-core.ts` |
| `.agents/skills/` | `src/skills/` | Skills are in src directory |

### Hook Corrections

| Original Claim | Correction |
|----------------|------------|
| Use `command.execute.after` hook | Use `command.executed` EVENT instead (hook doesn't exist) |
| `session.created` is a hook | It's an EVENT, use `event` hook with type check |

### Schema Corrections

| Original Claim | Correction |
|----------------|------------|
| `Anchor.content` can be object | `Anchor.content` is `string` - serialize objects to JSON |
| No migration needed | Add `activeStyle` and `styleHistory` with defaults |

### Tool Corrections

| Original Pattern | Corrected Pattern |
|------------------|-------------------|
| `export const idumbStyleTool = tool({...})` | Use named exports: `export const list`, `export const set`, etc. with default export |

### Command Corrections

| Original Claim | Correction |
|----------------|------------|
| Commands have `mode: all` field | Commands don't have `mode` - that's for agents |

---

## Part 3: Verified Hook Architecture

### Available Hooks (CONFIRMED)

| Hook | Status | Signature |
|------|--------|-----------|
| `experimental.chat.system.transform` | EXISTS | `(input: {sessionID?, model}, output: {system: string[]}) => Promise<void>` |
| `experimental.chat.messages.transform` | EXISTS | Already in idumb-core.ts |
| `experimental.session.compacting` | EXISTS | Already in idumb-core.ts |
| `event` with `session.created` | EXISTS | Already in idumb-core.ts |
| `tool.execute.before/after` | EXISTS | Already in idumb-core.ts |
| `permission.ask` | EXISTS | Already in idumb-core.ts |

### Hook Guarantees (CONFIRMED)

| Guarantee | Description |
|-----------|-------------|
| **Fail-Safe** | OpenCode wraps all hooks in try/catch |
| **Sequential** | Hooks run in load order (global → project) |
| **No Short-Circuit** | Cannot prevent other hooks from running |
| **Output Mutation Only** | Modify `output`, not `input` |

---

## Part 4: Corrected Phase Structure

### NEW Phase 0: Memory Management Prerequisites (~2 hours)

**BLOCKING - Must complete before other phases**

#### Task 0.1: Implement Session Tracker Cleanup
**File:** `src/plugins/idumb-core.ts` (MODIFY)
**Lines:** +30

Add:
- Session TTL tracking (lastActivity timestamp)
- Periodic cleanup on session.idle
- LRU eviction when over MAX_SESSIONS
- Clear styleCache when session deleted

#### Task 0.2: Add State.json Atomic Writes
**File:** `src/plugins/lib/state.ts` (MODIFY)
**Lines:** +15

Add:
- Atomic write pattern (write to temp, rename)
- Retry logic for read failures

---

### Phase 1: Core Infrastructure (~4 hours)

#### Task 1.1: Create Style Library Module
**File:** `src/plugins/lib/styles.ts` (NEW) ← CORRECTED PATH
**Lines:** ~120

```typescript
// Functions to implement:
export function getStylesDir(directory: string): string
export function loadActiveStyle(directory: string): string | null
export function setActiveStyle(directory: string, styleName: string): boolean
export function parseStyleFile(stylePath: string): StyleContent | null
export function listAvailableStyles(directory: string): string[]
export function createStyleFile(directory: string, name: string, config: StyleConfig): void

// MUST use log() from ./logging.ts, NO console.log
```

#### Task 1.2: Create Default Style Files
**Location:** `.idumb/brain/styles/` (NEW directory)
**Files:** 5 markdown files

| File | Description |
|------|-------------|
| `default.md` | Standard iDumb behavior (minimal) |
| `governance.md` | Enhanced governance reporting |
| `verbose.md` | Detailed explanations |
| `terse.md` | Minimal output |
| `learning.md` | Educational mode |

#### Task 1.3: Extend State Schema
**File:** `src/plugins/lib/state.ts` (MODIFY)
**Lines:** +10

Add to `getDefaultState()`:
```typescript
activeStyle: "default",
styleHistory: []
```

#### Task 1.4: Update Barrel Export
**File:** `src/plugins/lib/index.ts` (MODIFY)
**Lines:** +5

Add exports for new style functions.

---

### Phase 2: Plugin Hook Implementation (~6 hours)

#### Task 2.1: Add `experimental.chat.system.transform` Hook
**File:** `src/plugins/idumb-core.ts` (MODIFY)
**Location:** After line 332
**Lines:** +45

Use idempotency marker pattern with unique prefix.

#### Task 2.2: Extend Session Tracker Interface
**File:** `src/plugins/lib/types.ts` (MODIFY)
**Lines:** +5

```typescript
interface SessionTracker {
  // ... existing fields
  activeStyle?: string        // NEW
  styleCache?: StyleContent   // NEW
}
```

#### Task 2.3: Initialize Style in Session Created Event
**File:** `src/plugins/idumb-core.ts` (MODIFY)
**Location:** Line 149 (after getStallDetectionState)
**Lines:** +10

#### Task 2.4: Add Style to Compaction Context
**File:** `src/plugins/idumb-core.ts` (MODIFY)
**Location:** Line 325 (in compacting hook)
**Lines:** +8

**IMPORTANT:** Use minimal format, respect token budget.

#### Task 2.5: Add Cache Invalidation via Event
**File:** `src/plugins/idumb-core.ts` (MODIFY)
**Location:** In `event` handler, add case for `command.executed`
**Lines:** +12

```typescript
if (event.type === "command.executed") {
  const command = event.properties?.command || ""
  if (command.startsWith("idumb:style")) {
    for (const [sessionId, tracker] of sessionTrackers) {
      tracker.styleCache = undefined
    }
    log(directory, "[STYLE] Cache cleared after style change")
  }
}
```

---

### Phase 3: User Interface (~3 hours)

#### Task 3.1: Create Style Command
**File:** `src/commands/idumb/style.md` (NEW)
**Lines:** ~80

Follow existing command patterns from `status.md` and `init.md`.

#### Task 3.2: Create Style Tool
**File:** `src/tools/idumb-style.ts` (NEW)
**Lines:** ~100

Use named exports pattern:
```typescript
export const list = tool({...})
export const set = tool({...})
export const info = tool({...})
export const reset = tool({...})
export default { list, set, info, reset }
```

---

### Phase 4: Agent-Level Style Support (~2 hours)

#### Task 4.1: Add Style Parsing in system.transform Hook
**File:** `src/plugins/idumb-core.ts` (MODIFY)
**Lines:** +20

Parse `output-style:` from agent frontmatter when detected.

#### Task 4.2: Update 6 Key Agent Files
**Files:** (MODIFY each ~+10 lines)

| Agent | Style Format |
|-------|--------------|
| `idumb-supreme-coordinator.md` | governance-report |
| `idumb-builder.md` | implementation-summary |
| `idumb-verifier.md` | verification-report |
| `idumb-planner.md` | plan-specification |
| `idumb-debugger.md` | debug-analysis |
| `idumb-research-synthesizer.md` | research-synthesis |

---

### Phase 5: Session Flow Anchoring (~3 hours)

#### Task 5.1: Add New Anchor Type Constants
**File:** `src/plugins/lib/types.ts` (MODIFY)
**Lines:** +5

Extend anchor type union: `"decision" | "context" | "checkpoint" | "output_style" | "session_flow"`

#### Task 5.2: Implement Style Anchor Handler
**File:** `src/plugins/lib/state.ts` (MODIFY)
**Lines:** +30

**IMPORTANT:** Serialize anchor content to JSON string for compatibility.

```typescript
export function createStyleAnchor(directory: string, agent: string, style: string): void {
  const anchor: Anchor = {
    id: `style-${Date.now()}`,
    type: 'output_style',
    content: JSON.stringify({ agent, style }), // SERIALIZED
    priority: 'high',
    created: new Date().toISOString()
  }
  // Replace policy: one per agent
}
```

#### Task 5.3: Extend Session Tracker for Flow Tracking
**File:** `src/plugins/lib/types.ts` (MODIFY)
**Lines:** +5

```typescript
interface SessionTracker {
  // ... existing
  delegationChain?: string[]
  filesModified?: string[]
}
```

---

### Phase 6: Enforcement Skill (~2 hours)

#### Task 6.1: Create Output Style Enforcement Skill
**File:** `src/skills/output-style-enforcement/SKILL.md` (NEW) ← CORRECTED PATH
**Lines:** ~100

**IMPORTANT:** Skills don't autoload. They provide reference documentation for AI behavior. Actual enforcement happens in hooks via pattern detection.

**Realistic enforcement:**
- Section header detection (regex)
- Response length estimation (word count)
- Missing section warnings
- NO semantic analysis (too expensive/unreliable)

---

## Part 5: Implementation Order

### Critical Path

```
Phase 0 ──► Phase 1.1 ──► Phase 1.3 ──► Phase 2.1 ──► Phase 2.2 ──► Phase 3.1
(memory)    (styles.ts)   (state)      (hook)        (tracker)     (command)
                 │                         │
                 └─► Phase 1.2            └─► Phase 2.3 ──► Phase 2.4 ──► Phase 2.5
                    (style files)            (init)        (compaction)  (invalidation)
```

### Minimum Viable Implementation

**MVP (8 hours):** Phases 0, 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1
- Session cleanup
- Style library
- Default styles
- State extension
- System transform hook
- Session tracker extension
- Session init
- Basic command

**Nice-to-have:** 3.2 (tool), 4.x (agent styles), 5.x (anchoring), 6.x (enforcement)

---

## Part 6: Risk Register

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Memory leak without Phase 0 | CRITICAL | HIGH | Must complete Phase 0 first |
| Race condition in state.json | HIGH | MEDIUM | Atomic writes |
| Compaction context overflow | HIGH | MEDIUM | Token budget limits |
| Style file corruption | MEDIUM | LOW | Fallback to 'default' |
| Hook doesn't fire | MEDIUM | LOW | Runtime validation logging |
| False positive enforcement | LOW | MEDIUM | Use reminders, not blocks |

---

## Part 7: Verification Checklist

### Phase 0 Verification
- [ ] `cleanupStaleSessions()` called on session.idle
- [ ] No sessionTrackers growth after 24+ hours
- [ ] State.json writes use atomic pattern

### Phase 1 Verification
- [ ] `styles.ts` loads without console.log
- [ ] `parseStyleFile()` handles malformed YAML
- [ ] `.idumb/brain/styles/` created by installer

### Phase 2 Verification
- [ ] Style injected in system prompt (check logs)
- [ ] Idempotency marker prevents duplicates
- [ ] Style survives compaction
- [ ] Cache cleared on style change

### Phase 3 Verification
- [ ] `/idumb:style` lists available styles
- [ ] `/idumb:style verbose` changes active style
- [ ] `/idumb:style --reset` returns to default

---

## Appendix: Research Sources

### Files Analyzed
1. `src/plugins/idumb-core.ts` (955 lines)
2. `src/plugins/lib/` (11 files)
3. `.plugin-dev/plugins-and-tools-for-opencode-guidelines.md` (1227+ lines)
4. `.plugin-dev/opencode-plugins-and-tools-dev-best-practices.md` (1509+ lines)
5. `.plugin-dev/SKILL-INTEGRATION-GUIDE.md`
6. `.plugin-dev/SKILL-INVOCATION-PATTERNS.md`
7. `src/commands/idumb/` (19 commands)
8. `src/agents/` (23 agents)
9. `src/skills/` (10+ skills)

### Research Agents
1. **Phase 1-2 Researcher** - Core infrastructure and hooks
2. **Phase 3-4 Researcher** - UI and agent styles
3. **Phase 5-6 Researcher** - Anchoring and enforcement
4. **Skeptic Validator** - Critical review and risk identification

---

*Research synthesis complete. Ready for corrected plan creation and implementation.*
