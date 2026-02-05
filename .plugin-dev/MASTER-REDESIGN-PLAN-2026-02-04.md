# MASTER REDESIGN PLAN - iDumb Core Plugin

**Synthesis Date:** 2026-02-04  
**Synthesizer:** @idumb-research-synthesizer  
**Research Sources:**
- `PERMISSION-DENY-RESEARCH-2026-02-04.md` (486 lines)
- `SESSION-STATES-RESEARCH-2026-02-04.md` (557 lines)
- `MESSAGE-INTERCEPTION-RESEARCH-2026-02-04.md` (770 lines)
- `BRAIN-ARTIFACTS-RESEARCH-2026-02-04.md` (499 lines)

**Total Research Coverage:** 2,312 lines of analysis

---

## 1. Executive Summary

### What's Broken

The iDumb meta-framework has **4 critical systemic issues** that compound each other:

| Category | Issue | Impact |
|----------|-------|--------|
| **Memory Leak** | `popDelegationDepth()` defined but NEVER called | Delegation depth counter grows infinitely, false emergency halts |
| **Storage Explosion** | 180+ session files, 35+ halt checkpoints with NO garbage collection | Disk usage, performance degradation |
| **Permission Theater** | `permission.ask` hook is LOG-ONLY due to OpenCode bug #7006 | Security enforcement is theater, not reality |
| **Missing Features** | Word count detection, accumulated scoring, flow indicators | Context management is incomplete |

### The Fix Strategy

```
Phase 1: CRITICAL BUG FIXES (P0) → Must complete before ANY other work
    │
    ├── Fix popDelegationDepth() invocation
    ├── Implement garbage collection (sessions, halts)
    └── Add missing schema validation
         │
Phase 2: PERMISSION SYSTEM REDESIGN (P1) → Blocks agent behavior correctness
    │
    ├── Update all agent frontmatter patterns
    ├── Remove all "*": deny anti-patterns
    └── Add specific dangerous command denies
         │
Phase 3: SESSION STATE SYSTEM (P1) → Enables proper session tracking
    │
    ├── Add explicit sessionState field
    ├── Implement parent-child session linking
    └── Fix session level detection (L1/L2/L3)
         │
Phase 4: MESSAGE INTERCEPTION (P2) → Enables smart context management
    │
    ├── Implement word count detection
    ├── Add accumulated scoring with decay
    └── Implement flow indicator injection
         │
Phase 5: BRAIN ARTIFACTS (P2) → Completes lifecycle management
    │
    ├── Schema validation at runtime
    ├── Archive mechanisms
    └── Clean up unused directories
         │
Phase 6: AGENT PROFILES (P3) → Final polish for workflow managers
    │
    ├── Refactor as workflow managers
    └── Ensure resume handling compatibility
```

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Session files | 180+ | <20 (7-day rolling) | `ls .idumb/brain/sessions/ | wc -l` |
| Halt checkpoints | 35+ | ≤5 | `ls .idumb/brain/execution/ | grep halt | wc -l` |
| Delegation depth accuracy | ❌ Always grows | ✅ Accurate push/pop | Test spawn→complete cycle |
| `"*": deny` patterns | ~8 agents | 0 agents | `grep -r '"*": deny' template/agents/` |
| Schema validation | Not implemented | All Tier 1 artifacts | Runtime validation logs |
| Word count detection | Not implemented | Fully functional | Test short/long messages |

---

## 2. Critical Bugs (Immediate Fixes Required)

### BUG-001: `popDelegationDepth()` Never Called (P0-CRITICAL)

**Location:** `template/plugins/idumb-core.ts`

**Problem:**
```typescript
// Line 813-819: Function EXISTS but is NEVER INVOKED
function popDelegationDepth(sessionId: string): void {
  const tracker = sessionTrackers.get(sessionId)
  if (tracker && tracker.delegationDepth > 0) {
    tracker.delegationDepth--
    // ... stall detection cleanup
  }
}

// Line 3074-3110: Delegation depth INCREMENTED on task spawn
if (toolName === "task") {
  tracker.delegationDepth++  // ← PUSHED
  // ...
}

// Line 3188-3197: Task completion DOES NOT POP
if (toolName === "task") {
  // ... existing code
  // ❌ popDelegationDepth() NOT CALLED HERE
}
```

**Impact:**
- Delegation depth counter grows infinitely
- Reaches MAX_DELEGATION_DEPTH (3) incorrectly
- Triggers false EMERGENCY_HALT events
- Evidence: History shows multiple "MAX_DELEGATION_DEPTH_EXCEEDED" halts

**Fix:**
```typescript
// In tool.execute.after, around line 3191:
if (toolName === "task") {
  // ... existing code ...
  
  // FIX: Pop delegation depth on task completion
  popDelegationDepth(sessionId)
  
  // Also update persisted metadata
  const metadata = loadSessionMetadata(directory, sessionId)
  if (metadata) {
    const tracker = sessionTrackers.get(sessionId)
    metadata.delegationDepth = tracker?.delegationDepth || 0
    storeSessionMetadata(directory, sessionId, metadata)
  }
}
```

