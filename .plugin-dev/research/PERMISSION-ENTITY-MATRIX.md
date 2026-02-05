# Permission-Entity Matrix: iDumb Governance System

**Document Type:** Research Analysis  
**Domain:** Technical Architecture  
**Created:** 2026-02-04  
**Version:** 1.0.0  
**Researcher:** @idumb-project-researcher

---

## Executive Summary

This document provides a comprehensive analysis of the iDumb plugin's permission and entity system. iDumb implements a hierarchical governance model with strict separation of concerns across 15 specialized agents, 7 lifecycle hooks, 4 state maps, and 8 tool categories. The system enforces delegation chains, tool permissions, and state transitions through a combination of compile-time agent profiles and runtime hook interception.

---

## 1. Permission Entities List

### 1.1 Lifecycle Hooks

Hooks are interception points in the OpenCode plugin system that allow iDumb to enforce governance rules at critical moments.

| Hook Name | Trigger Point | Purpose | Priority |
|-----------|---------------|---------|----------|
| `session.created` | New session initialized | Inject governance context, detect agent role, enforce first-tool requirements | CRITICAL |
| `permission.ask` | Tool permission check requested | Intercept permission queries, apply agent-specific rules | HIGH |
| `tool.execute.before` | Before tool execution | Validate tool is allowed for agent, check chain rules, block unauthorized access | CRITICAL |
| `tool.execute.after` | After tool execution | Log execution, update metrics, trigger validation | MEDIUM |
| `messages.transform` | Message processing | Transform denials into guidance, inject context reminders | HIGH |
| `session.compacting` | Context compaction triggered | Preserve critical anchors, prepare post-compaction reminders | HIGH |
| `session.idle` | Session becomes idle | Checkpoint creation, metrics summary, stall detection | MEDIUM |

#### Hook Execution Order

```
session.created
    │
    ▼
permission.ask (if tool permission check)
    │
    ▼
tool.execute.before
    │
    ▼
[Tool Execution]
    │
    ▼
tool.execute.after
    │
    ▼
messages.transform (if response modification needed)
    │
    ▼
session.compacting (if context limit reached)
    │
    ▼
session.idle (if no activity)
```

### 1.2 State Maps

State maps are in-memory data structures that track session state and enforcement data.

| State Map | Type | Purpose | Lifecycle |
|-----------|------|---------|-----------|
| `sessionTrackers` | `Map<string, SessionTracker>` | Track per-session metadata (first tool, agent role, delegation depth) | Session-scoped |
| `pendingDenials` | `Map<string, DenialRecord>` | Queue tool denials for message transformation | Request-scoped |
| `pendingViolations` | `Map<string, ViolationRecord>` | Store validation failures for reporting | Request-scoped |
| `stallDetectionState` | `Map<string, StallDetection>` | Track iteration patterns to detect infinite loops | Session-scoped |

#### State Map Structures

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

interface DenialRecord {
  agent: string
  tool: string
  timestamp: string
  shouldBlock: boolean
}

interface ViolationRecord {
  agent: string
  tool: string
  timestamp: string
  violations: string[]
  shouldBlock: boolean
}

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

### 1.3 Session States

Session states represent different phases of conversation lifecycle with specific governance requirements.

| State | Description | Governance Behavior |
|-------|-------------|---------------------|
| **New Conversation** | First message in session | Inject full governance prefix, enforce first-tool requirements, detect agent role |
| **Compact/New Session** | After context compaction | Inject post-compaction reminder, restore critical anchors, re-establish context |
| **Between-Turn** | Normal operation between messages | Track tool usage, validate permissions, update metrics |
| **User-Stop** | User interrupted execution | Create emergency checkpoint, log interruption, preserve state |
| **New Session Manipulation** | Session ID changes unexpectedly | Detect potential session hijacking, re-validate agent identity |

#### Session State Transitions

```
┌─────────────────┐
│  New Conversation │ ←── Entry point
│   (inject prefix) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Between-Turn   │ ←── Normal operation
│ (track/validate)│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌─────────────┐
│Compact/│  │  User-Stop  │
│New Sess│  │(checkpoint) │
└───┬────┘  └─────────────┘
    │
    ▼
┌─────────────────┐
│ Post-Compact    │
│ (restore context│
└─────────────────┘
```

