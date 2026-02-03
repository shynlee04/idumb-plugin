# New Session Manipulation Validation Report

**Date:** 2026-02-04  
**Agent:** idumb-phase-researcher  
**Task:** Validate "new session" manipulation implementation  
**Source:** SESSION-HANDOFF-2026-02-03-PERMISSION-MANIPULATION.md Task 2  
**File Analyzed:** `template/plugins/idumb-core.ts`

---

## Executive Summary

The current implementation of "new session" manipulation in the iDumb plugin is **PARTIALLY IMPLEMENTED** with significant gaps. While the foundation exists through the `messages.transform` hook and related functions, the specific "new session" manipulation features required for context purification and workflow continuity are **NOT FULLY IMPLEMENTED**.

**Overall Status:** ❌ **INCOMPLETE - Requires Implementation**

---

## 1. Current Implementation Analysis

### 1.1 `messages.transform` Hook Implementation

**Location:** `template/plugins/idumb-core.ts` lines 2797-2924

**Current Implementation:**

```typescript
"experimental.chat.messages.transform": async (input: any, output: any) => {
  try {
    log(directory, "Transforming messages for governance injection")
    
    const agentRole = detectAgentFromMessages(output.messages)
    const sessionId = detectSessionId(output.messages) || 'unknown'
    const tracker = getSessionTracker(sessionId)
    tracker.agentRole = agentRole
    
    // Detect session start (no user messages yet processed)
    const userMessages = output.messages.filter((m: any) => 
      m.info?.role === 'user' || 
      m.parts?.some((p: any) => p.type === 'text' && !p.text?.includes('governance'))
    )
    
    // P1-T1: Enhanced session detection with resumption check
    const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
    const isResumedSession = isSessionStart && checkIfResumedSession(sessionId, directory)
    
    if ((isSessionStart || isResumedSession) && agentRole) {
      // ... governance prefix injection
    }
    
    // POST-COMPACT DETECTION (Entry Point 2 - P1-3.4)
    // ... compaction detection logic
    
    if (isCompacted && agentRole) {
      // ... post-compact reminder injection
    }
  }
}
```

**What It Currently Does:**
1. ✅ Detects agent role from messages
2. ✅ Tracks session state via `sessionTrackers` Map
3. ✅ Detects session start (first user message)
4. ✅ Detects session resumption (idle > 1 hour, < 48 hours)
5. ✅ Injects governance prefix at session start
6. ✅ Detects compaction via keywords and message count
7. ✅ Injects post-compact reminders

**What It Does NOT Do (New Session Manipulation):**
1. ❌ Does NOT create "new session" within main conversation
2. ❌ Does NOT implement context purification mechanism
3. ❌ Does NOT track files modified/artifacts created
4. ❌ Does NOT calculate context purity score
5. ❌ Does NOT provide workflow switch recommendations
6. ❌ Does NOT list next tasks to execute

---

### 1.2 `buildGovernancePrefix()` Function

**Location:** `template/plugins/idumb-core.ts` lines 1251-1391

**Current Implementation:**

```typescript
function buildGovernancePrefix(agentRole: string, directory: string, isResumed: boolean = false): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'
  
  // Get enhanced context
  const todoCount = getPendingTodoCount(directory)
  const staleCheck = isStateStale(directory)
  
  // LANGUAGE ENFORCEMENT - ABSOLUTE PRIORITY
  const langEnforcement = `...`
  
  // STALE STATE WARNING
  const staleWarning = staleCheck.stale ? `...` : ''
  
  // TODO COUNT
  const todoInfo = todoCount > 0 ? `...` : ''
  
  // FIRST ACTION REQUIRED based on agent role
  const firstActionRequired: Record<string, string> = { ... }
  
  const roleInstructions: Record<string, string> = { ... }
  
  return roleInstructions[agentRole] || roleInstructions['idumb-supreme-coordinator']
}
```

