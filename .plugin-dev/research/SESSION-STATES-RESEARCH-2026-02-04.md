# Session States Research

**Phase:** Plugin Development - Session State Management
**Research Date:** 2026-02-04
**Researcher:** @idumb-phase-researcher

---

## 1. Current Session Tracking Implementation

### 1.1 SessionTracker Interface (Lines 1030-1038)

```typescript
interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  delegationDepth: number
  parentSession: string | null
  violationCount: number
  governanceInjected: boolean
}
```

**Purpose:** In-memory tracking for active sessions.

**Storage:** `sessionTrackers = new Map<string, SessionTracker>()` (line 1041)

### 1.2 SessionMetadata Interface (Lines 1789-1806)

```typescript
interface SessionMetadata {
  sessionId: string
  createdAt: string
  lastUpdated: string
  phase: string
  governanceLevel: string
  delegationDepth: number
  parentSession: string | null
  language: {
    communication: string
    documents: string
  }
  // Enhanced lifecycle tracking
  compactedAt?: string
  contextSize?: string | number
  resumedAt?: string
  idleAt?: string
}
```

**Purpose:** Persistent metadata stored in `.idumb/brain/sessions/{sessionId}.json`

### 1.3 Session Events Currently Handled

| Event | Line | Handler Behavior |
|-------|------|-----------------|
| `session.created` | 2607 | Initialize tracker, ensure config, store metadata, init execution metrics, init stall detection |
| `session.idle` | 2661 | Archive stats to history, update metadata `lastUpdated`, cleanup tracker (keep metadata) |
| `session.compacted` | 2695 | Reset `governanceInjected=false`, update metadata with `compactedAt` and `contextSize` |
| `session.resumed` | 2731 | Re-initialize tracker, set `governanceInjected=false`, load previous metadata |

### 1.4 Delegation Tracking Implementation

**StallDetection Interface (Lines 125-140):**
```typescript
interface StallDetection {
  plannerChecker: {
    issuesHashHistory: string[]
    stallCount: number
    lastScore: number | null
    scoreHistory: number[]
  }
  validatorFix: {
    errorHashHistory: string[]
    repeatCount: number
  }
  delegation: {
    depth: number
    callStack: string[]
  }
}
```

**Delegation Depth Tracking (Lines 3074-3110):**
- Increments `tracker.delegationDepth++` on every `task` tool call
- Tracks in `stallDetectionState.delegation.depth` and `callStack`
- Max depth is 3 - triggers `EMERGENCY_HALT` if exceeded
- `popDelegationDepth()` function exists but **not called on task completion**

---

## 2. Five States Mapping (Current vs Required)

### Required States:

| State | Description | User Intervention |
|-------|-------------|-------------------|
| **S1: Beginning New Conversation** | Fresh conversation with no prior context | User at Level 1 |
| **S2: Compact Message Start Anew** | Context compacted, starting fresh with governance re-injection | User at Level 1 |
| **S3: Between-Turn** | After assistant's last message, waiting for user input | User at Level 1 |
| **S4: User Stops Before Completion** | User interrupts mid-execution (ESC, cancel, etc.) | User at Level 1 |
| **S5: New Session Manipulation** | Custom session creation/modification (our custom) | User at Level 1 |

### Current Implementation:

| State | Current Support | Gap Analysis |
|-------|-----------------|--------------|
| **S1** | ✅ Partial | `session.created` event triggers initialization. **GAP:** No explicit `sessionState` field tracking |
| **S2** | ✅ Partial | `session.compacted` event handled. **GAP:** No state transition tracking, no `previousState` preservation |
| **S3** | ⚠️ Minimal | `session.idle` event detected. **GAP:** Not distinguished from session end; no "between-turn" concept |
| **S4** | ❌ Missing | **GAP:** No `session.cancelled`, `session.interrupted`, or user-abort detection |
| **S5** | ⚠️ Minimal | Manual metadata creation possible (e.g., `ses_newproj_001.json`). **GAP:** No formal API or workflow |

### Detailed Gap Analysis:

#### S1: Beginning New Conversation
**Current:**
- `session.created` event fires → `storeSessionMetadata()` called
- Creates new tracker in `sessionTrackers` Map

**Missing:**
- No explicit `sessionState: "beginning"` field
- No distinction between true "new" vs "resuming after 48+ hours"
- No initial context anchors check

#### S2: Compact Message Start Anew
**Current:**
- `session.compacted` event fires → sets `governanceInjected=false`
- `compactedAt` timestamp stored
- `experimental.session.compacting` hook injects context