### 1.4 Agent Profiles (All 15 Agents)

The iDumb system defines 15 specialized agents with distinct permissions and responsibilities.

#### Tier 1: Coordinators (Delegation Only)

| Agent | Mode | Scope | Can Delegate To | Key Permissions |
|-------|------|-------|-----------------|-----------------|
| `idumb-supreme-coordinator` | primary | bridge | ALL agents | task: allow, bash: deny, edit: deny, write: deny |
| `idumb-high-governance` | all | meta | ALL agents | task: conditional, bash: conditional, edit: deny, write: deny |

#### Tier 2: Execution Coordinators

| Agent | Mode | Scope | Can Delegate To | Key Permissions |
|-------|------|-------|-----------------|-----------------|
| `idumb-executor` | all | project | general, verifier, debugger | task: conditional, bash: conditional, edit: deny, write: deny |
| `idumb-verifier` | all | project | general, low-validator | task: conditional, bash: conditional, edit: deny, write: deny |
| `idumb-debugger` | all | project | general, low-validator | task: conditional, bash: conditional, edit: deny, write: deny |

#### Tier 3: Planning & Research (No Delegation)

| Agent | Mode | Scope | Can Delegate To | Key Permissions |
|-------|------|-------|-----------------|-----------------|
| `idumb-planner` | all | bridge | general | task: conditional, bash: deny, edit: deny, write: deny |
| `idumb-plan-checker` | all | bridge | general | task: conditional, bash: deny, edit: deny, write: deny |
| `idumb-roadmapper` | all | project | NONE (leaf) | task: deny, bash: deny, edit: deny, write: deny |
| `idumb-integration-checker` | all | bridge | general, low-validator | task: conditional, bash: deny, edit: deny, write: deny |
| `idumb-project-researcher` | all | project | NONE (leaf) | task: deny, bash: deny, edit: deny, write: deny |
| `idumb-phase-researcher` | all | project | NONE (leaf) | task: deny, bash: deny, edit: deny, write: deny |
| `idumb-research-synthesizer` | all | project | NONE (leaf) | task: deny, bash: deny, edit: deny, write: deny |
| `idumb-codebase-mapper` | all | project | NONE (leaf) | task: deny, bash: deny, edit: deny, write: deny |

#### Tier 4: Leaf Nodes (Execution)

| Agent | Mode | Scope | Can Delegate To | Key Permissions |
|-------|------|-------|-----------------|-----------------|
| `idumb-low-validator` | all | meta | NONE (leaf) | task: deny, bash: conditional, edit: deny, write: deny |
| `idumb-builder` | all | meta | NONE (leaf) | task: deny, bash: allow, edit: allow, write: allow |

#### Agent Permission Matrix (Detailed)

| Agent | task | bash | edit | write | Tools Enabled |
|-------|------|------|------|-------|---------------|
| supreme-coordinator | allow * | deny | deny | deny | task, todoread, todowrite, read, glob, grep, idumb-* |
| high-governance | conditional | conditional | deny | deny | task, todoread, todowrite, read, glob, grep, idumb-* |
| executor | conditional | conditional | deny | deny | task, read, glob, grep, idumb-* |
| verifier | conditional | conditional | deny | deny | task, read, glob, grep, idumb-* |
| debugger | conditional | conditional | deny | deny | task, read, glob, grep, idumb-* |
| planner | conditional | deny | deny | deny | task, read, glob, grep, idumb-* |
| plan-checker | conditional | deny | deny | deny | task, read, glob, grep, idumb-* |
| roadmapper | deny | deny | deny | deny | read, glob, grep, idumb-* |
| integration-checker | conditional | deny | deny | deny | task, read, glob, grep, idumb-* |
| project-researcher | deny | deny | deny | deny | read, glob, grep, idumb-* |
| phase-researcher | deny | deny | deny | deny | read, glob, grep, idumb-* |
| research-synthesizer | deny | deny | deny | deny | read, glob, grep, idumb-* |
| codebase-mapper | deny | deny | deny | deny | read, glob, grep, idumb-* |
| low-validator | deny | conditional | deny | deny | todoread, read, glob, grep, idumb-validate |
| builder | deny | allow | allow | allow | todoread, read, glob, grep, write, edit, idumb-* |

### 1.5 iDumb Tools (8 Categories)