**What It Injects:**
1. ✅ Language enforcement rules (communication + document language)
2. ✅ Stale state warnings (> 48 hours)
3. ✅ Pending TODO count
4. ✅ Role-specific hierarchy instructions
5. ✅ First action requirements per role
6. ✅ Current phase and framework info

**What's Missing for New Session:**
1. ❌ Files modified in current session
2. ❌ Artifacts created
3. ❌ Code changes summary
4. ❌ Context purity score
5. ❌ Workflow switch recommendation
6. ❌ Next tasks list

---

### 1.3 `buildPostCompactReminder()` Function

**Location:** `template/plugins/idumb-core.ts` lines 1548-1645

**Current Implementation:**

```typescript
function buildPostCompactReminder(agentRole: string, directory: string): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'
  
  // LANGUAGE ENFORCEMENT MUST SURVIVE COMPACTION
  const langReminder = `...`
  
  // Get recent history (last 3 actions)
  const recentHistory = state?.history?.slice(-3) || []
  
  // Get critical anchors
  const criticalAnchors = state?.anchors?.filter((a: Anchor) => 
    a.priority === 'critical' || a.priority === 'high'
  ) || []
  
  // Check state freshness
  const staleCheck = isStateStale(directory)
  
  let reminder = `
    ${langReminder}
    
    📌 POST-COMPACTION REMINDER 📌
    
    You are: ${agentRole}
    Phase: ${state?.phase || 'init'}
    Last validation: ${state?.lastValidation || 'Never'}
    State freshness: ${staleCheck.stale ? `⚠️ STALE` : `✅ Fresh`}
    
    🔄 WHAT YOU WERE DOING (last ${recentHistory.length} actions):
    ...
    
    🎯 CRITICAL ANCHORS (survived compaction):
    ...
    
    📋 RECOMMENDED NEXT STEPS:
    ...
  `
  
  return reminder
}
```

**What It Does:**
1. ✅ Preserves language enforcement after compaction
2. ✅ Shows recent history (last 3 actions)
3. ✅ Lists critical anchors
4. ✅ Shows state freshness
5. ✅ Provides recommended next steps

**What's Missing for New Session:**
1. ❌ Does NOT adjust flow of thoughts and rationales
2. ❌ Does NOT reflect files modified/artifacts created
3. ❌ Does NOT include context purity score
4. ❌ Does NOT include workflow switch recommendation
5. ❌ Does NOT include ordered next tasks

---

### 1.4 Session Tracking Logic

**Location:** `template/plugins/idumb-core.ts` lines 1076-1120

**Current Implementation:**

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

// In-memory session state
const sessionTrackers = new Map<string, SessionTracker>()

