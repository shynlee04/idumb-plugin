# Session States & Delegation Hierarchy Governance

**Version:** 1.0.0  
**Created:** 2026-02-04  
**Source:** P1-SESSION-STATES implementation task  
**Reference:** PERMISSION-ENTITIES-DEEP-DIVE-2026-02-04.md

---

## Overview

This document defines the governance rules for **5 session states** and **3 delegation hierarchy levels** in the iDumb framework. These rules determine:

1. What context is injected at each state
2. What hooks fire and when
3. What tracking occurs
4. What enforcement actions are possible

---

## 1. Session States (5 States)

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
| S1-R08 | Set `sessionLevel: 1` (primary) | MANDATORY |

**Injection Content:**
- Language enforcement (ABSOLUTE PRIORITY - survives compaction)
- Role-specific rules (NEVER execute, ALWAYS delegate, etc.)
- First action required based on role
- Current phase and framework context
- TODO count and stale state warnings

**Hooks Active:**
- `event.session.created` - Full initialization
- `experimental.chat.messages.transform` - Governance prefix injection

**Example Governance Prefix:**
```markdown
## iDumb Governance Context

**Language:** English (communication), English (documents)
**Role:** idumb-supreme-coordinator (PRIMARY)
**Phase:** planning

### Your Constraints:
1. NEVER execute work directly - ALWAYS delegate
2. MUST read todolist before any action
3. MUST check state before delegating

### First Action Required:
- Use `todoread` to check current tasks
- Use `idumb-state` to verify governance state
```

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
| S2-R06 | Include hierarchy reminder | MANDATORY |
| S2-R07 | Set `sessionState: "compacted"` | MANDATORY |
| S2-R08 | Track compaction in `compactionHistory` | MANDATORY |

**Injection Content:**
- Post-compaction reminder appended to last message part
- Language settings (CRITICAL - MUST survive)
- Recent history summary
- Active anchors (critical/high priority only)
- Current phase context

**Hooks Active:**
- `experimental.session.compacting` - Inject anchors/history
- `experimental.chat.messages.transform` - Post-compact reminder
- `event.session.compacted` - Reset `governanceInjected` flag

**Example Post-Compact Reminder:**
```markdown
## Post-Compaction Context Recovery

**Language:** English (MUST MAINTAIN)
**Phase:** implementation
**Last 3 Actions:**
1. Created PLAN.md for phase 2
2. Delegated to idumb-builder for file creation
3. Verified completion

**Critical Anchors:**
- [ANCHOR-001] User prefers TypeScript over JavaScript
- [ANCHOR-002] Must use ESM imports

**Recommended Next:**
- Check todoread for pending tasks
- Verify last action completed successfully
```

---

### S3: Between-Turn After Assistant Message

**Detection Logic:**
```typescript
// Normal flow - no special detection
// Governance already injected, hooks fire normally
```

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S3-R01 | All tool hooks fire normally | AUTOMATIC |
| S3-R02 | Tool interception active | AUTOMATIC |
| S3-R03 | Violations logged (LOG-ONLY mode) | TRACKING |
| S3-R04 | Delegation depth tracked on task spawn | MANDATORY |
| S3-R05 | First tool enforcement checked | TRACKING |
| S3-R06 | Set `sessionState: "between_turn"` | RECOMMENDED |

**Injection Content:**
- None during normal turns (already injected at session start)