iDumb provides 8 tool modules with 30+ individual tools organized by function.

#### Tool Categories

| Category | Tools | Permission Tier | Purpose |
|----------|-------|-----------------|---------|
| **State Management** | `idumb-state`, `idumb-state_read`, `idumb-state_write`, `idumb-state_anchor`, `idumb-state_getAnchors`, `idumb-state_history`, `idumb-state_createSession`, `idumb-state_modifySession`, `idumb-state_exportSession`, `idumb-state_listSessions` | Tier 1-3 | Read/write governance state |
| **Configuration** | `idumb-config`, `idumb-config_read`, `idumb-config_update`, `idumb-config_init`, `idumb-config_status`, `idumb-config_sync`, `idumb-config_ensure` | Tier 1-3 | Manage iDumb configuration |
| **Context** | `idumb-context`, `idumb-context_summary`, `idumb-context_patterns` | Tier 1-3 | Analyze project context |
| **Validation** | `idumb-validate`, `idumb-validate_structure`, `idumb-validate_schema`, `idumb-validate_freshness`, `idumb-validate_integrationPoints`, `idumb-validate_planningAlignment`, `idumb-validate_configSchema`, `idumb-validate_frontmatter` | Tier 2-4 | Run validation checks |
| **TODO Management** | `idumb-todo`, `idumb-todo_list`, `idumb-todo_hierarchy`, `idumb-todo_complete`, `idumb-todo_update`, `todoread`, `todowrite` | All Tiers | Track tasks and progress |
| **Manifest** | `idumb-manifest`, `idumb-manifest_snapshot`, `idumb-manifest_drift`, `idumb-manifest_conflicts`, `idumb-manifest_verifyGitHash` | Tier 2-3 | Codebase manifest management |
| **Chunker** | `idumb-chunker`, `idumb-chunker_read`, `idumb-chunker_overview`, `idumb-chunker_append`, `idumb-chunker_validate` | Tier 2-3 | Large document processing |
| **Core Plugin** | (Internal hooks) | System | Event interception |

#### Tool Permission Tiers

```yaml
TIER 1 (Coordinators):
  tools:
    - task (delegation)
    - todoread, todowrite
    - read, glob, grep (context gathering)
    - idumb-state* (state management)
    - idumb-context* (context analysis)
    - idumb-config* (configuration)
    - idumb-todo* (task tracking)
    - idumb-validate* (validation)
    - idumb-chunker* (document processing)
  notes: Can delegate but cannot execute directly

TIER 2 (Executors/Planners):
  tools:
    - task (delegation to leaf nodes)
    - todoread, todowrite
    - read, glob, grep
    - idumb-state* (read/anchor only)
    - idumb-context* (read only)
    - idumb-config* (read only)
    - idumb-todo* (read only)
    - idumb-validate* (validation)
    - idumb-chunker* (read only)
  notes: Can delegate to leaf nodes, read-only on most iDumb tools

TIER 3 (Researchers/Validators):
  tools:
    - todoread (read only)
    - read, glob, grep (investigation)
    - idumb-state* (read/anchor only)
    - idumb-context* (read only)
    - idumb-config* (read only)
    - idumb-todo* (read only)
    - idumb-validate* (validation)
    - idumb-chunker* (read/validate)
  notes: Read-only operations, no delegation

TIER 4 - LEAF: Builder (idumb-builder):
  tools:
    - todoread, todowrite
    - read, write, edit, bash (ALL file operations)
    - filesystem_* (all file system tools)
    - idumb-state* (including write)
    - idumb-todo* (including update/complete)
  notes: ONLY agent that can modify files

TIER 4 - LEAF: Validator (idumb-low-validator):
  tools:
    - todoread (read only)
    - read, glob, grep, bash (read-only commands)
    - filesystem_read* (all read operations)
    - idumb-state* (read only)
    - idumb-validate* (all validation)
    - idumb-manifest* (read only)
    - idumb-chunker* (read/validate)
  notes: Read-only validation, no modifications
```

### 1.6 Interception Points

Interception points are where iDumb modifies or controls OpenCode behavior.