**Missing:**
- No `sessionState: "compacted"` field
- No tracking of what was lost in compaction
- No "compaction depth" counter (first compaction vs multiple)
- No pre-compaction checkpoint

#### S3: Between-Turn
**Current:**
- `session.idle` event fires (but this means session is ENDING, not between turns)
- No actual between-turn detection

**Missing:**
- OpenCode lacks `assistant.message.complete` event
- No way to detect "waiting for user input" state
- This may be infrastructure limitation, not plugin issue

#### S4: User Stops Before Completion
**Current:**
- **Completely unhandled**

**Missing:**
- No `session.cancelled` or `session.interrupted` event
- No rollback mechanism for partial execution
- No checkpoint on abort
- No "resume from interruption" capability
- Level 2/3 all sessions would be orphaned

#### S5: New Session Manipulation
**Current:**
- Manual JSON files can be created
- No formal API

**Missing:**
- No `createSession()` tool/function
- No `linkSession()` for parent-child relationships
- No `migrateSession()` for session handoffs
- No session hierarchy visualization

---

## 3. Three Delegation Levels Mapping (Current vs Required)

### Required Hierarchy:

```
Level 1: User ↔ Primary agent (supreme-coordinator)
    │    ← User CAN intervene here
    │
Level 2: Primary → all (high-governance, executor, etc.)
    │    ← User CANNOT intervene here
    │
Level 3: all → Leaf (builder, validator)
         ← User CANNOT intervene here
```

### Current Implementation:

| Level | Current Support | Gap Analysis |
|-------|-----------------|--------------|
| **Level 1** | ✅ Good | Primary session tracked, user interaction detected |
| **Level 2** | ⚠️ Partial | `delegationDepth` increments on `task` tool. **GAP:** No parent-child session linking, no session ID propagation |
| **Level 3** | ⚠️ Partial | Same tracking. **GAP:** Cannot distinguish L2 from L3; no leaf detection |

### Delegation Tracking Details:

**Current Code (Lines 3074-3110):**
```typescript
if (toolName === "task") {
  tracker.delegationDepth++
  
  trackDelegationDepth(sessionId, agent)  // Stall detection
  
  if (delegationResult.maxReached) {
    // Block at depth > 3
  }
}
```

**Current Data Structures:**

1. **SessionTracker.delegationDepth** (in-memory):
   - Increments on task spawn
   - Never decrements (bug: `popDelegationDepth()` exists but not called in `tool.execute.after`)
   
2. **StallDetection.delegation**:
   - `depth: number` - current depth
   - `callStack: string[]` - agent names

3. **SessionMetadata.delegationDepth** (persisted):
   - Always initialized to `0`
   - Never updated from actual delegation

**Missing:**

1. **Parent-Child Session Linking:**
   - When `supreme-coordinator` spawns `high-governance`, a new session is created
   - No `parentSession` ID propagation
   - Cannot trace: "which primary session spawned this all?"

2. **Level Detection:**
   - No way to determine: "is this session L1, L2, or L3?"
   - No `sessionLevel` field
   - Cannot enforce "user can only intervene at L1"

3. **Session Graph:**
   - No visualization of session relationships
   - No orphan detection
   - No cleanup of stale child sessions

4. **Depth Decrement:**
   - `popDelegationDepth()` exists (line 813)
   - **Never called!** Task completion in `tool.execute.after` (line 3191) doesn't pop

---

## 4. Gaps Identified

### Critical Gaps

| ID | Gap | Impact | Priority |
|----|-----|--------|----------|
| G1 | No explicit `sessionState` field | Cannot determine current state for state machine | **P0** |
| G2 | No user interruption detection (S4) | Orphaned all sessions, no rollback | **P0** |
| G3 | `popDelegationDepth()` never called | Depth counter keeps growing incorrectly | **P1** |
| G4 | No parent-child session linking | Cannot trace delegation graph | **P1** |
| G5 | L2/L3 sessions not distinguishable | Cannot enforce "user-L1-only" rule | **P1** |

### Medium Gaps

| ID | Gap | Impact | Priority |
|----|-----|--------|----------|
| G6 | No compaction history | Cannot tell first vs Nth compaction | **P2** |
| G7 | No between-turn detection | Limited S3 support | **P2** (may be infra limitation) |
| G8 | Session metadata not updated with real delegation depth | Persisted data inaccurate | **P2** |
| G9 | No formal session creation API | S5 requires manual JSON | **P2** |

### Low Gaps