**Validation:**
```bash
# Test: Spawn and complete a task, verify depth returns to original
# Before: depth goes 0→1→2→3→HALT
# After:  depth goes 0→1→0 (correct)
```

---

### BUG-002: Session File Explosion (P0-CRITICAL)

**Location:** `.idumb/brain/sessions/`

**Problem:**
- 180+ session files accumulated
- `storeSessionMetadata()` creates files on every `session.created`
- NO deletion mechanism exists
- SYSTEM-MANIFEST.yaml documents 7-day retention but code doesn't implement it

**Impact:**
- Disk usage grows unbounded
- Directory listing operations slow down
- Confusing for debugging

**Fix:**
```typescript
// Add to template/plugins/idumb-core.ts after line 1850

function cleanupOldSessions(directory: string, retentionDays: number = 7): number {
  const sessionsDir = join(directory, ".idumb", "sessions")
  if (!existsSync(sessionsDir)) return 0
  
  const now = Date.now()
  const maxAge = retentionDays * 24 * 60 * 60 * 1000
  let deletedCount = 0
  
  const files = readdirSync(sessionsDir)
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    
    const filePath = join(sessionsDir, file)
    try {
      const data = JSON.parse(readFileSync(filePath, "utf8"))
      const createdAt = new Date(data.createdAt).getTime()
      
      if (now - createdAt > maxAge) {
        unlinkSync(filePath)
        log(directory, `[GC] Deleted old session: ${file}`)
        deletedCount++
      }
    } catch { /* ignore parse errors for corrupted files */ }
  }
  
  return deletedCount
}

// Call in session.created event handler (around line 2615):
// cleanupOldSessions(directory)
```

**Validation:**
```bash
# Before fix:
ls .idumb/brain/sessions/ | wc -l  # 180+

# After fix (run, wait, create new session):
ls .idumb/brain/sessions/ | wc -l  # <20 (files older than 7 days deleted)
```

---

### BUG-003: Halt Checkpoint Accumulation (P0-CRITICAL)

**Location:** `.idumb/brain/execution/halt-*/`

**Problem:**
- 35+ halt checkpoint directories
- `triggerEmergencyHalt()` creates but never purges
- Each halt stores full context snapshots

**Impact:**
- Disk usage grows with each emergency
- Old halts confuse debugging
- No way to identify "latest" halt quickly

**Fix:**
```typescript
// Add to template/plugins/idumb-core.ts

function cleanupHaltCheckpoints(directory: string, keepCount: number = 5): number {
  const executionDir = join(directory, ".idumb", "execution")
  if (!existsSync(executionDir)) return 0
  
  const halts = readdirSync(executionDir)
    .filter(d => d.startsWith("halt-"))
    .sort()  // Oldest first (timestamp-based names)
  
  let deletedCount = 0
  
  if (halts.length > keepCount) {
    const toDelete = halts.slice(0, halts.length - keepCount)
    for (const halt of toDelete) {
      const haltPath = join(executionDir, halt)
      rmSync(haltPath, { recursive: true, force: true })
      log(directory, `[GC] Deleted old halt checkpoint: ${halt}`)
      deletedCount++
    }
  }
  
  return deletedCount
}

// Call in session.created event handler:
// cleanupHaltCheckpoints(directory)
```

**Validation:**
```bash
# Before:
ls .idumb/brain/execution/ | grep halt | wc -l  # 35+

# After:
ls .idumb/brain/execution/ | grep halt | wc -l  # ≤5
```

---

### BUG-004: `permission.ask` Hook LOG-ONLY (P1-UPSTREAM)

**Location:** `template/plugins/idumb-core.ts` lines 2930-2991

**Problem:**
- OpenCode's `permission.ask` hook is defined in types but **NEVER TRIGGERED**
- GitHub issues #7006 and #9229 confirm this is an upstream bug
- Plugin's `output.status = "deny"` line is commented out because it has no effect
- All permission "enforcement" is currently just logging

**Root Cause (OpenCode source):**
```typescript
// packages/opencode/src/permission/next.ts:128-141
if (rule.action === "ask") {
  Bus.publish(Event.Asked, info)  // Emits "permission.asked", NOT plugin hook
  // Plugin.trigger("permission.ask", ...) is NEVER called
}
```

**Impact:**
- Permission enforcement is THEATER, not reality
- Agent frontmatter `permission:` blocks are the ONLY working mechanism
- Plugin cannot dynamically control permissions

**Workaround Strategy:**
```yaml
# Since permission.ask hook is broken, rely on:
1. Agent frontmatter permissions (works now)
2. tool.execute.before hook with throw Error (partial, doesn't work for alls)
3. Wait for OpenCode to fix #7006 (long-term)
```