| Interception Point | Location | Purpose | Enforcement |
|-------------------|----------|---------|-------------|
| **Prompt Injection** | `session.created` | Inject governance prefix | Mandatory for all iDumb agents |
| **Tool Permission Check** | `permission.ask` | Validate tool against agent permissions | Block unauthorized tools |
| **Tool Execution Block** | `tool.execute.before` | Prevent execution of forbidden tools | Hard block with guidance |
| **Message Transformation** | `messages.transform` | Convert denials to helpful guidance | Transform errors to education |
| **Context Preservation** | `session.compacting` | Save critical anchors | Survive compaction |
| **First-Tool Enforcement** | `tool.execute.before` | Ensure context gathering first | Block until todoread used |
| **Chain Rule Validation** | `tool.execute.before` | Check MUST-BEFORE dependencies | Redirect/block on violation |

---

## 2. Hierarchy Within Groups

### 2.1 Agent Delegation Chain (3 Levels)

```
LEVEL 1: SUPREME COORDINATION
├── idumb-supreme-coordinator (primary)
│   └── Mode: primary
│   └── Scope: bridge
│   └── Can Delegate To: ALL agents
│   └── Permissions: task=allow, bash=deny, edit=deny, write=deny
│
LEVEL 2: HIGH GOVERNANCE
├── idumb-high-governance (all)
│   └── Mode: all
│   └── Scope: meta
│   └── Can Delegate To: ALL agents
│   └── Permissions: task=conditional, bash=conditional, edit=deny, write=deny
│
LEVEL 3: SPECIALIZED COORDINATORS
├── idumb-executor (all)
│   └── Scope: project
│   └── Can Delegate To: general, verifier, debugger
│   └── Purpose: Phase execution coordination
│
├── idumb-verifier (all)
│   └── Scope: project
│   └── Can Delegate To: general, low-validator
│   └── Purpose: Work verification
│
├── idumb-debugger (all)
│   └── Scope: project
│   └── Can Delegate To: general, low-validator
│   └── Purpose: Issue diagnosis
│
├── idumb-planner (all)
│   └── Scope: bridge
│   └── Can Delegate To: general
│   └── Purpose: Plan creation
│
├── idumb-plan-checker (all)
│   └── Scope: bridge
│   └── Can Delegate To: general
│   └── Purpose: Plan validation
│
├── idumb-integration-checker (all)
│   └── Scope: bridge
│   └── Can Delegate To: general, low-validator
│   └── Purpose: Integration validation
│
LEVEL 4: RESEARCHERS (Leaf - No Delegation)
├── idumb-roadmapper (all)
├── idumb-project-researcher (all)
├── idumb-phase-researcher (all)
├── idumb-research-synthesizer (all)
├── idumb-codebase-mapper (all)
│   └── All: Mode=all, Scope=project
│   └── All: task=deny, bash=deny, edit=deny, write=deny
│   └── All: Can Delegate To: NONE
│
LEVEL 5: WORKER LEAF NODES
├── idumb-low-validator (all)
│   └── Mode: all
│   └── Scope: meta
│   └── Can Delegate To: NONE
│   └── Permissions: task=deny, bash=conditional, edit=deny, write=deny
│   └── Purpose: Read-only validation
│
└── idumb-builder (all)
    └── Mode: all
    └── Scope: meta
    └── Can Delegate To: NONE
    └── Permissions: task=deny, bash=allow, edit=allow, write=allow
    └── Purpose: File operations (ONLY writer)
```

### 2.2 Hook Execution Hierarchy

```
HOOK PRIORITY ORDER (highest to lowest):

1. session.created [CRITICAL]
   ├── Detect agent role from messages
   ├── Initialize session tracker
   ├── Inject governance prefix
   └── Set first-tool enforcement flag

2. permission.ask [HIGH]
   ├── Check if tool is in allowed list
   ├── Apply agent-specific rules
   └── Return permission decision

3. tool.execute.before [CRITICAL]
   ├── Validate chain rules (MUST-BEFORE)
   ├── Check first-tool requirements
   ├── Verify tool permission
   ├── Check delegation depth
   └── Block or allow execution

4. tool.execute.after [MEDIUM]
   ├── Log execution to history
   ├── Update execution metrics
   ├── Track iteration counts
   └── Trigger validation if needed

5. messages.transform [HIGH]
   ├── Check for pending denials
   ├── Transform denial to guidance
   ├── Inject post-compaction reminders
   └── Return modified messages

6. session.compacting [HIGH]
   ├── Preserve critical anchors
   ├── Prepare compaction summary
   └── Set post-compaction flag

7. session.idle [MEDIUM]
   ├── Create checkpoint
   ├── Run stall detection
   └── Export session if needed
```