| ID | Gap | Impact | Priority |
|----|-----|--------|----------|
| G10 | No session hierarchy visualization | DX issue, no runtime impact | **P3** |
| G11 | No orphan session cleanup | Disk usage, no runtime impact | **P3** |

---

## 5. State Transition Diagram (ASCII)

```
                                    USER ACTION SPACE (Level 1 Only)
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      PRIMARY SESSION (L1)                           │   │
│   │                                                                     │   │
│   │   ┌───────────┐   user_msg    ┌─────────────┐   tool_call          │   │
│   │   │    S1     │──────────────▶│     S3      │────────────┐         │   │
│   │   │ Beginning │               │ Between-Turn│            │         │   │
│   │   └───────────┘               └─────────────┘            │         │   │
│   │         │                           ▲  ▲                 ▼         │   │
│   │         │                           │  │         ┌─────────────┐   │   │
│   │         │ compaction                │  │         │  EXECUTING  │   │   │
│   │         ▼                           │  │         │             │   │   │
│   │   ┌───────────┐   user_msg          │  │         │ L2 spawned  │   │   │
│   │   │    S2     │─────────────────────┘  │         └──────┬──────┘   │   │
│   │   │ Compacted │                        │                │         │   │
│   │   └───────────┘                        │                │         │   │
│   │         │                              │                │         │   │
│   │         │ 48h+ idle                    │ done           │ ESC/    │   │
│   │         ▼                              │                │ cancel  │   │
│   │   ┌───────────┐     resume             │                │         │   │
│   │   │  STALE    │────────────────────────┘                │         │   │
│   │   └───────────┘                                         │         │   │
│   │                                                         │         │   │
│   │   ┌───────────┐◀────────────────────────────────────────┘         │   │
│   │   │    S4     │   user_interrupt                                  │   │
│   │   │ Stopped   │──────────────────▶ [ROLLBACK? CHECKPOINT?]        │   │
│   │   └───────────┘                                                   │   │
│   │                                                                     │   │
│   │   ┌───────────┐   /idumb:new-session                               │   │
│   │   │    S5     │   (custom command)                                 │   │
│   │   │ Custom    │──────────────────▶ [CREATE LINKED SESSION]         │   │
│   │   └───────────┘                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

                        AGENT-ONLY SPACE (No User Intervention)
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    all SESSIONS (L2)                           │   │
│   │                                                                     │   │
│   │   supreme-coordinator ───task()───▶ high-governance (new session)  │   │
│   │                        ├──task()───▶ executor (new session)        │   │
│   │                        └──task()───▶ planner (new session)         │   │
│   │                                                                     │   │
│   │   State transitions:                                                │   │
│   │     - created → executing → completed/failed                        │   │
│   │     - NO user interaction events                                    │   │
│   │     - NO compaction (short-lived)                                   │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      LEAF SESSIONS (L3)                             │   │
│   │                                                                     │   │
│   │   executor ───task()───▶ builder (new session)                     │   │
│   │            └──task()───▶ validator (new session)                   │   │
│   │                                                                     │   │
│   │   State transitions:                                                │   │
│   │     - created → executing → completed/failed                        │   │
│   │     - TERMINAL nodes (cannot delegate further)                      │   │
│   │     - Shortest lifespan                                            │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

LEGEND:
  ───────▶  State transition
  ────task()────▶  Delegation via task tool
  [BRACKET]  Missing/Gap
  S1-S5  Five session states
  L1-L3  Delegation levels
```

---

## 6. Recommended Fixes

### 6.1 Immediate Fixes (P0-P1)

#### Fix G1: Add Explicit Session State Field

**Change SessionMetadata:**
```typescript
interface SessionMetadata {
  // ... existing fields ...
  
  // NEW: Explicit state tracking
  sessionState: SessionState
  previousState: SessionState | null
  stateHistory: { state: SessionState; timestamp: string }[]
}

type SessionState = 
  | "beginning"      // S1: Fresh conversation
  | "compacted"      // S2: After compaction
  | "between_turn"   // S3: Waiting for user
  | "executing"      // Active tool use
  | "interrupted"    // S4: User stopped
  | "custom"         // S5: Manipulated session
  | "idle"           // No activity
  | "stale"          // >48 hours idle
```

#### Fix G3: Call popDelegationDepth on Task Completion

**In tool.execute.after (around line 3191):**
```typescript
if (toolName === "task") {
  // ... existing code ...
  
  // FIX: Pop delegation depth
  popDelegationDepth(sessionId)
  
  // Update metadata with real depth
  const metadata = loadSessionMetadata(directory, sessionId)
  if (metadata) {
    const tracker = sessionTrackers.get(sessionId)
    metadata.delegationDepth = tracker?.delegationDepth || 0
    // ... save metadata ...
  }
}
```