**Hooks Active:**
- `permission.ask` - LOG-ONLY (due to OpenCode bug #7006)
- `tool.execute.before` - First tool tracking, delegation depth
- `tool.execute.after` - Output replacement (if shouldBlock=true)
- `command.execute.before` - Chain enforcement

**Note:** This is the "steady state" where most work happens. Governance prefix was already injected in S1 or S2.

---

### S4: User Stops Action Before Completion

**Detection Logic:**
```typescript
// Via session.idle event - best-effort detection
if (event.type === "session.idle") {
  // User likely stopped or navigated away
}
```

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| S4-R01 | Archive session stats to history | MANDATORY |
| S4-R02 | Update session metadata with idle timestamp | MANDATORY |
| S4-R03 | Clean up session tracker (keep metadata for resumption) | MANDATORY |
| S4-R04 | Log violations encountered | TRACKING |
| S4-R05 | Set `sessionState: "interrupted"` | RECOMMENDED |
| S4-R06 | Preserve anchors for potential resumption | MANDATORY |

**Injection Content:**
- None (session is ending)

**Hooks Active:**
- `event.session.idle` - Cleanup and archival

**Resumption Handling:**
- Metadata preserved for 48 hours
- If resumed within 48 hours → Treated as S5 (resumption)
- If resumed after 48 hours → Treated as S1 (new session)

**Example Metadata Update:**
```json
{
  "sessionId": "abc-123",
  "sessionState": "interrupted",
  "idleAt": "2026-02-04T10:30:00Z",
  "lastUpdated": "2026-02-04T10:30:00Z",
  "violationCount": 2,
  "delegationDepth": 0,
  "phase": "implementation"
}
```

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
| S5-R08 | NEVER intercept lower delegation resumptions | CRITICAL |

**Critical Rule S5-R08 Explanation:**
When a all session (Level 2+) resumes, the plugin MUST NOT inject governance as if it's a new primary session. Detection must check `sessionLevel` before injecting.

```typescript
// CORRECT: Check session level before injection
if (isResumedSession && sessionLevel === 1) {
  // Inject governance - this is a primary session resumption
  governancePrefix = buildResumeContext() + buildGovernancePrefix()
} else if (isResumedSession && sessionLevel >= 2) {
  // DO NOT inject governance - this is a all continuing work
  log("all resumption detected - skipping governance injection")
}
```

**Injection Content:**
- `buildResumeContext()` + `buildGovernancePrefix()` combined
- Idle duration context
- Previous session state summary
- Active anchors

**Hooks Active:**
- `event.session.resumed` - Re-initialize tracker
- `experimental.chat.messages.transform` - Resume + governance injection

---

## 2. Delegation Hierarchy (3 Levels)

### Level 0: User ↔ Primary Agent (Coordinator)

**Scope:** Direct user interaction with entry-point agent

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| L0-R01 | User has FULL control (can cancel anytime) | GUARANTEED |
| L0-R02 | All hooks ACTIVE | MANDATORY |
| L0-R03 | Complete interception possible | AVAILABLE |
| L0-R04 | Full governance prefix injected | MANDATORY |
| L0-R05 | Chain enforcement active | MANDATORY |
| L0-R06 | `sessionLevel: 1` in metadata | MANDATORY |

**Agents at Level 0:**
- `idumb-supreme-coordinator` (mode: primary)

**Permission Profile:**
```yaml
permission:
  task:
    "idumb-high-governance": allow
    "idumb-mid-coordinator": allow
    "idumb-executor": allow
    # ... other allowed targets
    # NO "*": deny - implicit deny for unspecified
  bash:
    "git status": allow
    "git log --oneline -5": allow
    # NO "*": deny
  edit: deny
  write: deny
```

**Tools Available:**
- Tier 1: task, todoread, read, glob, grep
- All idumb-* tools
- NO write/edit tools

**User Visibility:** 
- User sees ALL messages and tool calls
- User can interrupt via Escape key
- User can modify agent instructions

---

### Level 1: First Delegation (all)

**Scope:** First all spawned by coordinator

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| L1-R01 | User CAN stop (via Escape in OpenCode) | GUARANTEED |
| L1-R02 | Full hooks + delegation tracking | MANDATORY |
| L1-R03 | Tool interception active | MANDATORY |
| L1-R04 | Output can be replaced | AVAILABLE |
| L1-R05 | `tracker.delegationDepth++` on spawn | MANDATORY |
| L1-R06 | `trackAgentSpawn()` updates metrics | MANDATORY |
| L1-R07 | Set `parentSession` link | MANDATORY |
| L1-R08 | `sessionLevel: 2` in metadata | MANDATORY |

**Agents at Level 1:**
- `idumb-high-governance` (mode: all)
- `idumb-mid-coordinator` (mode: all)
- `idumb-executor` (mode: all)
- `idumb-planner` (mode: all)
- `idumb-verifier` (mode: all)
- Other Tier 1/2 agents

**Permission Profile (Example: idumb-executor):**
```yaml
permission:
  task:
    "idumb-builder": allow
    "idumb-low-validator": allow
    "general": allow
    # NO "*": deny
  bash:
    "git status": allow
    "git diff*": allow
    "npm test*": allow
    "pnpm test*": allow
    # NO "*": deny
  edit: deny
  write: deny
```

**User Visibility:**
- User sees task delegation in UI
- User can interrupt all work
- User CANNOT see all's internal tool calls directly

**Parent-Child Linking:**
```typescript
// On task spawn (tool.execute.before)
if (toolName === "task") {
  const childSessionId = generateChildSessionId()
  
  // Update child metadata
  storeSessionMetadata(directory, childSessionId, {
    ...baseMetadata,
    sessionLevel: 2,
    parentSession: parentSessionId,
    sessionState: "beginning"
  })
  
  // Update parent metadata
  const parentMeta = loadSessionMetadata(directory, parentSessionId)
  parentMeta.childSessions = parentMeta.childSessions || []
  parentMeta.childSessions.push({
    sessionId: childSessionId,
    agent: targetAgent,
    createdAt: new Date().toISOString()
  })
}
```

---

### Level 2+: Nested Delegations (Opaque)

**Scope:** alls spawning alls (depth 2-3)

**Governance Rules:**

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| L2-R01 | User control is OPAQUE (doesn't see work directly) | REALITY |
| L2-R02 | Enforcement is LOG ONLY (current implementation) | TRACKING |
| L2-R03 | Interception limited to logging | LIMITED |
| L2-R04 | Max depth: 3 (hard limit) | ENFORCED |
| L2-R05 | Violation triggers EMERGENCY_HALT | MANDATORY |
| L2-R06 | `popDelegationDepth()` on task completion | CRITICAL |
| L2-R07 | `sessionLevel: 3` for deepest level | MANDATORY |

**Max Depth Enforcement:**
```typescript
// In tool.execute.before
if (toolName === "task") {
  const delegationResult = trackDelegationDepth(sessionId, agent)
  
  if (delegationResult.maxReached) {
    // Depth is at 3 - BLOCK THIS DELEGATION
    const haltMessage = triggerEmergencyHalt(
      directory, sessionId,
      "MAX_DELEGATION_DEPTH_EXCEEDED",
      { depth: delegationResult.depth, maxAllowed: 3 }
    )
    
    output.args = {
      __BLOCKED_BY_GOVERNANCE__: true,
      __VIOLATION__: "Maximum delegation depth exceeded (max: 3)",
      __HALT_MESSAGE__: haltMessage
    }
    return  // STOP - do not allow delegation
  }
}
```

**Depth Pop on Completion (CRITICAL FIX):**
```typescript
// In tool.execute.after (line 3195)
if (toolName === "task") {
  // FIX: Pop delegation depth when task completes
  popDelegationDepth(sessionId)
  
  // Log for verification
  const currentDepth = stallDetectionState.get(sessionId)?.delegation.depth || 0
  log(directory, `Task completed, depth now: ${currentDepth}`)
}
```

**Agents at Level 2+:**
- `idumb-builder` (mode: all, LEAF - cannot delegate)
- `idumb-low-validator` (mode: all, LEAF - cannot delegate)
- Any agent spawned by a Level 1 agent

**Leaf Node Enforcement:**
```yaml
# Builder and Validator are LEAF NODES
# They CANNOT use task tool

# idumb-builder permission
permission:
  # NO task permission = cannot delegate
  bash:
    "*": allow
    "rm -rf /": deny
    "sudo *": deny
  edit: allow
  write: allow

# idumb-low-validator permission
permission:
  # NO task permission = cannot delegate
  bash:
    "grep*": allow
    "find*": allow
    "ls*": allow
    "cat*": allow
  edit: deny
  write: deny
```

---

## 3. State Transition Matrix

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

## 4. Delegation Depth Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DELEGATION DEPTH TRACKING                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  depth=0    USER ←─────────────────────────────────────→ COORDINATOR     │
│             (Level 0: Full control)                      (PRIMARY)       │
│                                          │                               │
│                                          │ task spawn                    │
│                                          │ depth++ → depth=1             │
│                                          ▼                               │
│  depth=1    USER ←──────────(can stop)──→ GOVERNANCE / EXECUTOR          │
│             (Level 1: User can stop)     (all)                      │
│                                          │                               │
│                                          │ task spawn                    │
│                                          │ depth++ → depth=2             │
│                                          ▼                               │
│  depth=2    USER ←──(opaque)───────────→ VERIFIER / PLANNER              │
│             (Level 2: Limited visibility)(all)                      │
│                                          │                               │
│                                          │ task spawn                    │
│                                          │ depth++ → depth=3             │
│                                          ▼                               │
│  depth=3    USER ←──(opaque)───────────→ BUILDER / VALIDATOR             │
│             (Level 2+: Max depth)        (LEAF - cannot delegate)        │
│                                          │                               │
│                                          │ task spawn ATTEMPT            │
│                                          ▼                               │
│  depth=4   ████████ BLOCKED BY EMERGENCY HALT █████████                  │
│            MAX_DELEGATION_DEPTH_EXCEEDED                                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  ON TASK COMPLETION:                                                     │
│                                                                          │
│  depth=3 → task completes → popDelegationDepth() → depth=2               │
│  depth=2 → task completes → popDelegationDepth() → depth=1               │
│  depth=1 → task completes → popDelegationDepth() → depth=0               │
│                                                                          │
│  CRITICAL: popDelegationDepth() MUST be called in tool.execute.after     │
│            when toolName === "task" to prevent depth from growing        │
│            indefinitely and triggering false EMERGENCY_HALT events.      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Checklist

### Session State Implementation

- [x] S1: Beginning detection implemented (line 2813)
- [x] S1: Governance prefix injection (line 2835)
- [x] S2: Compaction detection with 3 methods (lines 2850-2893)
- [x] S2: Post-compact reminder injection (line 2911)
- [x] S3: Normal hook flow (automatic)
- [x] S4: Session idle handling (line 2661)
- [x] S5: Resumed session detection (checkIfResumedSession)
- [x] S5: Resume context builder (buildResumeContext)
- [ ] S5-R08: Prevent all resumption injection (NEEDS IMPLEMENTATION)

### Delegation Hierarchy Implementation

- [x] L0: Primary agent detection
- [x] L1: Delegation depth increment (line 3078)
- [x] L1: Agent spawn tracking (line 3081)
- [x] L2+: Max depth enforcement (lines 3087-3109)
- [x] L2+: popDelegationDepth() call (line 3195 - FIXED)
- [ ] Parent-child session linking (NEEDS IMPLEMENTATION)
- [ ] sessionLevel field in metadata (NEEDS IMPLEMENTATION)

---

## 6. Validation Tests

```bash
# Test S1: Beginning New Conversation
1. Start new session with idumb-supreme-coordinator
2. Verify governance prefix injected in first user message
3. Verify sessionState: "beginning" in metadata

# Test S2: Compaction Detection
1. Trigger context compaction (or simulate with keywords)
2. Verify post-compact reminder appended
3. Verify compactionHistory updated

# Test S3: Between-Turn
1. Send multiple messages after S1
2. Verify no duplicate governance injection
3. Verify tool hooks fire normally

# Test S4: User Interruption
1. Start task, press Escape to cancel
2. Verify session.idle event fires
3. Verify sessionState: "interrupted" in metadata

# Test S5: Session Resumption
1. Create session, wait 1+ hours
2. Resume session
3. Verify resume context + governance injected
4. Verify NOT injected for Level 2+ all resumption

# Test Delegation Depth
1. Spawn task (depth should go 0→1)
2. Complete task (depth should go 1→0)
3. Verify no false EMERGENCY_HALT
```

---

*Document generated for P1-SESSION-STATES task - 2026-02-04*