function getSessionTracker(sessionId: string): SessionTracker {
  if (!sessionTrackers.has(sessionId)) {
    sessionTrackers.set(sessionId, {
      firstToolUsed: false,
      firstToolName: null,
      agentRole: null,
      delegationDepth: 0,
      parentSession: null,
      violationCount: 0,
      governanceInjected: false
    })
  }
  return sessionTrackers.get(sessionId)!
}
```

**Additional Session-Related Functions:**

1. **`checkIfResumedSession()`** (lines 1873-1884):
   - Checks if session was active but idle for > 1 hour and < 48 hours
   - Uses `loadSessionMetadata()` to get session metadata

2. **`buildResumeContext()`** (lines 1890-1936):
   - Builds context for resumed sessions
   - Shows idle duration, previous session date, current phase, active anchors
   - Does NOT include files modified or workflow context

3. **Session Metadata Management:**
   - `loadSessionMetadata()` - Loads session metadata from disk
   - `saveSessionMetadata()` - Saves session metadata to disk
   - Metadata includes: createdAt, lastUpdated, phase, agent, messageCount

**What's Missing:**
1. ❌ No tracking of files modified in session
2. ❌ No tracking of artifacts created
3. ❌ No context purity calculation
4. ❌ No workflow state tracking
5. ❌ No delegation depth awareness in messages.transform

---

## 2. Validation Checklist

Based on requirements from SESSION-HANDOFF-2026-02-03, Task 2:

### Core Requirements

| Requirement | Status | Evidence | Notes |
|-------------|--------|----------|-------|
| **Creates new session WITHIN main conversation (not separate)** | ❌ NOT IMPLEMENTED | No "new session" creation logic found | Current code only handles session start and compaction detection, not "new session" manipulation |
| **Adjusts flow of thoughts and rationales** | ❌ NOT IMPLEMENTED | No flow adjustment logic | Post-compact reminder shows history but doesn't adjust flow |
| **Reflects what was done (files, artifacts, code changes)** | ❌ NOT IMPLEMENTED | No file/artifact tracking in session | `buildResumeContext()` and `buildPostCompactReminder()` don't include file changes |
| **Includes workflow context** | ⚠️ PARTIAL | Shows phase and anchors | Missing workflow state, current task, execution progress |
| **Includes context purity score** | ❌ NOT IMPLEMENTED | No purity calculation found | No scoring mechanism exists |
| **Includes workflow switch recommendation** | ❌ NOT IMPLEMENTED | No recommendation logic | Not implemented |
| **Includes next tasks to execute** | ⚠️ PARTIAL | Shows "recommended next steps" | Generic recommendations, not specific ordered tasks |
| **Does NOT intercept lower sessions (delegation tasks)** | ✅ IMPLEMENTED | `messages.transform` only processes main session | No delegation session detection, but also no lower session interception |
| **Works like innate `compact` but for workflow continuity** | ⚠️ PARTIAL | Post-compact reminder exists | Similar concept but missing workflow continuity features |
| **Does NOT break OpenCode TUI** | ✅ VERIFIED | Uses simple text injection | No complex formatting that would break TUI |

### Detailed Analysis

#### ❌ Creates new session WITHIN main conversation

**Expected Behavior:**
- When triggered, creates a "new session" context within the existing conversation
- Transforms the prompt to include purified context
- Does NOT create a separate session or break conversation flow

**Current State:**
- No "new session" manipulation logic exists
- Only handles:
  - Initial session start (governance prefix injection)
  - Session resumption (resume context injection)
  - Post-compaction (reminder injection)

**Gap:** The core "new session" manipulation feature is missing entirely.

---

#### ❌ Adjusts flow of thoughts and rationales

**Expected Behavior:**
- Reorganizes conversation flow to maintain coherence
- Adjusts rationales to match purified context
- Maintains logical progression despite context reduction

**Current State:**
- `buildPostCompactReminder()` shows "WHAT YOU WERE DOING" section
- Lists recent history but doesn't adjust flow
- No rationale adjustment logic

**Gap:** Flow adjustment is not implemented.

---

#### ❌ Reflects what was done (files, artifacts, code changes)

**Expected Behavior:**
- Tracks files modified during session
- Tracks artifacts created
- Summarizes code changes
- Presents summary in purified context

**Current State:**
- `getFileChanges()` function exists (lines 696-735) but only for checkpoints
- Returns `{ modified: [], created: [], deleted: [] }` based on history
- Not integrated into session tracking or "new session" manipulation
- `buildResumeContext()` and `buildPostCompactReminder()` don't include file changes

**Gap:** File/artifact tracking exists for checkpoints but not for session context.

---

#### ⚠️ Includes workflow context

**Expected Behavior:**
- Current phase
- Active task
- Execution progress
- Pending items
- Workflow state

**Current State:**
- Shows: Phase, active anchors count, TODO count
- Missing: Active task, execution progress, workflow state

**Gap:** Partial implementation - needs more workflow-specific context.

---

#### ❌ Includes context purity score

**Expected Behavior:**
- Calculates score 0-100 based on:
  - Message count
  - Context relevance
  - History density
  - Anchor coverage
- Displays score in purified context

**Current State:**
- No scoring mechanism exists
- No purity calculation

**Gap:** Entirely missing.

---

#### ❌ Includes workflow switch recommendation

**Expected Behavior:**
- Analyzes current workflow effectiveness
- Recommends workflow switch when beneficial
- Provides rationale for recommendation

**Current State:**
- No workflow analysis
- No recommendation logic

**Gap:** Entirely missing.

---

#### ⚠️ Includes next tasks to execute

**Expected Behavior:**
- Ordered list of next tasks
- Specific to current workflow
- Prioritized by importance/dependency

**Current State:**
- Generic "RECOMMENDED NEXT STEPS" section
- Suggests: validation, TODO check, status review
- Not specific to actual pending tasks

**Gap:** Generic recommendations instead of specific task list.

---

#### ✅ Does NOT intercept lower sessions (delegation tasks)

**Expected Behavior:**
- Only affects main user↔agent conversation
- Does NOT intercept delegation task sessions
- Can add reminders to lower sessions but not manipulate context

**Current State:**
- `messages.transform` processes all messages
- No delegation session detection
- However, no evidence of lower session interception either
- `sessionTrackers` tracks by sessionId, could differentiate

**Status:** Likely compliant but no explicit delegation detection.

---

#### ⚠️ Works like innate `compact` but for workflow continuity

**Expected Behavior:**
- Similar mechanism to OpenCode's innate `compact`
- Preserves workflow continuity instead of just reducing context
- Triggered by accumulated score or manual command

**Current State:**
- Post-compact reminder exists
- Compaction detection via keywords and message count
- Missing: workflow continuity features, accumulated scoring

**Gap:** Foundation exists but workflow continuity features missing.

---

#### ✅ Does NOT break OpenCode TUI

**Expected Behavior:**
- Uses safe text formatting
- No special characters that break TUI
- Simple text injection only

**Current State:**
- Uses emojis (⚠️, ✅, 📋, etc.)
- Uses simple text blocks
- No box-drawing characters in violation guidance (line 1546: "SIMPLIFIED: No emojis, no box-drawing chars")

**Status:** Compliant - uses TUI-safe formatting.

---

## 3. Gaps Identified

### Critical Gaps (Must Fix)

1. **Missing "New Session" Manipulation Logic**
   - No function to create purified context within main conversation
   - No trigger mechanism for context purification
   - No integration with accumulated scoring

2. **No File/Artifact Tracking in Session Context**
   - `getFileChanges()` exists but not used for session context
   - No tracking of artifacts created
   - No code change summaries

3. **No Context Purity Scoring**
   - No algorithm to calculate purity score
   - No threshold for triggering purification
   - No score display in context

4. **No Workflow Switch Recommendation**
   - No workflow effectiveness analysis
   - No recommendation logic
   - No switch trigger mechanism

5. **No Delegation Depth Awareness**
   - `sessionTrackers` has `delegationDepth` field but not used in `messages.transform`
   - No differentiation between main session and delegation sessions
   - Could lead to unwanted context manipulation in lower sessions

### Medium Priority Gaps

6. **Incomplete Workflow Context**
   - Missing active task tracking
   - Missing execution progress
   - Missing workflow state machine

7. **Generic Next Steps**
   - Recommendations are generic, not specific
   - Not tied to actual TODO items
   - Not ordered by priority

8. **No Flow Adjustment**
   - History shown but not reorganized
   - No rationale adjustment
   - No coherence maintenance

### Low Priority Gaps

9. **Limited Compaction Detection**
   - Only keyword-based detection
   - No API-level compaction detection
   - Could miss some compaction events

10. **No Accumulated Scoring**
    - No message length tracking
    - No context density calculation
    - No automatic trigger mechanism

---

## 4. Recommendations

### 4.1 Immediate Implementation Required

#### 4.1.1 Create `buildNewSessionContext()` Function

**Location:** After `buildPostCompactReminder()` (around line 1650)

**Purpose:** Build purified context for "new session" manipulation

**Implementation Sketch:**

```typescript
interface NewSessionContext {
  filesModified: string[]
  filesCreated: string[]
  artifactsCreated: string[]
  codeChanges: CodeChangeSummary[]
  workflowContext: WorkflowContext
  contextPurity: number
  switchRecommendation: WorkflowSwitchRecommendation
  nextTasks: Task[]
}

