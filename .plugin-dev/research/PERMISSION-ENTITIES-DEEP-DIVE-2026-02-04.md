# Permission Entities Deep Dive

**Created:** 2026-02-04
**Researcher:** @idumb-phase-researcher
**Source Files:** `src/plugins/idumb-core.ts` (3,371 lines), 18 agent profiles, 7 tools

---

## Executive Summary

This document maps ALL entities involved with permissions in the iDumb plugin system. The analysis reveals a **multi-layered enforcement architecture** with 7 OpenCode hooks, 4 in-memory state maps, 5 session states, 3 delegation levels, 3 agent modes, and multiple interception points.

**Key Findings:**
- Permission system is currently **LOG-ONLY** (intentional for development)
- `permission.ask` hook confirmed non-functional (GitHub #7006)
- Real enforcement happens via `tool.execute.after` output replacement
- Agent frontmatter is the PRIMARY enforcement mechanism
- 18 agents with 3 distinct modes and varying permission scopes

---

## 1. OpenCode Hooks

The iDumb plugin uses 7 OpenCode hooks for interception and governance:

### 1.1 `event` (Session Lifecycle Events)
```typescript
event: async ({ event }: { event: any }) => { ... }
```

| Event Type | Trigger Point | What It Can Do | Return Value | Enforcement Level |
|------------|---------------|----------------|--------------|-------------------|
| `session.created` | New session starts | Initialize tracker, ensure config, store metadata, init metrics | void | SETUP |
| `session.idle` | Session becomes idle | Archive session stats, update metadata, cleanup tracker | void | CLEANUP |
| `session.compacted` | Context compacted | Reset governanceInjected flag for re-injection | void | RE-INJECT |
| `session.resumed` | Session resumes | Re-initialize tracker, load metadata | void | SETUP |
| `permission.replied` | User accepts/denies | Log permission decisions, track patterns | void | LOGGING |
| `command.executed` | Command runs | Track iDumb commands in history | void | LOGGING |
| `error` | Error occurs | Track errors in metrics, check limits | void | MONITORING |

**Lines in source:** 2604-2768

### 1.2 `experimental.session.compacting`
```typescript
"experimental.session.compacting": async (input, output) => { ... }
```

| Aspect | Details |
|--------|---------|
| Trigger | OpenCode triggers context compaction |
| Capabilities | Inject context into `output.context[]` array |
| Return Value | Modifies `output.context[]` in place |
| Enforcement | CONTEXT PRESERVATION - injects anchors, state, history |
| Lines | 2775-2791 |

**Injection includes:**
- Language settings (CRITICAL - survives compaction)
- Current phase and framework
- Critical/high priority anchors
- Last 5 history entries

### 1.3 `experimental.chat.messages.transform`
```typescript
"experimental.chat.messages.transform": async (input: any, output: any) => { ... }
```

| Aspect | Details |
|--------|---------|
| Trigger | Before messages processed by LLM |
| Capabilities | Modify `output.messages[]`, inject governance prefix |
| Return Value | Modifies messages in place |
| Enforcement | GOVERNANCE INJECTION |
| Lines | 2797-2924 |

**Two injection points:**
1. **Session Start (Entry Point 1):** Injects governance prefix based on agent role
2. **Post-Compact Detection (Entry Point 2):** Injects post-compaction reminder

**Detection Methods:**
- Session start: `userMessages.length <= 1 && !tracker.governanceInjected`
- Resumption: `checkIfResumedSession()` - idle 1-48 hours
- Compaction: Keywords like "compacted", "summary of our conversation", or message count < 5

### 1.4 `permission.ask`
```typescript
"permission.ask": async (input: any, output: any) => { ... }
```

| Aspect | Details |
|--------|---------|
| Trigger | Before tool requires permission |
| Capabilities | Can set `output.status = "deny"` (but currently LOG-ONLY) |
| Return Value | Modifies `output.status` |
| Enforcement | **INTENTIONALLY DISABLED** - LOG ONLY |
| Lines | 2930-2991 |

**CRITICAL FINDING:**
- This hook is **LOG-ONLY** per line 2954-2956:
  ```typescript
  // LOG ONLY - DO NOT DENY
  // output.status = "deny"
  log(directory, `[WARN] ${agentRole} permission for ${toolName} - LOG ONLY, not blocking`)
  ```
- GitHub issue #7006 confirms the permission.ask hook is broken
- Violations are tracked but NOT blocked

### 1.5 `tool.execute.before`
```typescript
"tool.execute.before": async (input: any, output: any) => { ... }
```

| Aspect | Details |
|--------|---------|
| Trigger | Before tool executes |
| Capabilities | Track first tool, log violations, track delegation depth, block delegation |
| Return Value | Can modify `output.args` to block |
| Enforcement | TRACKING + DEPTH BLOCKING |
| Lines | 3002-3129 |

**What it tracks:**
1. **First Tool Enforcement:** Checks if first tool is in required list
2. **File Modification:** Logs (but doesn't block) write/edit by non-builders
3. **General Permission:** Logs (but doesn't block) unauthorized tools
4. **Delegation Tracking:** Tracks delegation depth, CAN block if > 3

**The ONLY hard block:** Max delegation depth exceeded (line 3087-3109):
```typescript
if (delegationResult.maxReached) {
  output.args = {
    __BLOCKED_BY_GOVERNANCE__: true,
    __VIOLATION__: "Maximum delegation depth exceeded (max: 3)",
    __HALT_MESSAGE__: haltMessage
  }
}
```

### 1.6 `tool.execute.after`
```typescript
"tool.execute.after": async (input: any, output: any) => { ... }
```

| Aspect | Details |
|--------|---------|
| Trigger | After tool executes |
| Capabilities | Replace entire output, track task completions |
| Return Value | Can completely replace `output.output` |
| Enforcement | OUTPUT REPLACEMENT (when shouldBlock=true) |
| Lines | 3131-3218 |

**CRITICAL FINDING - This is the REAL enforcement point:**
```typescript
if (violation && violation.shouldBlock && toolName === violation.tool) {
  output.output = guidance  // COMPLETELY REPLACES tool output
  output.title = `🚫 BLOCKED: ${violation.agent} cannot use ${toolName}`
  pendingDenials.delete(sessionId)
  return  // STOP PROCESSING
}
```

**However:** `shouldBlock` is currently always `false` (LOG-ONLY mode).

### 1.7 `command.execute.before`
```typescript
"command.execute.before": async (input, output) => { ... }
```

| Aspect | Details |
|--------|---------|
| Trigger | Before slash command executes |
| Capabilities | Block command, inject warning/error text |
| Return Value | Modifies `output.parts[]` |
| Enforcement | CHAIN ENFORCEMENT (HARD_BLOCK or WARN) |
| Lines | 3232-3354 |

**Chain Rules Applied:**
- `INIT-01`: All `/idumb:*` commands require `state.json` except init/help
- `PROJ-01`: `/idumb:roadmap` requires `PROJECT.md`
- `PROJ-02`: `/idumb:discuss-phase` requires `ROADMAP.md`
- `PHASE-01`: `/idumb:execute-phase` requires `PLAN.md`
- `PHASE-02`: `/idumb:execute-phase` should have `CONTEXT.md` (warning only)
- `PHASE-03`: `/idumb:verify-work` requires execution evidence
- `VAL-01`: Phase complete requires `VERIFICATION.md`

---

## 2. In-Memory State Maps

Four in-memory maps track session state:

### 2.1 `sessionTrackers`
```typescript
const sessionTrackers = new Map<string, SessionTracker>()
```

| Field | Type | Purpose |
|-------|------|---------|
| `firstToolUsed` | boolean | Has first tool been executed? |
| `firstToolName` | string | Which tool was used first |
| `agentRole` | string | Detected agent role (e.g., "idumb-supreme-coordinator") |
| `delegationDepth` | number | Current delegation nesting level |
| `parentSession` | string | Parent session ID if delegated |
| `violationCount` | number | Total violations in this session |
| `governanceInjected` | boolean | Has governance prefix been injected? |

**Lifecycle:**
- **Write:** `getSessionTracker()` (line 1060), `event.type === "session.created"`
- **Read:** Every hook that needs session context
- **Delete:** `event.type === "session.idle"` (line 2688)

**Lines:** 1041, 1060-1073

### 2.2 `pendingDenials`
```typescript
const pendingDenials = new Map<string, {
  agent: string
  tool: string
  timestamp: string
  shouldBlock: boolean  // When true, tool.execute.after REPLACES output
}>()
```

**Lifecycle:**
- **Write:** `permission.ask` hook when violation detected (line 2959)
- **Read:** `tool.execute.after` for output replacement (line 3143)
- **Delete:** After output replaced (line 3153)

**Lines:** 1044-1049

### 2.3 `pendingViolations`
```typescript
const pendingViolations = new Map<string, {
  agent: string
  tool: string
  timestamp: string
  violations: string[]
  shouldBlock: boolean
}>()
```

**Lifecycle:**
- **Write:** `permission.ask` hook (line 2967)
- **Read:** `tool.execute.after` via `consumeValidationResult()` (line 3165)
- **Delete:** Via `consumeValidationResult()` (line 1088)

**Lines:** 1052-1058

### 2.4 `stallDetectionState`
```typescript
const stallDetectionState = new Map<string, StallDetection>()
```

| Component | Structure | Purpose |
|-----------|-----------|---------|
| `plannerChecker` | `{issuesHashHistory[], stallCount, lastScore, scoreHistory[]}` | Detect planner-checker loops |
| `validatorFix` | `{errorHashHistory[], repeatCount}` | Detect same-error loops |
| `delegation` | `{depth, callStack[]}` | Track delegation depth |

**Lifecycle:**
- **Write:** `getStallDetectionState()` (line 690), track functions
- **Read:** `detectPlannerCheckerStall()`, `detectValidatorFixStall()`, `trackDelegationDepth()`
- **Pop:** `popDelegationDepth()` called in `tool.execute.after` (line 3195)

**Lines:** 688-710

---

## 3. Session States (5 States)

### 3.1 Beginning New Conversation
**Detection:**
```typescript
const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
```

**Governance Behavior:**
- Initialize session tracker
- Ensure config exists (auto-generate if missing)
- Store session metadata
- Initialize execution metrics
- Initialize stall detection state
- Inject governance prefix via `buildGovernancePrefix()`

**Injection Points:**
- Language enforcement (ABSOLUTE PRIORITY)
- Role-specific rules (NEVER execute, ALWAYS delegate, etc.)
- First action required based on role
- Current phase and framework context
- TODO count and stale state warnings

### 3.2 Compact Message (Innate OR Manipulated)
**Detection:**
```typescript
const compactionIndicators = ['compacted', 'summary of our conversation', ...]
const contextLossIndicators = ["i'll need you to provide", "can you remind me", ...]
const hasLowMessageCount = output.messages.length < 5 && tracker.governanceInjected

const isCompacted = hasCompactionKeyword || hasContextLossIndicator || hasLowMessageCount
```

**Governance Behavior:**
- Inject `buildPostCompactReminder()` to last message
- Includes language enforcement (MUST SURVIVE COMPACTION)
- Recent history (last 3 actions)
- Critical anchors
- Recommended next steps
- Hierarchy reminder

**Injection Points:**
- Post-compaction reminder appended to last message part

### 3.3 Between-Turn After Assistant Message
**Detection:** Normal flow, no special detection

**Governance Behavior:**
- All hooks fire normally
- Tool interception active
- Violations logged (not blocked in LOG-ONLY mode)
- Delegation depth tracked

**Injection Points:**
- None during normal turns (already injected at session start)

### 3.4 User Stops Action Before Completion
**Detection:** Via `session.idle` event

**Governance Behavior:**
- Archive session stats to history
- Update session metadata with idle timestamp
- Clean up session tracker (but keep metadata for resumption)
- Log violations encountered

**Injection Points:**
- None (session is ending)

### 3.5 New Session Manipulation / Resumption
**Detection:**
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

**Governance Behavior:**
- Prepend resume context before governance prefix
- Include idle duration
- Include previous session timestamp
- Include active anchors

**Injection Points:**
- `buildResumeContext()` + `buildGovernancePrefix()` combined

---

## 4. Delegation Hierarchy (3 Levels)

### Level 0: User ↔ Coordinator
**User Control:** FULL
**Enforcement Level:** ALL HOOKS ACTIVE
**Interception Possible:** Complete

| Aspect | Details |
|--------|---------|
| Scope | Direct user interaction with primary agent |
| Agents | `idumb-supreme-coordinator` (mode: primary) |
| Governance | Full governance prefix injected |
| Tools Available | Tier 1 tools + read context tools |
| Can Delegate To | ALL 17 other agents |

### Level 1: First Delegation
**User Control:** CAN STOP (via Escape key in OpenCode)
**Enforcement Level:** FULL HOOKS + DELEGATION TRACKING
**Interception Possible:** Tool interception, output can be replaced

| Aspect | Details |
|--------|---------|
| Scope | First all spawned by coordinator |
| Agents | `idumb-high-governance`, `idumb-mid-coordinator`, etc. |
| Tracking | `tracker.delegationDepth++`, `trackDelegationDepth()` |
| Spawn Tracking | `trackAgentSpawn()` updates execution metrics |
| Parent Link | Potentially set via `tracker.parentSession` |

### Level 2+: Nested Delegations
**User Control:** OPAQUE (user doesn't see all work directly)
**Enforcement Level:** LOG ONLY (in current implementation)
**Interception Possible:** Limited - mainly logging

| Aspect | Details |
|--------|---------|
| Scope | alls spawning alls |
| Max Depth | 3 (enforced via `trackDelegationDepth()`) |
| Violation | `MAX_DELEGATION_DEPTH_EXCEEDED` triggers emergency halt |
| Pop Mechanism | `popDelegationDepth()` called on task completion |

**Critical Fix Applied:**
Line 3195 shows `popDelegationDepth(sessionId)` is now called in `tool.execute.after` when task completes. This fixes the bug where delegation stack grew indefinitely.

---

## 5. Agent Modes

### 5.1 `primary` Mode
**Definition:** Entry point agent, receives user input directly
**Agents:** 
- `idumb-supreme-coordinator`

**Permissions Differ:**
- Full tool access for Tier 1 tools
- Can delegate to ALL other agents
- Never executes directly
- `bash: deny` for write operations, `allow` for read-only git commands
- `edit: deny`, `write: deny`

### 5.2 `all` Mode
**Definition:** Can be used at any hierarchy level (top-level or all)
**Agents:**
- `idumb-high-governance`
- `idumb-mid-coordinator`

**Permissions Differ:**
- Full tool access for Tier 1/2 tools
- Can delegate to most agents
- Never executes directly
- `bash: allow` for tests and git, deny for others
- `edit: deny`, `write: deny`

### 5.3 `all` Mode
**Definition:** Hidden, delegated to by higher agents, not user-invocable
**Agents:** (15 agents)
- `idumb-builder` (LEAF - can write)
- `idumb-low-validator` (LEAF - read-only)
- `idumb-executor`
- `idumb-verifier`
- `idumb-debugger`
- `idumb-planner`
- `idumb-plan-checker`
- `idumb-roadmapper`
- `idumb-project-researcher`
- `idumb-phase-researcher`
- `idumb-research-synthesizer`
- `idumb-codebase-mapper`
- `idumb-integration-checker`
- `idumb-skeptic-validator`
- `idumb-project-explorer`

**Permissions Matrix by Scope:**

| Scope | Can Delegate To | bash | edit | write |
|-------|-----------------|------|------|-------|
| `meta` (builder) | none (leaf) | `"*": allow` | allow | allow |
| `meta` (validator) | none (leaf) | `grep*, find*, ls*, cat*, test*` | deny | deny |
| `project` | general, verifier, debugger | `test*, git status/diff/log` | deny | deny |
| `bridge` | general | `git status, ls*` | deny | deny |

---

## 6. Interception Points

### 6.1 Prompts (Injected Context)
| Location | What's Injected | Trigger |
|----------|-----------------|---------|
| Session start | `buildGovernancePrefix()` | First user message, not yet injected |
| Session resume | `buildResumeContext()` + governance prefix | Session idle 1-48 hours |
| Post-compaction | `buildPostCompactReminder()` | Compaction detected |
| Context compaction | `buildCompactionContext()` | OpenCode triggers compaction |

### 6.2 Commands (Slash Commands)
| Command Pattern | Enforcement | Rule ID |
|-----------------|-------------|---------|
| `/idumb:*` (except init, help) | state.json must exist | INIT-01 |
| `/idumb:roadmap` | PROJECT.md must exist | PROJ-01 |
| `/idumb:discuss-phase` | ROADMAP.md must exist | PROJ-02 |
| `/idumb:execute-phase` | PLAN.md must exist | PHASE-01 |
| `/idumb:verify-work` | Execution evidence required | PHASE-03 |
| `state.phase = 'complete'` | VERIFICATION.md must exist | VAL-01 |

**Bypass Conditions:**
- `--force` flag (for SOFT_BLOCK only)
- `--emergency` or `--bypass-chain` (skip all chain checks)
- Readonly commands: `/idumb:status`, `/idumb:help`, `/idumb:validate`, `/idumb:init`

### 6.3 Context Adjustment Entities with "Unclear Hierarchy"
These entities can emulate or adjust context:

| Entity | How It Adjusts Context | Hierarchy Clarity |
|--------|------------------------|-------------------|
| Agent frontmatter | `permission:` section defines allowed actions | CLEAR - parsed by OpenCode |
| Plugin hooks | Inject text into messages, replace outputs | CLEAR - explicit code |
| buildGovernancePrefix() | Injects role-specific instructions | CLEAR - explicit function |
| buildPostCompactReminder() | Injects post-compaction context | CLEAR - explicit function |
| buildCompactionContext() | Injects anchors/history during compaction | CLEAR - explicit function |
| State anchors | Survive compaction, injected as context | SEMI-CLEAR - persistence mechanism |
| Session metadata | Stores context for resumption | CLEAR - file-based |
| pendingDenials/Violations | Bridge between hooks | CLEAR - in-memory maps |

---

## 7. Entity Relationship Matrix

### Who Affects Whom

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Level 0)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ INPUT → [command.execute.before] → CHAIN ENFORCEMENT        │   │
│  │         [messages.transform] → GOVERNANCE PREFIX            │   │
│  │         [permission.ask] → LOG ONLY (not blocking)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│           idumb-supreme-coordinator (mode: primary)                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ frontmatter → task: allow to 17 agents                      │   │
│  │              → edit: deny, write: deny                      │   │
│  │ tools: task, todoread, read, glob, grep, idumb-*            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ DELEGATION (Level 1)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Tier 1: Coordinators                              │
│  ┌────────────────────────┐  ┌────────────────────────┐             │
│  │ idumb-high-governance  │  │ idumb-mid-coordinator  │             │
│  │ mode: all, scope: meta │  │ mode: all, scope: bridge│            │
│  │ Can delegate to: ALL   │  │ Can delegate to: project│            │
│  └──────────┬─────────────┘  └──────────┬─────────────┘             │
└─────────────┼────────────────────────────┼───────────────────────────┘
              │                            │ DELEGATION (Level 2+)
              ▼                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Tier 2: Executors/Planners                        │
│  ┌──────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ idumb-executor│ │idumb-planner│ │idumb-verifier│ │idumb-debugger│ │
│  │ scope: project│ │scope: bridge│ │scope: project│ │scope: project│ │
│  │ delegate: gen │ │delegate: gen│ │delegate: gen │ │delegate: gen │ │
│  └──────────────┘ └────────────┘ └────────────┘ └────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Tier 3: Leaf Nodes                                │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │     idumb-builder        │  │   idumb-low-validator    │         │
│  │     mode: all       │  │     mode: all       │         │
│  │     scope: meta          │  │     scope: meta          │         │
│  │  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │         │
│  │  │ ONLY agent that can │ │  │  │ Read-only validation│ │         │
│  │  │ write/edit files    │ │  │  │ No file modification│ │         │
│  │  │ bash: "*": allow    │ │  │  │ bash: grep, ls, test│ │         │
│  │  │ Delegate: NONE      │ │  │  │ Delegate: NONE      │ │         │
│  │  └─────────────────────┘ │  │  └─────────────────────┘ │         │
│  └──────────────────────────┘  └──────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────┘
```

### Order of Operations

```
1. User input received
   ↓
2. [command.execute.before] - Chain enforcement (PROJ-01, PHASE-01, etc.)
   ↓
3. [messages.transform] - Governance prefix injection
   ↓
4. LLM processes with injected context
   ↓
5. LLM requests tool use
   ↓
6. [permission.ask] - LOG ONLY (shouldBlock=false)
   ↓
7. [tool.execute.before] - Track first tool, delegation depth
   ↓
8. Tool executes
   ↓
9. [tool.execute.after] - Output replacement IF shouldBlock=true
   ↓
10. Result returned to LLM
   ↓
11. If task tool: popDelegationDepth() called
   ↓
12. [session.idle] - Cleanup when session ends
```

---

## 8. Gaps and Conflicts Found

### 8.1 Critical Issues

| Issue | Location | Impact | Status |
|-------|----------|--------|--------|
| `permission.ask` is LOG-ONLY | Line 2954-2956 | No real permission blocking | INTENTIONAL (dev mode) |
| `shouldBlock` always false | Line 2963, 2972 | `tool.execute.after` never replaces output | INTENTIONAL (dev mode) |
| GitHub #7006 | OpenCode | permission.ask hook broken | KNOWN BUG |

### 8.2 Design Gaps

| Gap | Description | Recommendation |
|-----|-------------|----------------|
| No ENV flag for enforcement | LOG-ONLY vs BLOCKING mode hardcoded | Add `IDUMB_ENFORCE=true` env var |
| Agent detection unreliable | `detectAgentFromMessages()` searches message text | Use session metadata or OpenCode API |
| Session tracker not persisted | In-memory only, lost on restart | Already have file-based metadata, use it |
| `parentSession` never set | Always null in tracker | Implement parent tracking in task delegation |

### 8.3 Conflicts Between Intended Design and Implementation

| Intended | Implemented | Conflict |
|----------|-------------|----------|
| `permission.ask` should auto-deny | Logs only, doesn't deny | Intentional for development |
| Coordinators can't write | `edit: deny, write: deny` in frontmatter | Correctly enforced via frontmatter |
| Builder is only writer | `bash: "*": allow, edit: allow, write: allow` | Correctly enforced via frontmatter |
| Max 3 delegation depth | Enforced via `trackDelegationDepth()` | Working correctly (with popDelegationDepth fix) |

### 8.4 Inconsistencies

| Issue | Details |
|-------|---------|
| Tool list variations | `getAllowedTools()` vs frontmatter `tools:` may differ |
| `requiredFirstTools` mismatch | Config says `["read", "glob"]`, code says `["idumb-todo", "idumb-state"]` |
| `"*": ask` in mid-coordinator | Only agent with wildcard ask pattern |
| `idumb-builder` has no `task` permission | Correct (leaf node), but not explicit in frontmatter |

### 8.5 Session File Accumulation

| Directory | File Count | Status |
|-----------|------------|--------|
| `.idumb/brain/sessions/` | 190+ session files | GC tool exists, waiting for 7-day age |
| `.idumb/brain/execution/halt-*/` | 49+ halt checkpoints | GC tool exists, waiting for 7-day age |

---

## 9. Tool Permission Matrix Summary

| Tool Family | Coordinator | Governance | Executor | Builder | Validator |
|-------------|-------------|------------|----------|---------|-----------|
| task | ✅ | ✅ | ✅ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ | ✅ | ✅ |
| glob | ✅ | ✅ | ✅ | ✅ | ✅ |
| grep | ✅ | ✅ | ✅ | ✅ | ✅ |
| write | ❌ | ❌ | ❌ | ✅ | ❌ |
| edit | ❌ | ❌ | ❌ | ✅ | ❌ |
| bash | ❌* | ❌* | ✅* | ✅ | ✅* |
| idumb-state | ✅ | ✅ | ✅ | ✅ | ✅ |
| idumb-validate | ✅ | ✅ | ✅ | ❌ | ✅ |
| idumb-todo | ✅ | ✅ | ✅ | ✅ | ✅ |

*bash permissions are pattern-matched: git commands allowed for most, `*` allowed only for builder

---

## 10. Summary Tables

### Hooks Summary
| Hook | Can Block? | Currently Blocks? | Primary Purpose |
|------|------------|-------------------|-----------------|
| event | No | No | Lifecycle tracking |
| session.compacting | No | No | Context preservation |
| messages.transform | No | No | Governance injection |
| permission.ask | Yes | **NO (LOG-ONLY)** | Tool permission |
| tool.execute.before | Yes* | Only delegation depth | First-tool, delegation |
| tool.execute.after | Yes | **NO (shouldBlock=false)** | Output replacement |
| command.execute.before | Yes | **YES** | Chain enforcement |

### State Maps Summary
| Map | Persisted? | Scope | Primary Use |
|-----|------------|-------|-------------|
| sessionTrackers | No (memory) | Session | Agent role, violations |
| pendingDenials | No (memory) | Session | Cross-hook denial state |
| pendingViolations | No (memory) | Session | Cross-hook validation state |
| stallDetectionState | No (memory) | Session | Loop detection |

### Enforcement Levels
| Level | Hook | Action | Currently Active |
|-------|------|--------|------------------|
| HARD_BLOCK | command.execute.before | Blocks command | ✅ YES |
| SOFT_BLOCK | command.execute.before | Blocks unless --force | ✅ YES |
| WARN | command.execute.before | Warning only | ✅ YES |
| OUTPUT_REPLACE | tool.execute.after | Replaces output | ❌ NO (shouldBlock=false) |
| DEPTH_BLOCK | tool.execute.before | Blocks delegation | ✅ YES (depth > 3) |
| LOG_ONLY | permission.ask | Logs violation | ✅ YES (default) |

---

## Appendix: Key Source Code Locations

| Component | File | Lines |
|-----------|------|-------|
| State interfaces | idumb-core.ts | 24-48 |
| Session tracker interface | idumb-core.ts | 1030-1038 |
| Tool permission matrix | idumb-core.ts | 1122-1213 |
| Governance prefix builder | idumb-core.ts | 1251-1391 |
| Chain rules | idumb-core.ts | 889-973 |
| Plugin export | idumb-core.ts | 2596-3370 |
| Stall detection | idumb-core.ts | 683-883 |
| Checkpoint management | idumb-core.ts | 177-510 |

---

*Document generated by @idumb-phase-researcher - 2026-02-04*