**Immediate Fix (Agent Frontmatter):**
```yaml
# Update ALL agent profiles to use specific patterns
# Example: idumb-executor.md
---
permission:
  task:
    "idumb-builder": allow
    "idumb-low-validator": allow
    "general": allow
    # NO "*": deny - implicit deny for unspecified
  bash:
    "git status": allow
    "git diff*": allow
    "npm test*": allow
    # NO "*": deny
  edit: deny
  write: deny
---
```

---

## 3. Implementation Phases

### Phase 1: Critical Bug Fixes (P0)

**Duration:** 4-6 hours  
**Dependencies:** None  
**Risk Level:** LOW (isolated fixes)

| Task ID | Description | Location | Effort |
|---------|-------------|----------|--------|
| P1-T1 | Add `popDelegationDepth()` call in `tool.execute.after` | Line ~3191 | 30 min |
| P1-T2 | Implement `cleanupOldSessions()` | After line 1850 | 45 min |
| P1-T3 | Implement `cleanupHaltCheckpoints()` | After P1-T2 | 30 min |
| P1-T4 | Add GC calls in `session.created` hook | Line ~2615 | 15 min |
| P1-T5 | Implement plugin log rotation | New function | 30 min |
| P1-T6 | Add schema validation for state.json | New function | 1 hour |
| P1-T7 | Test all fixes in isolation | Manual testing | 1 hour |

**Validation Checkpoint:**
```bash
# After Phase 1 completion:
1. Create session, spawn task, verify depth returns to 0
2. Create 10 sessions, verify old ones auto-delete
3. Trigger 6 halts, verify only 5 remain
4. Verify plugin.log rotates at 1MB
5. Corrupt state.json, verify schema error logged
```

**Rollback Strategy:**
```bash
# Backup current plugin before changes:
cp template/plugins/idumb-core.ts template/plugins/idumb-core.ts.backup-p1

# If issues found:
cp template/plugins/idumb-core.ts.backup-p1 template/plugins/idumb-core.ts
npm run install:local  # Reinstall original
```

---

### Phase 2: Permission System Redesign (P1)

**Duration:** 6-8 hours  
**Dependencies:** Phase 1 complete  
**Risk Level:** MEDIUM (affects all agent behavior)

| Task ID | Description | Location | Effort |
|---------|-------------|----------|--------|
| P2-T1 | Audit all agent profiles for `"*": deny` | `template/agents/*.md` | 1 hour |
| P2-T2 | Remove all `"*": deny` patterns | Each agent file | 2 hours |
| P2-T3 | Add specific dangerous command denies | Agents with bash | 1 hour |
| P2-T4 | Update coordinator pattern (supreme, high-gov) | 2 agents | 1 hour |
| P2-T5 | Update executor pattern (executor, verifier, debugger) | 3 agents | 1 hour |
| P2-T6 | Update researcher pattern (all research agents) | 4 agents | 1 hour |
| P2-T7 | Update builder/validator pattern (leaf nodes) | 2 agents | 30 min |
| P2-T8 | Validate all patterns match documentation | Cross-check | 30 min |

**Agent Patterns to Apply:**

```yaml
# COORDINATOR (supreme-coordinator, high-governance):
permission:
  task:
    "idumb-high-governance": allow
    "idumb-executor": allow
    "idumb-planner": allow
    "idumb-verifier": allow
    "general": allow
    # NO "*" entry = implicit deny
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
    # NO "*" entry
  edit: deny
  write: deny

# EXECUTOR (executor, verifier, debugger):
permission:
  task:
    "idumb-builder": allow
    "idumb-low-validator": allow
    "general": allow
  bash:
    "git status": allow
    "git diff*": allow
    "npm test*": allow
    "pnpm test*": allow
  edit: deny
  write: deny

# RESEARCHER (all research agents):
permission:
  task:
    "general": allow  # For web search, exploration
  bash:
    "ls*": allow
    "cat*": allow
  edit: deny
  write: deny

# BUILDER (leaf executor):
permission:
  bash:
    "*": allow  # Needs full execution
    "rm -rf /": deny
    "rm -rf ~": deny
    "sudo *": deny
  edit: allow
  write: allow
  # Note: No task permission (leaf node)

# VALIDATOR (read-only leaf):
permission:
  bash:
    "grep*": allow
    "find*": allow
    "ls*": allow
    "cat*": allow
    "npm test*": allow
    "git status": allow
    "git diff*": allow
  edit: deny
  write: deny
```

**Validation Checkpoint:**
```bash
# After Phase 2 completion:
1. grep -r '"*": deny' template/agents/  # Should return 0 results
2. Test coordinator can spawn allowed alls
3. Test coordinator CANNOT spawn unspecified agents (implicit deny)
4. Test builder has full bash but not task
5. Test validator can only read, not write
```