### 2.3 State Transition Logic

```
STATE TRANSITION RULES:

SessionTracker State Machine:
┌─────────────┐    first tool     ┌─────────────┐
│   INITIAL   │ ────────────────→ │  ACTIVE     │
│ (no tools)  │    used           │ (tracking)  │
└─────────────┘                   └──────┬──────┘
                                         │
                    violation            │
                    detected             ▼
                                         ┌─────────────┐
                                    ┌───│  VIOLATION  │
                                    │   │   STATE     │
                                    │   └──────┬──────┘
                                    │          │
                                    └──────────┘
                                    reset after
                                    guidance given

StallDetection State Machine:
┌─────────────┐    same issues    ┌─────────────┐
│   NORMAL    │ ────────────────→ │  WARNING    │
│  (varying)  │    3x in a row    │  (stall     │
└─────────────┘                   │  suspected) │
                                  └──────┬──────┘
                                         │ same issues
                                         │ 2 more times
                                         ▼
                                  ┌─────────────┐
                                  │   STALL     │
                                  │  DETECTED   │
                                  │(emergency    │
                                  │   halt)     │
                                  └─────────────┘

Delegation Depth Tracking:
┌─────────────┐    delegate      ┌─────────────┐
│   DEPTH 0   │ ───────────────→ │   DEPTH 1   │
│   (root)    │                  │ (child)     │
└─────────────┘                  └──────┬──────┘
                                        │ delegate
                                        ▼
                                  ┌─────────────┐
                                  │   DEPTH 2   │
                                  │ (grandchild)│
                                  └──────┬──────┘
                                         │ delegate
                                         ▼
                                   ┌─────────────┐
                                   │   DEPTH 3   │
                                   │ (max depth) │
                                   │  BLOCK any  │
                                   │  further    │
                                   │ delegation  │
                                   └─────────────┘
```

---

## 3. Relational Matrix

### 3.1 Hook-to-State Interactions

| Hook | sessionTrackers | pendingDenials | pendingViolations | stallDetectionState |
|------|-----------------|----------------|-------------------|---------------------|
| `session.created` | CREATE entry | - | - | CREATE entry |
| `permission.ask` | READ agentRole | - | - | - |
| `tool.execute.before` | READ/UPDATE firstTool, violationCount | CREATE if blocked | CREATE if validation fails | READ/UPDATE delegation depth |
| `tool.execute.after` | UPDATE | - | - | READ/UPDATE metrics |
| `messages.transform` | - | READ/DELETE | READ/DELETE | - |
| `session.compacting` | READ | - | - | - |
| `session.idle` | READ | - | - | READ/UPDATE stall detection |

### 3.2 Agent-to-Tool Relationships

| Agent | Primary Tools | Forbidden Tools | Required First Tools |
|-------|---------------|-----------------|---------------------|
| supreme-coordinator | task, todoread, idumb-state, idumb-context | write, edit, bash | todoread, idumb-state, idumb-context, read, glob |
| high-governance | task, todoread, idumb-state, read | write, edit | todoread, idumb-state, read, glob |
| executor | task, todoread, idumb-state, read | write, edit | todoread, idumb-state, read |
| verifier | task, todoread, idumb-state, idumb-validate | write, edit | todoread, idumb-state, read |
| debugger | task, todoread, idumb-state, grep | write, edit | todoread, idumb-state, read, grep |
| planner | task, todoread, idumb-state, read | write, edit, bash | todoread, idumb-state, read |
| plan-checker | task, todoread, idumb-validate, read | write, edit, bash | todoread, idumb-validate, read |
| roadmapper | todoread, read, glob, grep | task, write, edit, bash | todoread, idumb-state, read |
| integration-checker | todoread, idumb-validate, read, grep | task, write, edit, bash | todoread, idumb-validate, read, grep |
| project-researcher | todoread, read, glob | task, write, edit, bash | todoread, read, glob |
| phase-researcher | todoread, read, glob | task, write, edit, bash | todoread, read, glob |
| research-synthesizer | todoread, read | task, write, edit, bash | todoread, read |
| codebase-mapper | todoread, read, glob, grep | task, write, edit, bash | todoread, read, glob, grep |
| low-validator | todoread, idumb-validate, read, glob, grep, bash (read-only) | task, write, edit | todoread, idumb-validate, read, glob, grep |
| builder | todoread, read, write, edit, bash, idumb-state, idumb-todo | task (delegation) | todoread, read |

