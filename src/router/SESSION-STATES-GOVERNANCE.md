# Session States & Agent Delegation Governance

**Version:** 2.1.0
**Created:** 2026-02-04
**Updated:** 2026-02-04
**Phase:** 1 (Active)

---

## Overview

This document defines the governance rules for **5 session states** and **2 agent categories** in the iDumb framework.

**Critical Principle:** There are NO "subagents" with restricted capabilities. However, agents are separated into **META** (framework management) and **PROJECT** (user code work) categories with appropriate permissions.

---

## 1. Agent Categories (2 Categories)

### META Agents

**Purpose:** Manage iDumb framework itself (config, state, checkpoints)

**Scope:** Restricted to `.idumb/` and `.opencode/` directories

**Agents:**
- `idumb-meta-builder` - Only META agent that can write/edit framework files
- `idumb-meta-validator` - Validates framework state (read-only)
- `idumb-supreme-coordinator` - Entry-point coordinator (delegation only)
- `idumb-high-governance` - Mid-level coordinator (delegation only)

**Permissions:**
- Can read framework files
- `idumb-meta-builder` ONLY agent that can write/edit framework files
- Coordinators delegate, do not execute directly

### PROJECT Agents

**Purpose:** Work on user's actual project code

**Scope:** User project directory (excluding `.idumb/`, `.opencode/`)

**Agents:**
- `idumb-project-executor` - Executes project code tasks
- `idumb-project-coordinator` - Coordinates project workflows
- `idumb-project-validator` - Validates project code quality
- `idumb-project-explorer` - Explores project codebase

**Permissions:**
- Can read project files (grep, glob, read across entire codebase)
- `idumb-project-executor` can write/edit user code
- Can further delegate via `task()` tool
- NO depth restrictions on delegation

**Key Rule:** The distinction is about **scope** (framework vs user code), not depth. Any agent can delegate to any other agent regardless of "level."

---

## 2. Session States (5 States)

### S1: Beginning New Conversation

**Detection Logic:**
```typescript
const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
```

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S1-R01 | Initialize session tracker | MANDATORY |
| S1-R02 | Ensure config exists (auto-generate if missing) | MANDATORY |
| S1-R03 | Store session metadata with phase info | MANDATORY |
| S1-R04 | Initialize execution metrics | MANDATORY |
| S1-R05 | Initialize stall detection state | MANDATORY |
| S1-R06 | Inject governance prefix via `buildGovernancePrefix()` | MANDATORY |
| S1-R07 | Set `sessionState: "beginning"` | MANDATORY |

**Injection Content:**
- Language enforcement (ABSOLUTE PRIORITY - survives compaction)
- Role-specific rules (META vs PROJECT scope)
- First action required based on role
- Current phase and framework context
- TODO count and stale state warnings

---

### S2: Compact Message (Innate OR Manipulated)

**Detection Logic:**
```typescript
const compactionIndicators = [
  'compacted', 'summary of our conversation', 'context has been compacted',
  'previous messages have been summarized', 'conversation summary',
  'context window', 'memory has been compacted', 'session compacted'
]
const contextLossIndicators = [
  "i'll need you to provide", "can you remind me", "what were we working on",
  "i don't have context", "please provide context"
]
const hasLowMessageCount = output.messages.length < 5 && tracker.governanceInjected

const isCompacted = hasCompactionKeyword || hasContextLossIndicator || hasLowMessageCount
```

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S2-R01 | Inject `buildPostCompactReminder()` to last message | MANDATORY |
| S2-R02 | Language enforcement MUST survive compaction | CRITICAL |
| S2-R03 | Include recent history (last 3 actions) | MANDATORY |
| S2-R04 | Include critical anchors | MANDATORY |
| S2-R05 | Include recommended next steps | RECOMMENDED |
| S2-R06 | Set `sessionState: "compacted"` | MANDATORY |
| S2-R07 | Track compaction in `compactionHistory` | MANDATORY |

---

### S3: Between-Turn After Assistant Message

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S3-R01 | All tool hooks fire normally | AUTOMATIC |
| S3-R02 | Tool interception active | AUTOMATIC |
| S3-R03 | Violations logged (LOG-ONLY mode currently) | TRACKING |
| S3-R04 | Agent spawn tracking on task() call | MANDATORY |
| S3-R05 | First tool enforcement checked | TRACKING |
| S3-R06 | Set `sessionState: "between_turn"` | RECOMMENDED |

---

### S4: User Stops Action Before Completion

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S4-R01 | Archive session stats to history | MANDATORY |
| S4-R02 | Update session metadata with idle timestamp | MANDATORY |
| S4-R03 | Clean up session tracker (keep metadata for resumption) | MANDATORY |
| S4-R04 | Log violations encountered | TRACKING |
| S4-R05 | Set `sessionState: "interrupted"` | RECOMMENDED |
| S4-R06 | Preserve anchors for potential resumption | MANDATORY |

---

### S5: New Session Manipulation / Resumption