#### Fix G4: Parent-Child Session Linking

**In task tool before hook (around line 3074):**
```typescript
if (toolName === "task") {
  const childSessionId = output.args?.session_id  // May need to track differently
  
  // Store parent-child relationship
  const parentMetadata = loadSessionMetadata(directory, sessionId)
  if (parentMetadata) {
    parentMetadata.childSessions = parentMetadata.childSessions || []
    parentMetadata.childSessions.push({
      sessionId: childSessionId,
      agent: output.args?.all_type,
      createdAt: new Date().toISOString()
    })
    // ... save ...
  }
  
  // When child session created, set parentSession
  // This requires knowing the child session ID which may not be available
  // until the task tool actually runs
}
```

#### Fix G5: Session Level Detection

**Add to SessionMetadata:**
```typescript
interface SessionMetadata {
  // ... existing fields ...
  
  // NEW: Delegation level
  sessionLevel: 1 | 2 | 3
}
```

**Determine level based on:**
- L1: `parentSession === null`
- L2: `parentSession !== null` AND `parentAgentRole` is coordinator
- L3: `parentSession !== null` AND `parentAgentRole` is all (executor, etc.)

### 6.2 Medium-Term Fixes (P2)

#### Fix G2: User Interruption Detection

**Challenge:** OpenCode doesn't provide `session.interrupted` event.

**Workarounds:**
1. **Heartbeat detection:** Track last activity timestamp; if session ends without `session.idle`, infer interruption
2. **Command hook:** If `/cancel` or ESC detected (if OpenCode exposes this)
3. **Checkpoint on every tool call:** Expensive but enables rollback

**Proposed:**
```typescript
// In tool.execute.before
if (shouldCreateCheckpoint(toolName, tracker.delegationDepth)) {
  createCheckpoint(directory, phase, currentTask)
}

// In session.idle - check if last action was incomplete
if (lastActionIncomplete) {
  handleInterruption(sessionId, directory)
}
```

#### Fix G6: Compaction History

```typescript
interface SessionMetadata {
  // ... existing fields ...
  
  compactionHistory: {
    timestamp: string
    contextSizeBefore: number
    contextSizeAfter: number
    anchorsSurvived: string[]
  }[]
}
```

### 6.3 Long-Term Fixes (P3)

#### Fix G9: Session Creation API

**New tool: `idumb-session_create`**
```typescript
export const sessionCreate = tool({
  name: "idumb-session_create",
  parameters: z.object({
    parentSessionId: z.string().optional(),
    agent: z.string(),
    phase: z.string().optional(),
    purpose: z.string()
  }),
  execute: async ({ parentSessionId, agent, phase, purpose }, { directory }) => {
    const sessionId = generateSessionId()
    const metadata: SessionMetadata = {
      sessionId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      phase: phase || "custom",
      sessionState: "custom",
      sessionLevel: parentSessionId ? 2 : 1,
      parentSession: parentSessionId || null,
      // ... etc
    }
    storeSessionMetadata(directory, sessionId)
    return { sessionId, success: true }
  }
})
```

---

## 7. Implementation Priority

| Priority | Gap IDs | Effort | Impact |
|----------|---------|--------|--------|
| **Sprint 1** | G1, G3 | Low | High |
| **Sprint 2** | G4, G5, G8 | Medium | High |
| **Sprint 3** | G2, G6 | High | Medium |
| **Backlog** | G7, G9, G10, G11 | Medium | Low |

---

## 8. Sources

1. `/Users/apple/Documents/coding-projects/idumb/template/plugins/idumb-core.ts`:
   - Lines 1030-1038: SessionTracker interface
   - Lines 1041: sessionTrackers Map
   - Lines 1789-1806: SessionMetadata interface
   - Lines 1812-1851: storeSessionMetadata function
   - Lines 2607-2746: Session event handlers
   - Lines 125-140: StallDetection interface
   - Lines 688-710: stallDetectionState initialization
   - Lines 797-811: trackDelegationDepth function
   - Lines 813-819: popDelegationDepth function (never called!)
   - Lines 3074-3110: Task delegation tracking
   - Lines 3188-3197: Task completion handling (missing pop)

2. Session metadata samples:
   - `.idumb/brain/sessions/ses_3df5bab97ffe5TUBJ7KEU2z6x8.json`
   - `.idumb/brain/sessions/ses_newproj_001.json`

---

**Research Complete:** 2026-02-04T12:00:00.000Z