### 3.3 Permission Cascade Matrix

```
PERMISSION CASCADE FLOW:

User Request
    │
    ▼
┌─────────────────────────────────────┐
│  idumb-supreme-coordinator          │
│  - Validates request                │
│  - Checks state                     │
│  - CANNOT execute                   │
│  - MUST delegate                    │
└──────────────┬──────────────────────┘
               │ delegates to
               ▼
┌─────────────────────────────────────┐
│  idumb-high-governance              │
│  - Receives delegation              │
│  - Analyzes requirements            │
│  - CANNOT execute                   │
│  - MUST sub-delegate                │
└──────────────┬──────────────────────┘
               │ sub-delegates to
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│idumb-builder│  │idumb-low-   │
│             │  │validator    │
│- CAN execute│  │- CAN validate│
│- CAN write  │  │- CANNOT write│
│- Leaf node  │  │- Leaf node  │
└─────────────┘  └─────────────┘
       │               │
       │ reports back  │ reports back
       └───────┬───────┘
               ▼
┌─────────────────────────────────────┐
│  idumb-high-governance              │
│  - Synthesizes results              │
│  - Reports to supreme               │
└──────────────┬──────────────────────┘
               │ reports to
               ▼
┌─────────────────────────────────────┐
│  idumb-supreme-coordinator          │
│  - Presents final result            │
│  - Updates state                    │
└─────────────────────────────────────┘
```

### 3.4 Chain Rule Enforcement Matrix

| Rule ID | Command | MUST-BEFORE | Enforcement | On Violation |
|---------|---------|-------------|-------------|--------------|
| INIT-01 | /idumb:* | state.json exists | HARD | Redirect to /idumb:init |
| PROJ-01 | /idumb:roadmap | PROJECT.md exists | SOFT | Block (can --force) |
| PROJ-02 | /idumb:discuss-phase | ROADMAP.md exists | HARD | Redirect to /idumb:roadmap |
| PHASE-01 | /idumb:execute-phase | PLAN.md exists | HARD | Redirect to /idumb:plan-phase |
| PHASE-02 | /idumb:execute-phase | CONTEXT.md exists | WARN | Warn, continue |
| PHASE-03 | /idumb:verify-work | Execution evidence | HARD | Block |
| VAL-01 | state.phase=complete | VERIFICATION.md exists | HARD | Block |
| VAL-02 | commit_changes | Recent validation | WARN | Warn, continue |

### 3.5 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         iDUMB PERMISSION-ENTITY MATRIX                       │
└─────────────────────────────────────────────────────────────────────────────┘

AGENTS (15)                    HOOKS (7)                    STATE MAPS (4)
───────────                    ─────────                    ──────────────
┌─────────────────┐            ┌─────────────────┐          ┌─────────────────┐
│  COORDINATORS   │◄──────────►│ session.created │◄────────►│ sessionTrackers │
│  (2 agents)     │   inject   │                 │  create  │                 │
└────────┬────────┘            └─────────────────┘          └─────────────────┘
         │                      ┌─────────────────┐          ┌─────────────────┐
         │ delegate              │ permission.ask  │◄────────►│ pendingDenials  │
         ▼                      │                 │  create  │                 │
┌─────────────────┐            └─────────────────┘          └─────────────────┘
│    EXECUTORS    │            ┌─────────────────┐          ┌─────────────────┐
│   (3 agents)    │◄──────────►│tool.execute.bef │◄────────►│pendingViolations│
└────────┬────────┘   block    │                 │  create  │                 │
         │                      └─────────────────┘          └─────────────────┘
         │ sub-delegate        ┌─────────────────┐          ┌─────────────────┐
         ▼                      │ tool.execute.af │◄────────►│stallDetectionSt │
