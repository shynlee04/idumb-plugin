---
title: "Phase 1.6: Permission Manipulation Mastery - Complete Implementation"
version: "1.0.0"
created: "2026-02-03"
status: draft
priority: P0
estimated_effort: "8-12 hours"
target_files:
  plugin: template/plugins/idumb-core.ts
  agents: template/agents/*.md (15 files)
---

# Phase 1.6: Permission Manipulation Mastery

## Executive Summary

This plan addresses ALL 12 identified gaps in the permission manipulation system with 100% coverage, incremental checkpoints, and integration tests.

## Context

**Building iDumb Source:**
- Edit `template/` (source files)
- Use PROJECT agents: idumb-executor, idumb-planner, idumb-verifier, idumb-debugger
- Use `general` subagent for file writes
- Run `npm run install:local` to deploy to `.opencode/` for testing

**NOT for this work:**
- `idumb-builder` (META only - edits `.opencode/`)
- `idumb-low-validator` (META only - validates `.idumb/`)

---

## ALL 12 GAPS

| # | Gap | Location | Priority |
|---|-----|----------|----------|
| 1 | Between-Turn state not implemented | idumb-core.ts | P0 |
| 2 | User-Stop state not possible (API limitation) | Documentation | P2 |
| 3 | New Session Manipulation not implemented | idumb-core.ts | P0 |
| 4 | Depth-aware governance injection missing | idumb-core.ts | P0 |
| 5 | Short message flow indicator missing | idumb-core.ts | P0 |
| 6 | Long message accumulated scoring missing | idumb-core.ts | P0 |
| 7 | Context purification trigger missing | idumb-core.ts | P0 |
| 8 | Agent scope field missing | agents/*.md | P1 |
| 9 | Agent registry missing | agents/*.md | P1 |
| 10 | Incorrect delegation targets | agents/*.md | P1 |
| 11 | idumb-executor can't write project code | idumb-executor.md | P1 |
| 12 | Agents lack workflow knowledge | agents/*.md | P1 |

---

## Work Package 1: Plugin Session State Fixes

**Target:** `template/plugins/idumb-core.ts`

### WP1-T1: Implement Between-Turn Detection

**Location:** After line 2922 (messages.transform hook)

**Spec:**
```typescript
// Add to SessionTracker interface (line 1030)
interface SessionTracker {
  // ... existing fields
  betweenTurn: boolean
  turnCount: number
  lastAssistantMessage: string | null
}

// Add detection in messages.transform hook
const isBetweenTurn = (messages: Message[]): boolean => {
  const lastMessage = messages[messages.length - 1]
  const secondLast = messages[messages.length - 2]
  return lastMessage?.role === 'user' && secondLast?.role === 'assistant'
}

// Track between-turn state
if (isBetweenTurn(output.messages)) {
  tracker.betweenTurn = true
  tracker.turnCount++
  log(directory, `[BETWEEN_TURN] Turn ${tracker.turnCount} for ${agentRole}`)
}
```

**Acceptance:**
- [ ] `betweenTurn` field in SessionTracker
- [ ] Turn count tracked
- [ ] Log shows between-turn detection

**Checkpoint:** `grep "betweenTurn" template/plugins/idumb-core.ts`

---

### WP1-T2: Document User-Stop Limitation

**Action:** Add documentation comment in idumb-core.ts

**Location:** Line 3354 area

**Spec:**
```typescript
// ============================================================
// USER-STOP STATE (State 4)
// ============================================================
// LIMITATION: OpenCode API does not provide a hook for user-stop.
// The 'stop' hook was removed in a refactor.
// 
// Current workaround: session.idle event fires after agent stops
// but this is AFTER the stop, not during.
//
// Impact: At depth 1+, if user stops mid-delegation:
// - Sub-agent may have partial state
// - No cleanup mechanism available
// - Hallucination risk increases
//
// Mitigation: Agents should checkpoint frequently and
// use atomic operations to minimize partial state.
// ============================================================
```

**Acceptance:**
- [ ] Documentation block exists
- [ ] Explains limitation and mitigation

**Checkpoint:** `grep "USER-STOP STATE" template/plugins/idumb-core.ts`

---

### WP1-T3: Implement New Session Manipulation

**Location:** New function after buildPostCompactReminder (line 1600 area)

**Spec:**
```typescript
// ============================================================
// NEW SESSION MANIPULATION (State 5)
// ============================================================

interface NewSessionContext {
  trigger: 'accumulated_score' | 'workflow_switch' | 'context_stale'
  previousWorkflow: string | null
  filesChanged: string[]
  artifactsCreated: string[]
  nextTasks: string[]
  contextPurity: number // 0-100
}

function buildNewSessionManipulation(
  directory: string,
  sessionId: string,
  context: NewSessionContext
): string {
  const state = readState(directory)
  const anchors = state?.anchors || []
  
  // Build transformed prompt for "new session" feel
  return `
## Context Recovery (Session Refreshed)

**Previous Work:**
${context.filesChanged.map(f => `- Modified: ${f}`).join('\n')}
${context.artifactsCreated.map(a => `- Created: ${a}`).join('\n')}

**Active Anchors:**
${anchors.slice(-3).map(a => `- ${a.content}`).join('\n')}

**Current Phase:** ${state?.phase || 'unknown'}

**Next Tasks:**
${context.nextTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

**Context Purity:** ${context.contextPurity}% (${context.contextPurity < 50 ? 'consider workflow switch' : 'continue current workflow'})

---
Continue from where we left off. The above context summarizes prior work.
`
}

function shouldTriggerNewSession(
  sessionId: string,
  accumulatedScore: number
): boolean {
  // Trigger if score exceeds threshold
  const THRESHOLD = 100 // Adjust based on testing
  return accumulatedScore >= THRESHOLD
}
```

**Acceptance:**
- [ ] `buildNewSessionManipulation` function exists
- [ ] `shouldTriggerNewSession` function exists
- [ ] Returns context recovery prompt

**Checkpoint:** `grep "buildNewSessionManipulation" template/plugins/idumb-core.ts`

---

### WP1-T4: Implement Depth-Aware Governance Injection

**Location:** Modify `buildGovernancePrefix` function (line 1251)

**Spec:**
```typescript
// Modify function signature
function buildGovernancePrefix(
  directory: string,
  agentRole: string,
  depth: number = 0  // NEW PARAMETER
): string {
  
  // DEPTH 0: Full governance (user ↔ primary agent)
  if (depth === 0) {
    return buildFullGovernancePrefix(directory, agentRole)
  }
  
  // DEPTH 1: Light governance (primary → first delegation)
  if (depth === 1) {
    return buildLightGovernancePrefix(directory, agentRole)
  }
  
  // DEPTH 2+: Minimal governance (nested delegations)
  return buildMinimalGovernancePrefix(directory, agentRole)
}

function buildFullGovernancePrefix(directory: string, agentRole: string): string {
  // Current full implementation
  // ... existing code
}

function buildLightGovernancePrefix(directory: string, agentRole: string): string {
  const state = readState(directory)
  const anchors = state?.anchors?.slice(-2) || []
  
  return `
## Quick Context (Depth 1)
**Role:** ${agentRole}
**Phase:** ${state?.phase || 'unknown'}
**Anchors:** ${anchors.map(a => a.content).join(' | ')}

Check .idumb/brain/state.json if you need more context.
`
}

function buildMinimalGovernancePrefix(directory: string, agentRole: string): string {
  return `You are ${agentRole}. Execute the delegated task. Read .idumb/brain/state.json only if needed.`
}
```

**Update call sites:**
```typescript
// In messages.transform hook (line 2837)
const depth = tracker.delegationDepth || 0
const governancePrefix = buildGovernancePrefix(directory, agentRole, depth)
```

**Acceptance:**
- [ ] `buildGovernancePrefix` accepts depth parameter
- [ ] 3 levels: full (0), light (1), minimal (2+)
- [ ] Call sites pass depth

**Checkpoint:** `grep "buildLightGovernancePrefix\|buildMinimalGovernancePrefix" template/plugins/idumb-core.ts`

---

## Work Package 2: Message Logic Implementation

**Target:** `template/plugins/idumb-core.ts`

### WP2-T1: Add Word Count Detection

**Location:** After constants section (line 560 area)

**Spec:**
```typescript
// ============================================================
// MESSAGE LENGTH ANALYSIS
// ============================================================

const SHORT_MESSAGE_THRESHOLD = 20  // words
const LONG_MESSAGE_THRESHOLD = 30   // words

function getMessageWordCount(content: string): number {
  if (!content) return 0
  // Remove code blocks to avoid skewing count
  const withoutCode = content.replace(/```[\s\S]*?```/g, '[CODE]')
  return withoutCode.trim().split(/\s+/).filter(w => w.length > 0).length
}

function classifyMessageLength(content: string): 'short' | 'medium' | 'long' {
  const wordCount = getMessageWordCount(content)
  if (wordCount <= SHORT_MESSAGE_THRESHOLD) return 'short'
  if (wordCount >= LONG_MESSAGE_THRESHOLD) return 'long'
  return 'medium'
}
```

**Acceptance:**
- [ ] `getMessageWordCount` function exists
- [ ] `classifyMessageLength` function exists
- [ ] Handles code blocks correctly

**Checkpoint:** `grep "getMessageWordCount" template/plugins/idumb-core.ts`

---

### WP2-T2: Implement Flow Indicator for Short Messages

**Location:** In messages.transform hook (line 2800 area)

**Spec:**
```typescript
// Add to SessionTracker
interface SessionTracker {
  // ... existing
  messageScores: number[]  // Track message complexity
  flowIndicatorInjected: boolean
}

function buildFlowIndicator(
  directory: string,
  messages: Message[],
  tracker: SessionTracker
): string {
  // Look at: pinned initial → overall context → last 4 turns
  const pinnedContext = getPinnedContext(messages)
  const overallSummary = getOverallSummary(messages)
  const lastFourTurns = messages.slice(-8) // 4 user + 4 assistant
  
  return `
[Flow: Continue from above. Context: ${pinnedContext || 'none'}. Recent: ${summarizeTurns(lastFourTurns)}]
`
}

function getPinnedContext(messages: Message[]): string | null {
  // Look for pinned/system messages
  const systemMsg = messages.find(m => m.role === 'system')
  return systemMsg?.content?.slice(0, 100) || null
}

function summarizeTurns(turns: Message[]): string {
  return turns
    .filter(m => m.role === 'assistant')
    .slice(-2)
    .map(m => m.content?.slice(0, 50))
    .join(' → ')
}

// In messages.transform hook:
const userMessage = userMessages[userMessages.length - 1]
const messageClass = classifyMessageLength(userMessage?.content || '')

if (messageClass === 'short' && !tracker.flowIndicatorInjected) {
  const flowIndicator = buildFlowIndicator(directory, output.messages, tracker)
  // Prepend flow indicator to user message
  userMessage.content = flowIndicator + '\n\n' + userMessage.content
  tracker.flowIndicatorInjected = true
  log(directory, `[FLOW_INDICATOR] Injected for short message`)
}
```

**Acceptance:**
- [ ] `buildFlowIndicator` function exists
- [ ] Short messages get flow indicator
- [ ] Looks at pinned → overall → last 4 turns

**Checkpoint:** `grep "buildFlowIndicator" template/plugins/idumb-core.ts`

---

### WP2-T3: Implement Accumulated Scoring

**Location:** After message classification functions

**Spec:**
```typescript
// Add to state maps (line 1050 area)
const messageAccumulators: Map<string, {
  score: number
  history: number[]
  lastReset: string
}> = new Map()

function accumulateMessageScore(
  sessionId: string,
  wordCount: number,
  hasCodeBlocks: boolean
): number {
  let accumulator = messageAccumulators.get(sessionId)
  if (!accumulator) {
    accumulator = { score: 0, history: [], lastReset: new Date().toISOString() }
    messageAccumulators.set(sessionId, accumulator)
  }
  
  // Score calculation
  let addScore = 0
  if (wordCount > LONG_MESSAGE_THRESHOLD) {
    addScore = Math.floor((wordCount - LONG_MESSAGE_THRESHOLD) / 10) + 1
  }
  if (hasCodeBlocks) {
    addScore += 5 // Code adds complexity
  }
  
  accumulator.score += addScore
  accumulator.history.push(addScore)
  
  // Keep history bounded
  if (accumulator.history.length > 20) {
    accumulator.history.shift()
  }
  
  log(directory, `[SCORE] Session ${sessionId}: +${addScore} = ${accumulator.score}`)
  return accumulator.score
}

// In messages.transform:
if (messageClass === 'long') {
  const hasCode = userMessage?.content?.includes('```') || false
  const wordCount = getMessageWordCount(userMessage?.content || '')
  const currentScore = accumulateMessageScore(sessionId, wordCount, hasCode)
  
  if (shouldTriggerNewSession(sessionId, currentScore)) {
    // Trigger context purification
    triggerContextPurification(sessionId, directory)
  }
}
```

**Acceptance:**
- [ ] `messageAccumulators` Map exists
- [ ] `accumulateMessageScore` function exists
- [ ] Triggers check on long messages

**Checkpoint:** `grep "accumulateMessageScore" template/plugins/idumb-core.ts`

---

### WP2-T4: Implement Context Purification Trigger

**Location:** After accumulated scoring

**Spec:**
```typescript
const PURIFICATION_THRESHOLD = 100

function triggerContextPurification(
  sessionId: string,
  directory: string
): void {
  log(directory, `[PURIFY] Triggering context purification for ${sessionId}`)
  
  // Gather context for new session
  const context: NewSessionContext = {
    trigger: 'accumulated_score',
    previousWorkflow: getCurrentWorkflow(directory),
    filesChanged: getRecentlyModifiedFiles(directory),
    artifactsCreated: getRecentArtifacts(directory),
    nextTasks: getPendingTasks(directory),
    contextPurity: calculatePurity(sessionId)
  }
  
  // Reset accumulator
  const accumulator = messageAccumulators.get(sessionId)
  if (accumulator) {
    accumulator.score = 0
    accumulator.lastReset = new Date().toISOString()
  }
  
  // Store context for next message transform
  pendingPurifications.set(sessionId, context)
  
  // Add history entry
  addHistoryEntry(directory, `purification_triggered:${sessionId}`, 'plugin', 'pass')
}

const pendingPurifications: Map<string, NewSessionContext> = new Map()

function getCurrentWorkflow(directory: string): string | null {
  const state = readState(directory)
  return state?.phase || null
}

function getRecentlyModifiedFiles(directory: string): string[] {
  // Read from execution metrics or recent history
  // Simplified: return from history
  const state = readState(directory)
  return state?.history
    ?.filter(h => h.action.includes('file_'))
    ?.slice(-5)
    ?.map(h => h.action) || []
}

function getPendingTasks(directory: string): string[] {
  try {
    const todosPath = join(directory, '.idumb/brain/todos.json')
    if (existsSync(todosPath)) {
      const todos = JSON.parse(readFileSync(todosPath, 'utf-8'))
      return todos
        .filter((t: any) => t.status === 'pending')
        .slice(0, 5)
        .map((t: any) => t.content)
    }
  } catch {}
  return []
}

function calculatePurity(sessionId: string): number {
  const accumulator = messageAccumulators.get(sessionId)
  if (!accumulator) return 100
  // Inverse of score as percentage
  return Math.max(0, 100 - accumulator.score)
}
```

**Acceptance:**
- [ ] `triggerContextPurification` function exists
- [ ] Gathers context (workflow, files, tasks)
- [ ] Resets accumulator
- [ ] Stores for next transform

**Checkpoint:** `grep "triggerContextPurification" template/plugins/idumb-core.ts`

---

## Work Package 3: Agent Profile Fixes

**Target:** `template/agents/*.md` (15 files)

### WP3-T1: Add Scope Field to All Agents

**Spec - Add to YAML frontmatter:**
```yaml
scope: meta | project | bridge
```

| Agent | Scope | Reason |
|-------|-------|--------|
| idumb-supreme-coordinator | bridge | Orchestrates both |
| idumb-high-governance | meta | META coordination |
| idumb-executor | project | PROJECT code execution |
| idumb-builder | meta | META, edits .opencode/ |
| idumb-low-validator | meta | META, validates .idumb/ |
| idumb-verifier | project | PROJECT verification |
| idumb-debugger | project | PROJECT debugging |
| idumb-planner | bridge | Creates plans for both |
| idumb-plan-checker | bridge | Validates plans |
| idumb-roadmapper | project | PROJECT roadmaps |
| idumb-project-researcher | project | PROJECT research |
| idumb-phase-researcher | project | PROJECT phases |
| idumb-research-synthesizer | project | PROJECT synthesis |
| idumb-codebase-mapper | project | PROJECT analysis |
| idumb-integration-checker | bridge | Checks both |

**Acceptance:**
- [ ] All 15 agents have `scope:` field
- [ ] Scope values are correct per table

**Checkpoint:** `grep -l "scope:" template/agents/*.md | wc -l` (should be 15)

---

### WP3-T2: Add Agent Registry to All Profiles

**Spec - Add after frontmatter in each agent:**
```markdown
## Available Agents

| Agent | Mode | Scope | Can Delegate To |
|-------|------|-------|-----------------|
| idumb-supreme-coordinator | primary | bridge | all agents |
| idumb-high-governance | all | meta | builder, low-validator |
| idumb-executor | subagent | project | builder, verifier, debugger |
| idumb-builder | all | meta | none (leaf) |
| idumb-low-validator | all | meta | none (leaf) |
| idumb-verifier | subagent | project | low-validator |
| idumb-debugger | subagent | project | low-validator, builder |
| idumb-planner | subagent | bridge | none |
| idumb-plan-checker | subagent | bridge | none |
| idumb-roadmapper | subagent | project | none |
| idumb-project-researcher | subagent | project | none |
| idumb-phase-researcher | subagent | project | none |
| idumb-research-synthesizer | subagent | project | none |
| idumb-codebase-mapper | subagent | project | none |
| idumb-integration-checker | subagent | bridge | low-validator |
```

**Acceptance:**
- [ ] All 15 agents have "Available Agents" section
- [ ] Table is consistent across all

**Checkpoint:** `grep -l "Available Agents" template/agents/*.md | wc -l` (should be 15)

---

### WP3-T3: Fix Delegation Targets

**Changes needed:**

1. **idumb-executor.md** - Should delegate to `general` for project file writes
```yaml
permission:
  task:
    "general": allow  # For project file writes
    "idumb-verifier": allow
    "idumb-debugger": allow
    "*": deny
```

2. **idumb-supreme-coordinator.md** - Already correct (delegates to all)

3. **idumb-high-governance.md** - Should only delegate to META agents
```yaml
permission:
  task:
    "idumb-builder": allow
    "idumb-low-validator": allow
    "*": deny
```

4. **idumb-debugger.md** - Should delegate to general for fixes
```yaml
permission:
  task:
    "general": allow  # For applying fixes
    "idumb-low-validator": allow
    "*": deny
```

**Acceptance:**
- [ ] Delegation targets match scope
- [ ] PROJECT agents can delegate to `general` for writes
- [ ] META agents delegate only to META

**Checkpoint:** Review each agent's `permission.task` section

---

### WP3-T4: Fix idumb-executor for Project Work

**File:** `template/agents/idumb-executor.md`

**Current Problem:** Has `edit: deny, write: deny` but needs to execute project code

**Solution:** Keep deny (it orchestrates), but ensure it delegates to `general` for writes

**Updated frontmatter:**
```yaml
---
description: "Executes phase plans by coordinating task delegation and tracking progress"
mode: subagent
hidden: true
scope: project
temperature: 0.2
permission:
  task:
    "general": allow      # For project file writes
    "idumb-verifier": allow
    "idumb-debugger": allow
    "*": deny
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
    "npm test": allow
    "npm run test*": allow
    "npm run build": allow
    "*": deny
  edit: deny   # Delegates to general instead
  write: deny  # Delegates to general instead
tools:
  task: true
  idumb-state: true
  idumb-state_anchor: true
  idumb-context: true
  idumb-todo: true
  read: true
  glob: true
  grep: true
---
```

**Add to body:**
```markdown
## Delegation Pattern for Project Work

When you need to write project files:
1. Analyze what needs to be written
2. Delegate to `general` subagent with clear specs
3. Verify the result after delegation returns

Example:
```
@general
Task: Write the following file
Path: src/components/Button.tsx
Content: [content here]
Verify: File exists and compiles
```
```

**Acceptance:**
- [ ] Can delegate to `general` for writes
- [ ] Delegation pattern documented
- [ ] Still cannot write directly (maintains hierarchy)

**Checkpoint:** `grep "general" template/agents/idumb-executor.md`

---

## Integration Test Scenarios

### ITS-1: New Conversation with Depth-Aware Injection

**Validates:** WP1-T4

**Setup:**
1. Start new conversation
2. Coordinator delegates to executor (depth 1)
3. Executor delegates to debugger (depth 2)

**Steps:**
```bash
# 1. Start fresh
npm run install:local
# 2. New conversation as coordinator
# 3. Ask to execute a task (triggers delegation)
# 4. Check logs for governance levels
grep "DEPTH" .idumb/governance/plugin.log
```

**Expected:**
- Depth 0: Full governance prefix (~500 chars)
- Depth 1: Light governance (~100 chars)
- Depth 2: Minimal governance (~50 chars)

---

### ITS-2: Short Message Flow Indicator

**Validates:** WP2-T1, WP2-T2

**Setup:**
1. Have ongoing conversation with context

**Steps:**
1. Send short message: "continue"
2. Check if flow indicator injected
3. Verify agent sees context (pinned → overall → last 4)

**Expected:**
- Flow indicator prepended to message
- Log shows `[FLOW_INDICATOR]`
- Agent responds with context awareness

---

### ITS-3: Long Message Accumulated Scoring

**Validates:** WP2-T3, WP2-T4

**Steps:**
1. Send several long messages (>30 words each)
2. Monitor accumulated score
3. Continue until threshold reached
4. Verify purification triggered

**Expected:**
- Score increases with each long message
- Log shows `[SCORE]` entries
- When threshold reached, `[PURIFY]` logged
- Next response has context recovery

---

### ITS-4: Agent Registry Visibility

**Validates:** WP3-T2

**Steps:**
1. Ask coordinator: "What agents are available?"
2. Verify it references the registry
3. Ask executor same question
4. Verify same registry visible

**Expected:**
- All agents list 15 available agents
- Can identify scope of each
- Know delegation targets

---

## Checkpoint Gates

### GATE-1: Session States Complete

**After:** WP1-T1, WP1-T2, WP1-T3, WP1-T4

**Validation:**
```bash
# All functions exist
grep -c "isBetweenTurn\|buildNewSessionManipulation\|buildLightGovernancePrefix" template/plugins/idumb-core.ts
# Should return 3
```

**Pass Criteria:**
- [ ] Between-turn detection works
- [ ] New session manipulation implemented
- [ ] Depth-aware injection works

**Rollback:** `git checkout template/plugins/idumb-core.ts`

---

### GATE-2: Message Logic Complete

**After:** WP2-T1, WP2-T2, WP2-T3, WP2-T4

**Validation:**
```bash
# All functions exist
grep -c "getMessageWordCount\|buildFlowIndicator\|accumulateMessageScore\|triggerContextPurification" template/plugins/idumb-core.ts
# Should return 4
```

**Pass Criteria:**
- [ ] Word count detection works
- [ ] Short message flow indicator works
- [ ] Long message scoring works
- [ ] Purification triggers

**Rollback:** Revert message logic functions

---

### GATE-3: Agent Profiles Complete

**After:** WP3-T1, WP3-T2, WP3-T3, WP3-T4

**Validation:**
```bash
# All agents have scope
grep -l "scope:" template/agents/*.md | wc -l
# Should return 15

# All agents have registry
grep -l "Available Agents" template/agents/*.md | wc -l  
# Should return 15
```

**Pass Criteria:**
- [ ] All 15 have scope field
- [ ] All 15 have agent registry
- [ ] Delegation targets correct

**Rollback:** `git checkout template/agents/`

---

### GATE-FINAL: 100% Coverage Verified

**After:** All gates pass + integration tests

**Validation:**
```bash
# Install and test
npm run install:local

# Verify installed
ls -la .opencode/plugins/idumb-core.ts
ls -la .opencode/agents/*.md | wc -l  # Should be 15

# Run integration tests
# (Manual testing required)
```

**Pass Criteria:**
- [ ] All gates passed
- [ ] All integration tests pass
- [ ] No regression in existing functionality
- [ ] TUI does not break

---

## Execution Order

```
Phase 1: Plugin Session States
  └── WP1-T1: Between-Turn Detection
  └── WP1-T2: User-Stop Documentation
  └── WP1-T3: New Session Manipulation
  └── WP1-T4: Depth-Aware Injection
  └── GATE-1 ✓

Phase 2: Plugin Message Logic
  └── WP2-T1: Word Count Detection
  └── WP2-T2: Flow Indicator
  └── WP2-T3: Accumulated Scoring
  └── WP2-T4: Context Purification
  └── GATE-2 ✓

Phase 3: Agent Profiles
  └── WP3-T1: Add Scope Field
  └── WP3-T2: Add Agent Registry
  └── WP3-T3: Fix Delegation Targets
  └── WP3-T4: Fix idumb-executor
  └── GATE-3 ✓

Phase 4: Integration & Final
  └── ITS-1: Depth-Aware Test
  └── ITS-2: Short Message Test
  └── ITS-3: Long Message Test
  └── ITS-4: Registry Visibility Test
  └── GATE-FINAL ✓
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Plugin changes break TUI | Medium | High | Test each change in isolation |
| Message transform conflicts | Medium | Medium | Preserve existing message structure |
| Agent profile breaking changes | Low | Medium | Validate YAML after each edit |
| Depth tracking inaccurate | Medium | Medium | Add verbose logging |
| Accumulated score never resets | Low | Low | Ensure reset on purification |

---

## Notes

1. **All edits are to `template/` NOT `.opencode/`**
2. **Run `npm run install:local` after changes to test**
3. **Use `general` subagent for file writes, NOT `idumb-builder`**
4. **Checkpoint after each work package before proceeding**

---

*Created: 2026-02-03*
*Status: Draft - Awaiting Execution*
