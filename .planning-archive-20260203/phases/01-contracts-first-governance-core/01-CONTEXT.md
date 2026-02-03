# Phase 1: Contracts-First Governance Core - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 1 delivers:** A working meta-framework that REPLACES GSD with:
1. Complete agent/command/workflow chain that actually works
2. Technical enforcement of roles (not just suggestions)
3. LLM manipulation through 4 entry points × 3 interception strategies
4. "Less for LLM, More for Us" architecture

**Success criteria:**
1. User installs via `npx @anthropic-ai/idumb`
2. User runs `/idumb:init` → stable `.idumb/` state
3. User runs `/idumb:new-project` → `.planning/` structure
4. User runs `/idumb:plan-phase 1` → PLAN.md created
5. User runs `/idumb:execute-phase 1` → work happens via delegation
6. Agent hierarchy is ENFORCED at runtime

</domain>

<decisions>
## Implementation Decisions

### Part A: Fix Broken Structure (Critical Fixes)

#### A1. Agent Frontmatter
- **Add OpenCode frontmatter** to 6 specialized agents:
  - idumb-planner.md
  - idumb-plan-checker.md
  - idumb-roadmapper.md
  - idumb-phase-researcher.md
  - idumb-project-researcher.md
  - idumb-research-synthesizer.md
- **Create 4 missing agents:**
  - idumb-executor.md
  - idumb-verifier.md
  - idumb-debugger.md
  - idumb-integration-checker.md
- **Frontmatter template:**
```yaml
---
description: "[agent description]"
mode: subagent
hidden: true
temperature: 0.2
permission:
  task:
    "*": deny
  bash:
    "*": deny
  edit: deny
  write: deny
tools:
  task: false
  idumb-state: true
  idumb-context: true
---
```

#### A2. Command Frontmatter
- **Add agent declaration** to 8 commands:
  - new-project.md
  - research.md
  - roadmap.md
  - discuss-phase.md
  - plan-phase.md
  - execute-phase.md
  - verify-work.md
  - debug.md
- **Required frontmatter:**
```yaml
---
description: "[from file]"
agent: idumb-supreme-coordinator
---
```

#### A3. Missing Commands/Workflows
- **Create /idumb:resume** command (workflow exists)
- **Create research.md** workflow
- **Create roadmap.md** workflow

---

### Part B: LLM Manipulation & Interception (Core Innovation)

#### B1. The 4 Entry Points

| Entry Point | When | What LLM Sees | What We Inject |
|-------------|------|---------------|----------------|
| **Session Start** | New session, first message | System prompt + first user message | Governance prefix PREPENDED to first user message |
| **Post-Compact** | After context compaction | Compacted summary | Hierarchy reminder APPENDED after summary |
| **Delegation** | task tool called | Task prompt | Delegation context PREPENDED to task prompt |
| **Tool Decision** | LLM decides tool | Available tools | Whitelist enforcement + first-tool rules |

#### B2. The 3 Interception Strategies

**Strategy 1: Message Control** (`experimental.chat.messages.transform`)
- **Power level:** HIGHEST (pre-processing)
- **What it does:** Modify ALL messages before LLM sees them
- **Implementation:**
  - Detect session start → prepend governance to first user message
  - Detect post-compact → inject reminder after compaction summary
  - Track agent role from message content

**Strategy 2: First Tool Enforcement** (`tool.execute.before`)
- **Power level:** HIGH (real-time control)
- **What it does:** Force context-gathering as first action
- **Implementation:**
  - Track session state: "has first tool been used?"
  - If first tool NOT in allowed list → BLOCK by invalidating args
  - Log violation, inject reminder message
- **Required first tools by role:**
  - Coordinator: `idumb-todo`, `idumb-state`, `idumb-context`
  - High-governance: `idumb-todo`, `idumb-state`
  - Validator: `idumb-todo`, `idumb-validate`
  - Builder: `read`

**Strategy 3: Error Transformation** (`permission.ask` + `tool.execute.after`)
- **Power level:** MEDIUM (reactive guidance)
- **What it does:** Turn permission denials into teachable moments
- **Implementation:**
  - Intercept permission.ask → auto-deny if role mismatch
  - Store pending denial info
  - In tool.execute.after → inject educational guidance

#### B3. Tool Permission Matrix (Enforced via Plugin)

| Agent | Can Read | Can Write | Can Delegate | Must Start With |
|-------|----------|-----------|--------------|-----------------|
| Supreme Coordinator | ✅ | ❌ | ✅ | idumb-todo |
| High Governance | ✅ | ❌ | ✅ | idumb-todo |
| Low Validator | ✅ | ❌ | ❌ | idumb-todo |
| Builder | ✅ | ✅ | ❌ | read |

#### B4. Session Tracking State

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

---

### Part C: "Less for LLM, More for Us" Architecture

#### C1. The Philosophy
- **"Less" for LLM:** Read only what's needed, when needed
- **"More" for Us:** Granular control, hierarchical arrangement, forced output formats

#### C2. Implementation Mechanisms