**Detection Logic:**
```typescript
function checkIfResumedSession(sessionId: string, directory: string): boolean {
  const metadata = loadSessionMetadata(directory, sessionId)
  if (metadata) {
    const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60)
    return hoursSinceUpdate > 1 && hoursSinceUpdate < 48  // Idle 1-48 hours
  }
  return false
}
```

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S5-R01 | Prepend resume context BEFORE governance prefix | MANDATORY |
| S5-R02 | Include idle duration in context | MANDATORY |
| S5-R03 | Include previous session timestamp | MANDATORY |
| S5-R04 | Include active anchors | MANDATORY |
| S5-R05 | Re-initialize session tracker | MANDATORY |
| S5-R06 | Force `governanceInjected = false` for re-injection | MANDATORY |
| S5-R07 | Set `sessionState: "beginning"` (fresh start) | MANDATORY |

---

## 3. What Was Removed (v2.0.0)

The following concepts were **removed** as they did not reflect reality:

### Removed: Delegation Hierarchy Levels
- ~~Level 0: User ↔ Primary Agent~~
- ~~Level 1: First Delegation~~
- ~~Level 2+: Nested Delegations (Opaque)~~

### Removed: Max Depth Enforcement
- ~~Max depth: 3 (hard limit)~~
- ~~EMERGENCY_HALT on depth exceeded~~
- ~~Depth tracking and pop logic~~

### Removed: Leaf Node Concept
- ~~Builder/Validator as "LEAF - cannot delegate"~~

### Removed: Session Level Detection
- ~~detectallSession()~~
- ~~sessionLevel field~~
- ~~Parent-child session linking~~

### Removed (v2.1.0): Mode-based permissions
- ~~"mode: all can update anything"~~ - Replaced with META/PROJECT scope

### Why These Were Wrong

1. **Delegation chains are not hierarchical** - A delegated agent has same delegation capabilities
2. **User can stop any agent** - The Escape key works at any depth
3. **Depth limits prevent valid workflows** - Sometimes you need deeper delegation chains
4. **"Subagent" terminology was inaccurate** - There are only META and PROJECT agents
5. **"Mode-based" permissions were too broad** - Need scope-based (META vs PROJECT)

---

## 4. What Remains (Corrected in v2.1.0)

### Valid Governance Concepts

1. **Session State Tracking** - Beginning, compacted, between-turn, interrupted, resumed
2. **Agent Category Detection** - META vs PROJECT (for scope permissions)
3. **First Tool Enforcement** - Ensuring agents read state before acting
4. **Compaction Recovery** - Re-injecting context after compaction
5. **Language Enforcement** - Surviving compaction to maintain user preferences
6. **Scope-Based Permissions** - META agents (framework) vs PROJECT agents (user code)

### Stall Detection (Still Valid)

- Planner-checker stalls (unchanged issues, no score improvement)
- Validator-fix stalls (same error repeated)
- Error limits (total errors exceeded)

These detect **actual loops**, not delegation depth.

---

## 5. Phase 1 Alignment

This document (v2.1.0) aligns with Phase 1 requirements:

| Phase 1 Requirement | Alignment | Status |
|---------------------|-----------|--------|
| "Builder is only agent that can write/edit" | idumb-meta-builder ONLY writes framework files | ✅ ALIGNED |
| "Meta and project agents clearly separated" | META vs PROJECT categories defined | ✅ ALIGNED |
| "No subagents" | Terminology removed | ✅ ALIGNED |
| "Project agents can write user code" | idumb-project-executor can write user code | ✅ ALIGNED |

---

## 6. State Transition Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SESSION STATE TRANSITIONS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐                                                           │
│   │   S1     │ ───────────────────────────────────────────┐              │
│   │Beginning │                                            │              │
│   └────┬─────┘                                            │              │
│        │                                                  │              │
│        │ [governance injected]                            │              │
│        ▼                                                  │              │
│   ┌──────────┐          [compaction]          ┌──────────┐│              │
│   │   S3     │ ─────────────────────────────▶ │   S2     ││              │
│   │Between   │                                │Compacted ││              │
│   │  Turn    │ ◀───────────────────────────── │          ││              │
│   └────┬─────┘     [reminder injected]        └──────────┘│              │
│        │                                                  │              │
│        │ [user stops / idle timeout]                      │              │
│        ▼                                                  │              │
│   ┌──────────┐                                            │              │
│   │   S4     │                                            │              │
│   │Interrupt │                                            │              │
│   └────┬─────┘                                            │              │
│        │                                                  │              │
│        │ [resume 1-48 hours]        [resume >48 hours]    │              │
│        ▼                                   │              │              │
│   ┌──────────┐                             │              │              │
│   │   S5     │                             └──────────────┘              │
│   │Resumed   │ ──────────────────────────────────────────▶ S1            │
│   └──────────┘          [becomes S1 with resume context]                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Document updated for v2.1.0 - Aligned with Phase 1 requirements - 2026-02-04*