**Rollback Strategy:**
```bash
# Backup agent profiles:
cp -r template/agents template/agents.backup-p2

# If issues:
rm -rf template/agents
mv template/agents.backup-p2 template/agents
npm run install:local
```

---

### Phase 3: Session State System (P1)

**Duration:** 8-10 hours  
**Dependencies:** Phase 1 complete  
**Risk Level:** MEDIUM (core state changes)

| Task ID | Description | Location | Effort |
|---------|-------------|----------|--------|
| P3-T1 | Extend `SessionMetadata` with `sessionState` field | Line ~1789 | 30 min |
| P3-T2 | Add `SessionState` type definition | New type | 15 min |
| P3-T3 | Add `sessionLevel` field (1/2/3) | Line ~1789 | 30 min |
| P3-T4 | Add `parentSession` tracking on task spawn | Line ~3074 | 1 hour |
| P3-T5 | Add `childSessions` array to parent metadata | Line ~3074 | 45 min |
| P3-T6 | Implement session level detection logic | New function | 1 hour |
| P3-T7 | Add state transition tracking | `stateHistory` array | 1 hour |
| P3-T8 | Add compaction history tracking | `compactionHistory` | 45 min |
| P3-T9 | Update `storeSessionMetadata()` for new fields | Line ~1812 | 1 hour |
| P3-T10 | Update `loadSessionMetadata()` for migrations | Line ~1853 | 1 hour |
| P3-T11 | Test all state transitions | Manual testing | 1 hour |

**New Type Definitions:**

```typescript
// Add after line 1806

type SessionState = 
  | "beginning"      // S1: Fresh conversation
  | "compacted"      // S2: After compaction
  | "between_turn"   // S3: Waiting for user
  | "executing"      // Active tool use
  | "interrupted"    // S4: User stopped (best-effort detection)
  | "custom"         // S5: Manipulated session
  | "idle"           // No activity
  | "stale"          // >48 hours idle

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
  
  // NEW: Explicit state tracking
  sessionState: SessionState
  previousState: SessionState | null
  stateHistory: Array<{ state: SessionState; timestamp: string }>
  
  // NEW: Delegation level (1 = primary, 2 = all, 3 = leaf)
  sessionLevel: 1 | 2 | 3
  
  // NEW: Child sessions spawned by this session
  childSessions?: Array<{
    sessionId: string
    agent: string
    createdAt: string
    completedAt?: string
  }>
  
  // EXISTING: Enhanced lifecycle
  compactedAt?: string
  contextSize?: string | number
  resumedAt?: string
  idleAt?: string
  
  // NEW: Compaction history
  compactionHistory?: Array<{
    timestamp: string
    contextSizeBefore: number
    contextSizeAfter: number
    anchorsSurvived: string[]
  }>
}
```

**Validation Checkpoint:**
```bash
# After Phase 3 completion:
1. Create session, verify sessionState: "beginning"
2. Trigger compaction, verify sessionState: "compacted"
3. Spawn all, verify sessionLevel: 2 on child
4. Verify parentSession links correctly
5. Complete task, verify childSessions updated
6. Check stateHistory has all transitions
```

**Rollback Strategy:**
```typescript
// Add migration function for old metadata:
function migrateSessionMetadata(oldData: any): SessionMetadata {
  return {
    ...oldData,
    sessionState: oldData.sessionState || "beginning",
    previousState: oldData.previousState || null,
    stateHistory: oldData.stateHistory || [],
    sessionLevel: oldData.sessionLevel || (oldData.parentSession ? 2 : 1),
    childSessions: oldData.childSessions || [],
    compactionHistory: oldData.compactionHistory || []
  }
}
```

---

### Phase 4: Message Interception (P2)

**Duration:** 10-12 hours  
**Dependencies:** Phases 1, 3 complete  
**Risk Level:** HIGH (TUI compatibility concerns)

| Task ID | Description | Location | Effort |
|---------|-------------|----------|--------|
| P4-T1 | Implement `countWords()` function | After line 1120 | 30 min |
| P4-T2 | Implement `containsFileContext()` function | After P4-T1 | 45 min |
| P4-T3 | Implement `isOtherToolMessage()` detection | After P4-T2 | 45 min |
| P4-T4 | Add other tool early-exit in messages.transform | Line ~2804 | 30 min |
| P4-T5 | Implement `buildFlowIndicator()` | New function | 1 hour |
| P4-T6 | Add short message detection (Scenario 2) | After line 2804 | 1 hour |
| P4-T7 | Implement `AccumulatedScore` interface | New interface | 30 min |
| P4-T8 | Implement `calculateMessageScore()` | New function | 1 hour |
| P4-T9 | Implement `applyScoreDecay()` | New function | 30 min |
| P4-T10 | Implement `updateAccumulatedScore()` | New function | 1 hour |
| P4-T11 | Add long message detection (Scenario 3) | After P4-T6 | 1 hour |
| P4-T12 | Implement `triggerContextPurification()` | New function | 1 hour |
| P4-T13 | Add purification context loading (Scenario 1) | Line ~2816 | 1 hour |
| P4-T14 | TUI compatibility testing | Manual testing | 2 hours |