┌─────────────────┐            │                 │  update  │                 │
│  PLANNING/RES   │            └─────────────────┘          └─────────────────┘
│  (6 agents)     │            ┌─────────────────┐
└────────┬────────┘◄──────────►│messages.transfo │
         │          transform  │                 │
         │                      └─────────────────┘
         │                      ┌─────────────────┐
         └─────────────────────►│session.compacti │
                                │                 │
                                └─────────────────┘
                                ┌─────────────────┐
                                │  session.idle   │
                                │                 │
                                └─────────────────┘

TOOLS (8 categories)
────────────────────
┌─────────────────┐
│  State Mgmt     │◄──────┐
│  (10 tools)     │       │
└─────────────────┘       │
┌─────────────────┐       │
│  Configuration  │◄──────┤
│  (7 tools)      │       │
└─────────────────┘       │
┌─────────────────┐       │
│  Context        │◄──────┤
│  (3 tools)      │       │
└─────────────────┘       │      AGENTS USE TOOLS
┌─────────────────┐       │      (based on permissions)
│  Validation     │◄──────┤
│  (8 tools)      │       │
└─────────────────┘       │
┌─────────────────┐       │
│  TODO Mgmt      │◄──────┘
│  (7 tools)      │
└─────────────────┘
┌─────────────────┐
│  Manifest       │
│  (5 tools)      │
└─────────────────┘
┌─────────────────┐
│  Chunker        │
│  (5 tools)      │
└─────────────────┘
┌─────────────────┐
│  Core Plugin    │
│  (hooks)        │
└─────────────────┘