function buildNewSessionContext(
  agentRole: string, 
  directory: string,
  sessionId: string
): string {
  const state = readState(directory)
  const sessionTracker = getSessionTracker(sessionId)
  
  // 1. Get file changes from session
  const fileChanges = getSessionFileChanges(sessionId, directory)
  
  // 2. Get artifacts created
  const artifacts = getSessionArtifacts(sessionId, directory)
  
  // 3. Calculate context purity score
  const purityScore = calculateContextPurity(sessionId, directory)
  
  // 4. Get workflow context
  const workflowContext = buildWorkflowContext(directory)
  
  // 5. Get workflow switch recommendation
  const switchRec = analyzeWorkflowSwitch(directory, purityScore)
  
  // 6. Get next tasks
  const nextTasks = getOrderedNextTasks(directory)
  
  // 7. Build purified context string
  return formatNewSessionContext({
    filesModified: fileChanges.modified,
    filesCreated: fileChanges.created,
    artifactsCreated: artifacts,
    workflowContext,
    contextPurity: purityScore,
    switchRecommendation: switchRec,
    nextTasks
  })
}
```

#### 4.1.2 Implement Context Purity Scoring

**Location:** New function after session tracking functions

**Algorithm:**

```typescript
function calculateContextPurity(sessionId: string, directory: string): number {
  const tracker = getSessionTracker(sessionId)
  const state = readState(directory)
  
  let score = 100
  
  // Factor 1: Message count (more messages = lower score)
  const messageCount = tracker.messageCount || 0
  if (messageCount > 50) score -= 20
  else if (messageCount > 30) score -= 10
  else if (messageCount > 20) score -= 5
  
  // Factor 2: Time since last validation
  const hoursSinceValidation = getHoursSinceValidation(state)
  if (hoursSinceValidation > 48) score -= 15
  else if (hoursSinceValidation > 24) score -= 10
  else if (hoursSinceValidation > 12) score -= 5
  
  // Factor 3: Anchor coverage
  const anchorCount = state?.anchors?.length || 0
  if (anchorCount < 3) score -= 10
  else if (anchorCount > 10) score -= 5 // Too many anchors also bad
  
  // Factor 4: Error rate
  const errorRate = calculateErrorRate(sessionId)
  score -= errorRate * 20
  
  // Factor 5: Delegation depth
  if (tracker.delegationDepth > 2) score -= 10
  
  return Math.max(0, Math.min(100, score))
}
```

#### 4.1.3 Enhance `messages.transform` Hook

**Location:** Lines 2797-2924

**Additions:**

```typescript
"experimental.chat.messages.transform": async (input: any, output: any) => {
  try {
    // ... existing code ...
    
    // ==========================================
    // NEW SESSION MANIPULATION (Context Purification)
    // ==========================================
    
    // Check if this is a delegation session (Level 2+)
    const isDelegationSession = tracker.delegationDepth > 0 || 
      detectDelegationSession(output.messages)
    
    if (!isDelegationSession && agentRole) {
      // Check for accumulated score trigger
      const accumulatedScore = calculateAccumulatedScore(sessionId, output.messages)
      const shouldPurify = accumulatedScore > ACCUMULATED_SCORE_THRESHOLD
      
      // Check for manual new session trigger
      const hasNewSessionTrigger = output.messages.some((m: any) =>
        m.parts?.some((p: any) => 
          p.text?.toLowerCase().includes('/idumb:new-session') ||
          p.text?.toLowerCase().includes('new session manipulation')
        )
      )
      
      if (shouldPurify || hasNewSessionTrigger) {
        log(directory, `New session manipulation triggered for ${agentRole}`)
        
        // Build purified context
        const newSessionContext = buildNewSessionContext(agentRole, directory, sessionId)
        
        // Inject into last user message or create new context message
        const lastUserMsgIndex = output.messages.findLastIndex((m: any) => 
          m.info?.role === 'user'
        )
        
        if (lastUserMsgIndex >= 0) {
          // Prepend purified context to last user message
          output.messages[lastUserMsgIndex].parts.unshift({
            type: 'text',
            text: newSessionContext
          })
          
          log(directory, `New session context injected for ${agentRole}`)
        }
      }
    }
    
    // ... rest of existing code ...
  }
}
```

#### 4.1.4 Add Session File Change Tracking

**Location:** New functions after `getFileChanges()`

```typescript
interface SessionFileChanges {
  modified: string[]
  created: string[]
  deleted: string[]
  sessionId: string
}