1. **Force insert prompt/command** based on agent, phase, workflow
   - Commands insert workflows as prompts
   - Workflows force output format via bash-run checks
   - Check role, check governance, check workflow state

2. **Pair with skills** for granular control
   - Skills load on-demand (not pre-loaded)
   - Each skill = specific knowledge domain
   - Agent loads skill when needed

3. **Plugin hooks manipulation**
   - `tool.execute.before` → enforce permissions
   - `experimental.chat.messages.transform` → inject context
   - `experimental.session.compacting` → preserve governance
   - `permission.ask` → auto-deny violations

4. **Manipulate first tool use**
   - Track session state
   - Block non-context-gathering first tools
   - Force idumb-todo before any action

5. **Permission deny + message modify**
   - When role drifts, deny tool
   - Inject reminder message
   - Force agent back to correct behavior

#### C3. Why Long Conversations Drift (And Our Solutions)

| LLM Behavior | Problem | Our Solution |
|--------------|---------|--------------|
| **Start new session** | Sees everything, hierarchy gets lost | Prepend governance to FIRST user message |
| **N-turn-stop** | Focuses on last output, ignores n-1 | Use workflows to force format at each turn |
| **User-cancel** | Acts immediately without context | First tool enforcement blocks premature action |
| **Compact-session** | Loses hierarchy in compact | `session.compacting` hook preserves governance |

---

### Part D: GSD Takeover Strategy

#### D1. Command Namespace
- **Decision:** `/idumb:*` primary, `/gsd:*` passthrough
- **Rationale:** iDumb is REPLACEMENT, not wrapper

#### D2. Directory Structure
- `.planning/` — GSD artifacts (read-only for iDumb)
- `.idumb/` — Governance state (iDumb writes here)
- `.opencode/` — Installed framework files

#### D3. Installation Flow
```
npx @anthropic-ai/idumb [--global | --local]
    ↓
Copy to ~/.config/opencode/ (global) or ./.opencode/ (local):
  - agents/idumb-*.md
  - commands/idumb/*.md
  - plugins/idumb-core.ts
  - tools/idumb-*.ts
  - skills/idumb-governance/
  - get-shit-done/workflows/*.md
  - get-shit-done/templates/*.md
    ↓
On /idumb:init:
  - Create .idumb/brain/state.json
  - Create .idumb/config.json
  - Create .idumb/governance/
```

---

### Part E: Evidence & Validation

#### E1. Evidence Format
- **Storage:** JSON in `.idumb/governance/validations/`
- **ID format:** ULID with `val_` prefix
- **Schema:**
```json
{
  "id": "val_01HQXYZ...",
  "timestamp": "2026-02-03T...",
  "scope": "full|structure|schema|drift",
  "status": "pass|fail|warning",
  "agent": "idumb-low-validator",
  "sessionId": "ses_...",
  "checks": [...],
  "metadata": { "phase": "...", "framework": "gsd" }
}
```

#### E2. Validation Chain
- Every workflow ends with validation delegation
- Validation produces JSON evidence
- Evidence queryable for Phase 2 Brain

---

### Claude's Discretion
- Exact error message wording
- Specific validation check ordering
- Template file formatting details
- Internal tool implementation details

</decisions>

<specifics>
## Specific Requirements

### From User (Non-Negotiable)
1. Cannot modify OpenCode source code (plugin only)
2. Cannot assume user's LLM/provider (model agnostic)
3. Must support global AND local install
4. Must work with brownfield AND greenfield
5. "Less for LLM" = LLM reads only what needed
6. "More for Us" = granular control, hierarchical arrangement
7. Self-intelligent-governance, Expert-agent-first, Context-first

### From Research Documents
- IMPLEMENTATION-GUIDE.md: Full code for session tracking, hooks, enforcement
- INTERCEPTION-ARCHITECTURE-ANALYSIS.md: 4 entry points × 3 strategies
- INTERCEPTION-SOLUTION-SUMMARY.md: Integration matrix, validation checklist

### Critical Integration Points
- Hook execution order: permission.ask → tool.execute.before → [Tool] → tool.execute.after → messages.transform
- Session state persistence: `.idumb/sessions/{sessionId}.json`
- Compaction detection: Check for "compacted" or "summary" in messages

</specifics>

<deferred>
## Deferred Ideas

### Phase 2: Brain MVP
- SQLite persistence for sessions/anchors/validations
- Schema validation with Zod
- Relationship graph (session → tasks → files)

### Phase 3: Retrieval + Hop-Reading
- Orama index for artifact search
- Tree-sitter parsing for symbol navigation
- Incremental index updates

### Phase 4: Auto-Governance Loops
- Drift detection from manifest snapshots
- Scheduled validation with persisted results
- Failure → next-action recommendations

### Phase 5: Context Optimization
- Lazy-load governance rules
- Safe pruning policies
- Protected artifact preservation

</deferred>

---

*Phase: 01-contracts-first-governance-core*
*Context gathered: 2026-02-03*
*Method: Agent delegation + interception research synthesis*