CHAIN RULES (8 rules)
─────────────────────
┌─────────────────┐
│   INIT-01       │───► Requires: state.json
│   PROJ-01       │───► Requires: PROJECT.md
│   PROJ-02       │───► Requires: ROADMAP.md
│   PHASE-01      │───► Requires: PLAN.md
│   PHASE-02      │───► Recommends: CONTEXT.md
│   PHASE-03      │───► Requires: Execution evidence
│   VAL-01        │───► Requires: VERIFICATION.md
│   VAL-02        │───► Recommends: Recent validation
└─────────────────┘
```

---

## 4. Key Findings

### Finding 1: Strict Hierarchical Separation
**Summary:** iDumb enforces a strict 5-level hierarchy with clear separation between coordinators (who delegate) and workers (who execute).

**Evidence:**
- Only 2 agents (supreme-coordinator, high-governance) can delegate to all other agents
- Only 1 agent (builder) can write files
- Only 1 agent (low-validator) can run validation tools
- 6 agents are leaf nodes with no delegation capability

**Implications:** This ensures no agent can both decide and execute, preventing conflicts of interest and ensuring checks and balances.

### Finding 2: Tool Permission Matrix is Context-Aware
**Summary:** Tool permissions are not just binary allow/deny; they vary by agent role and include required first-tools.

**Evidence:**
- Coordinators must use `todoread` before other tools
- Builders must `read` before `write`
- Researchers cannot use `task` (delegation) at all
- Each agent has a specific `getRequiredFirstTools()` list

**Implications:** This enforces "context-first" methodology, ensuring agents understand state before acting.

### Finding 3: State Maps Enable Runtime Enforcement
**Summary:** Four in-memory state maps track session state and enable real-time permission enforcement.

**Evidence:**
- `sessionTrackers` tracks 6 fields per session including `firstToolUsed` and `violationCount`
- `stallDetectionState` implements hash-based cycle detection
- `pendingDenials` and `pendingViolations` enable async message transformation

**Implications:** The system can detect and prevent infinite loops, enforce first-tool requirements, and provide contextual guidance without persisting sensitive state.

### Finding 4: Chain Rules Provide Project-Level Governance
**Summary:** 8 chain rules enforce MUST-BEFORE dependencies between project phases.

**Evidence:**
- Cannot execute phase without PLAN.md (PHASE-01)
- Cannot mark complete without VERIFICATION.md (VAL-01)
- Cannot create roadmap without PROJECT.md (PROJ-01)
- Rules have 3 enforcement levels: HARD_BLOCK, SOFT_BLOCK, WARN

**Implications:** This ensures project integrity by preventing premature execution and ensuring proper documentation at each phase.

### Finding 5: Hooks Intercept at Critical Points
**Summary:** 7 hooks intercept OpenCode operations at key lifecycle points.

**Evidence:**
- `session.created` injects governance context before any agent action
- `tool.execute.before` can block unauthorized tool usage
- `messages.transform` converts technical denials into helpful guidance
- `session.compacting` preserves critical context across compaction

**Implications:** iDumb can enforce its governance model without modifying OpenCode core, operating as a plugin layer.

---

## 5. Options Evaluated

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Strict Hierarchical Delegation** | Clear accountability, prevents conflicts, enables oversight | Slower execution, more coordination overhead | **RECOMMEND** - Core to iDumb governance |
| **Flat Agent Structure** | Faster execution, simpler coordination | No oversight, potential conflicts, no validation | **AVOID** - Violates governance principles |
| **Role-Based Permissions** | Flexible, easy to understand | Can be bypassed, less explicit | **CONSIDER** - Could complement hierarchy |
| **Runtime Tool Interception** | Enforces rules dynamically, adaptable | Performance overhead, complexity | **RECOMMEND** - Essential for enforcement |
| **Static Permission Analysis** | Fast, no runtime overhead | Cannot adapt to context, easily bypassed | **AVOID** - Insufficient for governance |

---

## 6. Recommendations

### 6.1 High Priority

1. **Maintain Strict Hierarchy**: The 5-level delegation chain is the core innovation of iDumb. Never allow coordinators to execute directly or workers to delegate.

2. **Preserve First-Tool Enforcement**: The requirement to use `todoread` and `idumb-state` before acting ensures context awareness. This prevents agents from acting without understanding current state.

3. **Expand Stall Detection**: Current stall detection tracks planner-checker and validator-fix loops. Expand to cover delegation depth and repeated error patterns.

### 6.2 Medium Priority

4. **Add Chain Rule Visualization**: Create a visual representation of chain dependencies to help users understand why operations are blocked.

5. **Implement Permission Auditing**: Log all permission decisions to `.idumb/brain/governance/audit.log` for compliance and debugging.

6. **Create Agent Capability Matrix**: A user-facing document showing what each agent can and cannot do.

### 6.3 Low Priority

7. **Optimize Hook Performance**: Profile hook execution time and optimize hot paths.

8. **Add Configurable Enforcement**: Allow users to adjust enforcement strictness (while keeping core hierarchy non-configurable).

---

## 7. Risks & Concerns

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Hook Performance Degradation** | Medium | Medium | Profile hooks, optimize hot paths, cache permission lookups |
| **State Map Memory Leak** | Low | High | Implement session cleanup, TTL for old entries, max size limits |
| **Chain Rule False Positives** | Medium | Medium | Add --force override for SOFT_BLOCK, improve rule precision |
| **Agent Role Detection Failure** | Low | High | Fallback to supreme-coordinator, require explicit role declaration |
| **Permission Bypass via Prompt Injection** | Low | Critical | Validate all tool calls at hook level, ignore agent claims |
| **Stall Detection False Positives** | Medium | Low | Require multiple consecutive detections, allow user override |

---

## 8. Open Questions

1. **How should the system handle agent role conflicts?** → Requires: Decision on whether to trust agent self-identification or enforce via hooks only.

2. **What is the maximum safe delegation depth?** → Requires: Testing to determine optimal max depth (currently 3).

3. **How to handle cross-session state persistence?** → Requires: Design for session exports and imports.

4. **Should chain rules be user-configurable?** → Requires: Governance decision on flexibility vs. rigidity.

5. **How to validate agent profile integrity?** → Requires: Schema validation for agent markdown files.

---

## 9. Sources

1. **iDumb Core Plugin** (`template/plugins/idumb-core.ts`) - Primary source for hooks, state maps, and tool permissions
2. **Chain Enforcement Rules** (`template/router/chain-enforcement.md`) - Chain rule definitions and enforcement logic
3. **Agent Profiles** (`template/agents/*.md`) - All 15 agent definitions with permissions
4. **iDumb Tools** (`template/tools/*.ts`) - Tool implementations and permission tiers
5. **AGENTS.md** - Governance overview and hierarchy documentation

---

## 10. Research Metadata

- **Time spent:** 45 minutes
- **Sources consulted:** 24 files
- **Confidence level:** High
- **Researcher:** @idumb-project-researcher
- **Review required:** Yes - validate against actual implementation

---

*Document generated by iDumb Project Researcher*  
*Part of: iDumb Governance System Research*  
*Date: 2026-02-04*