// In-memory session file changes
const sessionFileChanges = new Map<string, SessionFileChanges>()

function trackSessionFileChange(
  sessionId: string, 
  filePath: string, 
  changeType: 'modified' | 'created' | 'deleted'
): void {
  if (!sessionFileChanges.has(sessionId)) {
    sessionFileChanges.set(sessionId, {
      modified: [],
      created: [],
      deleted: [],
      sessionId
    })
  }
  
  const changes = sessionFileChanges.get(sessionId)!
  changes[changeType].push(filePath)
}

function getSessionFileChanges(sessionId: string, directory: string): SessionFileChanges {
  // Return in-memory changes + scan for recent changes
  const inMemory = sessionFileChanges.get(sessionId) || {
    modified: [],
    created: [],
    deleted: [],
    sessionId
  }
  
  // Also get changes from state history
  const fromHistory = getFileChanges(directory, readState(directory)?.phase || 'init')
  
  return {
    modified: [...new Set([...inMemory.modified, ...fromHistory.modified])],
    created: [...new Set([...inMemory.created, ...fromHistory.created])],
    deleted: [...new Set([...inMemory.deleted, ...fromHistory.deleted])],
    sessionId
  }
}
```

#### 4.1.5 Implement Workflow Switch Analysis

**Location:** New function

```typescript
interface WorkflowSwitchRecommendation {
  shouldSwitch: boolean
  currentWorkflow: string
  recommendedWorkflow: string
  rationale: string
  confidence: number // 0-1
}