**Core Functions to Implement:**

```typescript
// Word count detection
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// File context detection
function containsFileContext(text: string): boolean {
  const filePatterns = [
    /[\w-]+\.[a-zA-Z0-9]{1,6}/,     // filename.ext
    /\/[\w-]+(?:\/[\w-]+)*/,        // /path/to/file
    /\.[\\/][\w-]+/,                 // ./file
    /[A-Za-z]:\\[\w\\-]+/,           // Windows paths
  ]
  return filePatterns.some(pattern => pattern.test(text))
}

// Other tool message detection
function isOtherToolMessage(message: any): boolean {
  const text = message?.parts?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)?.join(' ') || ''
  
  const otherToolIndicators = [
    /\[Tool:\s*\w+\]/i,
    /Generated by\s+\w+/i,
    /\w+\s+tool\s+result/i,
    /Resume from\s+\w+/i,
    /Context from\s+\w+/i,
  ]
  
  const isIdumbMessage = text.includes('iDumb') || text.includes('idumb-')
  return otherToolIndicators.some(p => p.test(text)) && !isIdumbMessage
}

// Accumulated scoring
interface AccumulatedScore {
  currentScore: number
  lastUpdated: string
  messageCount: number
  history: Array<{ timestamp: string; score: number; reason: string }>
}

function calculateMessageScore(message: any): number {
  const text = message?.parts?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)?.join(' ') || ''
  
  let score = 0
  const wordCount = countWords(text)
  score += Math.floor(wordCount / 10)
  if (wordCount > 100) score += 5
  if (wordCount > 200) score += 10
  
  const fileMatches = text.match(/[\w-]+\.[a-zA-Z0-9]+/g) || []
  score += fileMatches.length * 3
  
  const codeBlocks = text.match(/```[\s\S]*?```/g) || []
  score += codeBlocks.length * 3
  
  const urls = text.match(/https?:\/\/[^\s]+/g) || []
  score += urls.length * 2
  
  return score
}
```

**Thresholds:**

| Level | Score Range | Action |
|-------|-------------|--------|
| Normal | 0-49 | No action |
| Warning | 50-99 | Log warning |
| Purify | 100-149 | Trigger context purification |
| Emergency | 150+ | Immediate compact trigger |

**Validation Checkpoint:**
```bash
# After Phase 4 completion:
1. Send short message (<20 words), verify flow indicator injected
2. Send long message (>30 words), verify score incremented
3. Send 10 messages, verify accumulated scoring
4. Wait 1 hour, verify decay applied (10% reduction)
5. Reach score 100, verify purification triggered
6. Test with code blocks, file paths, URLs
7. CRITICAL: Verify NO TUI background text exposure
```

**Rollback Strategy:**
```bash
# All new message interception code wrapped in try-catch
# If issues in production:
1. Disable by setting flag: IDUMB_DISABLE_MSG_INTERCEPTION=true
2. Or: Revert to Phase 3 backup

# Incremental rollout:
1. Start with LOG-ONLY mode (no injection)
2. Enable injection after 24h successful logging
```

---

### Phase 5: Brain Artifacts (P2)

**Duration:** 6-8 hours  
**Dependencies:** Phase 1 complete  
**Risk Level:** MEDIUM (file operations)

| Task ID | Description | Location | Effort |
|---------|-------------|----------|--------|
| P5-T1 | Create `config-schema.json` | `template/governance/` | 1 hour |
| P5-T2 | Create `session-schema.json` | `template/governance/` | 45 min |
| P5-T3 | Create `execution-metrics-schema.json` | `template/governance/` | 30 min |
| P5-T4 | Implement `validateAgainstSchema()` | New function | 1 hour |
| P5-T5 | Add validation calls in `ensureIdumbConfig()` | Line ~2238 | 45 min |
| P5-T6 | Implement archive mechanism for metrics | New function | 1 hour |
| P5-T7 | Clean up or implement `context/`, `history/`, `anchors/` | Line ~2276 | 1 hour |
| P5-T8 | Update SYSTEM-MANIFEST.yaml to reflect reality | Documentation | 1 hour |
| P5-T9 | Test all artifact lifecycle operations | Manual testing | 1 hour |

**Schema Files to Create:**

```json
// template/governance/config-schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "iDumb Config Schema",
  "type": "object",
  "required": ["version", "initialized", "user", "hierarchy", "automation"],
  "properties": {
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "initialized": { "type": "string", "format": "date-time" },
    "user": {
      "type": "object",
      "required": ["name", "experience", "language"],
      "properties": {
        "name": { "type": "string" },
        "experience": { "enum": ["pro", "guided", "strict"] },
        "language": {
          "type": "object",
          "properties": {
            "communication": { "type": "string", "default": "en" },
            "documents": { "type": "string", "default": "en" }
          }
        }
      }
    }
    // ... continue for hierarchy, automation, etc.
  }
}
```

**Directory Decision Matrix:**

| Directory | Current | Decision | Action |
|-----------|---------|----------|--------|
| `brain/context/` | Empty | REMOVE | Delete from `ensureIdumbConfig()` |
| `brain/history/` | Empty | IMPLEMENT | Archive old history entries |
| `anchors/` | Empty | REMOVE | Delete from `ensureIdumbConfig()` |

**Validation Checkpoint:**
```bash
# After Phase 5 completion:
1. Corrupt config.json, verify schema error logged
2. Corrupt state.json, verify schema error logged
3. Verify history/ archives entries >50
4. Verify context/ and anchors/ removed
5. Verify SYSTEM-MANIFEST.yaml matches implementation
```

---

### Phase 6: Agent Profiles (P3)

**Duration:** 4-6 hours  
**Dependencies:** Phases 2, 3 complete  
**Risk Level:** LOW (documentation changes)

| Task ID | Description | Location | Effort |
|---------|-------------|----------|--------|
| P6-T1 | Audit all agent profiles for workflow manager pattern | All agents | 1 hour |
| P6-T2 | Add workflow sections to coordinators | 4 agents | 1 hour |
| P6-T3 | Ensure resume handling doesn't conflict with resume tool | All agents | 1 hour |
| P6-T4 | Update Available Agents registry in all profiles | All agents | 1 hour |
| P6-T5 | Add standard Reporting Format to all agents | All agents | 1 hour |
| P6-T6 | Final validation of agent hierarchy | Cross-check | 1 hour |

**Workflow Manager Pattern:**

```yaml
# Every coordinator agent should have:

## Workflows

### Primary Workflow: [Name]
```sequence
TRIGGER: [When this workflow starts]
1. READ governance state → .idumb/brain/state.json
2. VALIDATE current context → check freshness, conflicts
3. DELEGATE to appropriate agent → /task agent [description]
4. WAIT for result → accumulate output
5. VALIDATE completion → check success criteria
6. REPORT to parent → structured output
```

### Error Recovery Workflow: [Name]
```sequence
TRIGGER: all failure or error
1. CAPTURE error context
2. DETERMINE severity
3. ESCALATE or RETRY based on severity
4. LOG to history
```
```

**Resume Handling Check:**

Ensure NO agent profile conflicts with OpenCode's built-in `/resume` tool by:
1. Not defining custom `resume` command in frontmatter
2. Using `resumedAt` field in session metadata (not conflicting name)
3. Using `buildResumeContext()` function which is complementary

---

## 4. Dependency Graph

```
PHASE 1: Critical Bug Fixes (P0)
    │
    ├───────────────────────────┐
    │                           │
    ▼                           ▼
PHASE 2: Permissions       PHASE 3: Sessions       PHASE 5: Artifacts
(P1)                       (P1)                     (P2)
    │                           │                       │
    │                           │                       │
    └───────────┬───────────────┘                       │
                │                                       │
                ▼                                       │
         PHASE 4: Message                               │
         Interception (P2)                              │
                │                                       │
                └───────────────┬───────────────────────┘
                                │
                                ▼
                         PHASE 6: Agent
                         Profiles (P3)


DEPENDENCY RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1 → BLOCKS ALL (must complete first)
Phase 2 → Can parallel with Phase 3
Phase 4 → Needs Phase 1 + Phase 3 (session state)
Phase 5 → Only needs Phase 1
Phase 6 → Needs Phase 2 + Phase 3
```

---

## 5. Validation Checkpoints

### After Each Phase

| Phase | Checkpoint | Command/Test | Expected Result |
|-------|------------|--------------|-----------------|
| **P1** | Delegation depth accuracy | Spawn and complete task | Depth returns to original |
| **P1** | Session cleanup | Wait 7 days or force-run | Only recent sessions remain |
| **P1** | Halt cleanup | Trigger 6+ halts | Only 5 checkpoints remain |
| **P2** | No `*: deny` patterns | `grep -r '"*": deny' template/agents/` | No matches |
| **P2** | Permission enforcement | Test coordinator delegation | Only allowed agents work |
| **P3** | Session state tracking | Create/compact/resume | State transitions logged |
| **P3** | Parent-child linking | Spawn all | Links correct |
| **P4** | Word count detection | Send short/long messages | Thresholds work |
| **P4** | Score accumulation | Send 10+ messages | Score increases with decay |
| **P4** | TUI safety | Run for 1 hour | No background text |
| **P5** | Schema validation | Corrupt artifacts | Errors logged |
| **P5** | MANIFEST accuracy | Compare doc vs code | Match |
| **P6** | Workflow manager pattern | Audit all coordinators | Workflows documented |

### Integration Tests