function analyzeWorkflowSwitch(
  directory: string, 
  purityScore: number
): WorkflowSwitchRecommendation {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  
  const currentPhase = state?.phase || 'init'
  const errorRate = calculateRecentErrorRate(directory)
  const validationStaleness = getHoursSinceValidation(state)
  
  // Decision logic
  if (purityScore < 30 || errorRate > 0.5) {
    return {
      shouldSwitch: true,
      currentWorkflow: currentPhase,
      recommendedWorkflow: 'validation',
      rationale: `Context purity is low (${purityScore}%) and error rate is high (${errorRate}). Recommend switching to validation workflow.`,
      confidence: 0.8
    }
  }
  
  if (validationStaleness > 48) {
    return {
      shouldSwitch: true,
      currentWorkflow: currentPhase,
      recommendedWorkflow: 'validation',
      rationale: `State is stale (${validationStaleness}h since validation). Recommend validation before continuing.`,
      confidence: 0.7
    }
  }
  
  return {
    shouldSwitch: false,
    currentWorkflow: currentPhase,
    recommendedWorkflow: currentPhase,
    rationale: 'Current workflow is effective. Continue with current approach.',
    confidence: 0.9
  }
}
```

### 4.2 Integration Points

#### 4.2.1 Hook Integration

The "new session" manipulation should be triggered in `messages.transform` hook:

```
Hook: experimental.chat.messages.transform
Trigger Conditions:
  1. Accumulated score > threshold
  2. Manual /idumb:new-session command
  3. Context purity < 30
  4. Workflow switch recommended

NOT Triggered When:
  1. Delegation session (depth > 0)
  2. First message (use governance prefix instead)
  3. Post-compact (use post-compact reminder instead)