```bash
# Full E2E test after all phases:

1. Start fresh session
   → Verify: sessionState=beginning, sessionLevel=1

2. Spawn coordinator → executor → builder chain
   → Verify: Delegation depth increments correctly
   → Verify: Each child has parentSession set
   → Verify: sessionLevel = 1 → 2 → 3

3. Complete all tasks in reverse order
   → Verify: Delegation depth decrements correctly
   → Verify: childSessions.completedAt set

4. Send short message (<20 words)
   → Verify: Flow indicator injected

5. Send long message with code block (>30 words)
   → Verify: Score incremented
   → Verify: No TUI corruption

6. Wait 1 hour, send another message
   → Verify: Score decayed by ~10%

7. Force compaction
   → Verify: sessionState=compacted
   → Verify: compactionHistory entry added

8. Resume session
   → Verify: resumedAt set
   → Verify: Resume context built correctly

9. Check garbage collection
   → Verify: Old sessions deleted
   → Verify: Only 5 halt checkpoints remain
```

---

## 6. Rollback Strategy

### Per-Phase Rollback

| Phase | Backup Command | Restore Command |
|-------|----------------|-----------------|
| P1 | `cp template/plugins/idumb-core.ts template/plugins/idumb-core.ts.backup-p1` | `cp template/plugins/idumb-core.ts.backup-p1 template/plugins/idumb-core.ts` |
| P2 | `cp -r template/agents template/agents.backup-p2` | `rm -rf template/agents && mv template/agents.backup-p2 template/agents` |
| P3 | Same as P1 (plugin changes) | Same as P1 |
| P4 | Same as P1 (plugin changes) | Same as P1 |
| P5 | `cp -r template/governance template/governance.backup-p5` | `rm -rf template/governance && mv template/governance.backup-p5 template/governance` |
| P6 | Same as P2 (agent changes) | Same as P2 |

### Full Rollback

```bash
# If everything is broken:

1. Restore plugin:
   git checkout HEAD -- template/plugins/idumb-core.ts

2. Restore agents:
   git checkout HEAD -- template/agents/

3. Restore governance:
   git checkout HEAD -- template/governance/

4. Reinstall:
   npm run install:local

5. Clear runtime state:
   rm -rf .idumb/brain/sessions/*.json
   rm -rf .idumb/brain/execution/halt-*
```

### Feature Flags

```typescript
// Add to config.json for gradual rollout:
{
  "features": {
    "garbageCollection": true,      // Phase 1
    "strictPermissions": true,      // Phase 2
    "sessionStateTracking": true,   // Phase 3
    "messageInterception": false,   // Phase 4 (start disabled)
    "schemaValidation": true,       // Phase 5
    "workflowManager": true         // Phase 6
  }
}
```

---

## 7. Timeline Estimate

| Phase | Effort | Calendar Time | Dependencies |
|-------|--------|---------------|--------------|
| **Phase 1** | 4-6 hours | Day 1 | None |
| **Phase 2** | 6-8 hours | Day 1-2 | Phase 1 |
| **Phase 3** | 8-10 hours | Day 2-3 | Phase 1 |
| **Phase 4** | 10-12 hours | Day 3-4 | Phases 1, 3 |
| **Phase 5** | 6-8 hours | Day 2-3 (parallel with P3) | Phase 1 |
| **Phase 6** | 4-6 hours | Day 4-5 | Phases 2, 3 |
| **Integration Testing** | 4-6 hours | Day 5 | All phases |

**Total Estimated Effort:** 42-56 hours  
**Calendar Time:** 5 working days

### Optimal Execution Path

```
Day 1 (8 hours):
  └── Phase 1: Critical Bug Fixes (complete)
  └── Phase 2: Start permission audit

Day 2 (8 hours):
  └── Phase 2: Complete permission fixes
  └── Phase 3: Start session state changes
  └── Phase 5: Start (parallel) schema files

Day 3 (10 hours):
  └── Phase 3: Complete session state system
  └── Phase 5: Complete brain artifacts
  └── Phase 4: Start message interception

Day 4 (10 hours):
  └── Phase 4: Complete message interception
  └── Phase 6: Start agent profiles

Day 5 (8 hours):
  └── Phase 6: Complete agent profiles
  └── Integration testing
  └── Documentation updates
```

---

## 8. Success Criteria

### Phase Completion Criteria

| Phase | Success Criteria | Verification Method |
|-------|------------------|---------------------|
| **P1** | All 4 critical bugs fixed | Manual testing checklist |
| **P2** | Zero `"*": deny` patterns; all agents have specific permissions | `grep` scan |
| **P3** | Session state transitions work correctly; parent-child linking works | State inspection |
| **P4** | Word count, scoring, flow indicators all functional; NO TUI issues | 1-hour soak test |
| **P5** | Schema validation running; unused directories cleaned; MANIFEST accurate | Audit |
| **P6** | All coordinators have workflow manager pattern | Documentation review |