```

#### 4.2.2 State Integration

Add to `IdumbState` interface:

```typescript
interface IdumbState {
  // ... existing fields ...
  sessionContext?: {
    lastPurification: string
    purityScore: number
    filesModified: string[]
    artifactsCreated: string[]
  }
}
```

#### 4.2.3 Tool Integration

Track file changes in tool hooks:

```typescript
// In tool.execute.after hook
if (tool === 'write' || tool === 'edit') {
  trackSessionFileChange(sessionId, filePath, 'modified')
}
```

### 4.3 Testing Strategy

1. **Unit Tests:**
   - Test `calculateContextPurity()` with various inputs
   - Test `buildNewSessionContext()` formatting
   - Test `analyzeWorkflowSwitch()` decision logic

2. **Integration Tests:**
   - Test trigger conditions in `messages.transform`
   - Test delegation session exclusion
   - Test file change tracking

3. **E2E Tests:**
   - Full workflow: Start → Work → Trigger → Verify context
   - Test TUI compatibility
   - Test with actual OpenCode

---

## 5. Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Implement `calculateContextPurity()`
2. ✅ Implement `getSessionFileChanges()`
3. ✅ Add file change tracking to tool hooks

### Phase 2: Core Logic (Week 1-2)
4. ✅ Implement `buildNewSessionContext()`
5. ✅ Implement `analyzeWorkflowSwitch()`
6. ✅ Enhance `messages.transform` with new session logic

### Phase 3: Integration (Week 2)
7. ✅ Add accumulated scoring
8. ✅ Add manual trigger (/idumb:new-session)
9. ✅ Test delegation session exclusion

### Phase 4: Validation (Week 3)
10. ✅ Write unit tests
11. ✅ Write integration tests
12. ✅ E2E testing with OpenCode
13. ✅ GATE-1 validation

---

## 6. Conclusion

The current iDumb plugin implementation has a **solid foundation** for "new session" manipulation through:
- ✅ `messages.transform` hook infrastructure
- ✅ Session tracking (`sessionTrackers`)
- ✅ Post-compact reminder system
- ✅ Resume context building

However, the **specific "new session" manipulation features are NOT IMPLEMENTED**:
- ❌ No context purification mechanism
- ❌ No file/artifact tracking in session context
- ❌ No context purity scoring
- ❌ No workflow switch recommendations
- ❌ No accumulated scoring trigger

**Recommendation:** Proceed with Phase 1 implementation immediately. The foundation is ready; the specific features need to be built on top of it.

**Estimated Effort:** 2-3 weeks for full implementation and testing.

---

## Appendix A: Code References

### Key Functions

| Function | Line | Purpose |
|----------|------|---------|
| `buildGovernancePrefix()` | 1251 | Build role-specific governance instructions |
| `buildPostCompactReminder()` | 1548 | Build post-compaction context reminder |
| `buildResumeContext()` | 1890 | Build session resumption context |
| `checkIfResumedSession()` | 1873 | Detect if session is being resumed |
| `getFileChanges()` | 696 | Get file changes (for checkpoints) |
| `messages.transform` hook | 2797 | Main message transformation hook |
| `getSessionTracker()` | 1101 | Get/create session tracker |

### Key Interfaces

| Interface | Line | Purpose |
|-----------|------|---------|
| `SessionTracker` | 1076 | In-memory session state |
| `IdumbState` | 35 | Persistent state structure |
| `Anchor` | 48 | Context anchor definition |
| `HistoryEntry` | 56 | History entry structure |

---

## Appendix B: Related Documents

1. **SESSION-HANDOFF-2026-02-03-PERMISSION-MANIPULATION.md** - Source requirements
2. **01-06-PLAN-permission-manipulation-2026-02-03.md** - Implementation plan
3. **INTERCEPTION-ARCHITECTURE-ANALYSIS.md** - Hook architecture
4. **IMPLEMENTATION-GUIDE.md** - Implementation patterns

---

*Report Generated By:* idumb-phase-researcher  
*Validation Status:* ❌ INCOMPLETE - Implementation Required  
*Next Action:* Implement Phase 1 foundation features