### Overall Success Criteria

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Session file count | <20 at any time | `ls .idumb/brain/sessions/ | wc -l` |
| Halt checkpoint count | ≤5 at any time | `ls .idumb/brain/execution/ | grep halt | wc -l` |
| Delegation depth accuracy | 100% accurate | Test: spawn→complete→verify=0 |
| Permission enforcement | 100% of agents | `grep -r '"*": deny'` = 0 |
| Schema validation | All Tier 1 artifacts | Corrupt → error logged |
| TUI stability | 0 background text issues | 1-hour soak test |
| Message interception | All 4 scenarios work | Scenario-by-scenario test |

### Definition of Done

```yaml
definition_of_done:
  - All phases completed per timeline
  - All validation checkpoints passed
  - Integration tests passing
  - No regression in existing functionality
  - Documentation updated (SYSTEM-MANIFEST.yaml, AGENTS.md)
  - All feature flags enabled in production config
  - 24-hour stability test passed
```

---

## 9. Cross-Domain Insights

### Insight 1: Garbage Collection is Cross-Cutting

**Domains:** Brain Artifacts, Session States, Execution
**Finding:** Lack of garbage collection affects multiple systems - sessions, halts, logs, timestamps
**Implication:** GC must be implemented as a unified system in Phase 1, not piecemeal

### Insight 2: Permission System Requires Two-Track Approach

**Domains:** Permissions, Agents
**Finding:** OpenCode upstream bug (#7006) means plugin-based permissions don't work
**Implication:** Must use agent frontmatter as primary, keep plugin as secondary (for when #7006 fixed)

### Insight 3: Message Interception Depends on Session State

**Domains:** Message Interception, Session States
**Finding:** Accumulated scoring needs session tracking to persist scores
**Implication:** Phase 3 (session states) must complete before Phase 4 (message interception)

### Insight 4: Schema Validation Prevents Silent Failures

**Domains:** Brain Artifacts, All
**Finding:** Corrupted files cause silent failures currently
**Implication:** Schema validation should be one of the first Phase 1 fixes

---

## 10. Risk Assessment

### High Risk Items

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TUI corruption from message injection | Medium | High | Start with LOG-ONLY mode; extensive testing |
| Permission changes break delegation | Medium | High | Test each agent pattern before applying broadly |
| Session state changes break resume | Low | High | Add migration function; test resume thoroughly |

### Medium Risk Items

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GC deletes needed files | Low | Medium | Conservative retention (7 days); keepCount for halts |
| Score decay too aggressive | Medium | Low | Configurable decay rate; easy to adjust |
| Schema validation too strict | Medium | Low | Start with warnings-only; migrate to errors |

### Low Risk Items

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agent profile updates incomplete | Low | Low | Systematic audit checklist |
| Documentation out of sync | Medium | Low | Update docs in same PR as code |

---

## 11. Open Questions

| Question | Domain | Priority | Research Needed |
|----------|--------|----------|-----------------|
| Will OpenCode ever fix #7006? | Permissions | P1 | Monitor GitHub issue |
| Can we detect user interruption (S4)? | Sessions | P2 | Investigate OpenCode events |
| What's the optimal score decay rate? | Message Interception | P2 | A/B testing after implementation |
| Should we archive vs delete old sessions? | Brain Artifacts | P3 | Disk usage vs debug needs analysis |

---

## 12. Source Attribution

### Technical Sources

| Source | Lines Analyzed | Key Findings |
|--------|----------------|--------------|
| `idumb-core.ts` | ~3300 | BUG-001 (`popDelegationDepth`), session tracking, message hooks |
| Agent profiles (18 files) | ~5000 | Permission patterns, anti-patterns |
| Schema files | ~200 | Existing validation structure |

### Research Sources

| Source | Lines | Key Findings |
|--------|-------|--------------|
| `PERMISSION-DENY-RESEARCH-2026-02-04.md` | 486 | OpenCode bug #7006, pattern recommendations |
| `SESSION-STATES-RESEARCH-2026-02-04.md` | 557 | 5 states, 3 levels, gap analysis |
| `MESSAGE-INTERCEPTION-RESEARCH-2026-02-04.md` | 770 | 4 scenarios, scoring algorithm, TUI safety |
| `BRAIN-ARTIFACTS-RESEARCH-2026-02-04.md` | 499 | Storage explosion, schema gaps, GC policy |

### External Sources

| Source | Relevance |
|--------|-----------|
| OpenCode GitHub #7006 | `permission.ask` hook broken |
| OpenCode GitHub #9229 | Duplicate confirming #7006 |
| OpenCode GitHub #5894 | all tool calls bypass hooks |
| OpenCode Docs (permissions) | Pattern syntax reference |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-04 | Initial master redesign plan synthesized |

---

*Synthesized by @idumb-research-synthesizer*  
*Date: 2026-02-04*  
*Total Research Analyzed: 2,312 lines across 4 documents*
