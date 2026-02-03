# Phase 1 Implementation Priority - 2026-02-03

> **Consolidated implementation roadmap for fixing all Phase 1 gaps**  
> **Sources:** 01-01 through 01-05 PLANs, completion-definitions.yaml, validation matrix spec, map-codebase research

---

## Status

```yaml
generated: 2026-02-03T03:00:00Z
phase: 01-contracts-first-governance-core
blocking_issues: 6
total_tasks: 44
estimated_time: 18 hours
files_to_create: 12
files_to_modify: 17
lines_to_add: ~1,800
```

---

## Priority Matrix Overview

| Priority | Category | Tasks | Est. Time | Blocking Factor |
|----------|----------|-------|-----------|-----------------|
| **P0** | Critical Blockers | 7 | 3h | Blocks ALL other work |
| **P1** | High Priority | 15 | 6h | Blocks execution workflows |
| **P2** | Medium Priority | 14 | 5h | Blocks validation/verification |
| **P3** | Low Priority | 8 | 4h | Enhancements, not blocking |

---

# Priority 0: Critical Blockers (MUST FIX FIRST)

> **These block ALL other work. No execution possible until complete.**

## Task 0.1: Session Tracking Infrastructure

**Source:** 01-03-PLAN.md Task P1-3.1

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:** 
  - Add `SessionTracker` interface after line ~48
  - Add `sessionTrackers` Map and `pendingDenials` Map
  - Add `getSessionTracker()` function
  - Add `detectAgentFromMessages()` function
- **Lines Added:** ~50
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] SessionTracker interface exists
  - [ ] sessionTrackers Map initialized
  - [ ] getSessionTracker returns valid tracker for any sessionId
- **Blocks:** 
  - Task 0.2 (Tool Permission Matrix)
  - Task 0.3 (First Tool Enforcement)
  - ALL Priority 1 interception tasks

---

## Task 0.2: Tool Permission Matrix

**Source:** 01-03-PLAN.md Task P1-3.2

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `getAllowedTools()` function (role → tool list)
  - Add `getRequiredFirstTools()` function (role → required first tools)
  - Encode permission matrix from CONTEXT.md B3
- **Lines Added:** ~40
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] Coordinator has 'task' but NOT 'edit'/'write'
  - [ ] Builder has 'edit'/'write' but NOT 'task'
  - [ ] Validator has read-only tools only
- **Blocks:**
  - Task 0.3 (First Tool Enforcement)
  - ALL role-based permission checks
- **Depends On:** Task 0.1

---

## Task 0.3: First Tool Enforcement Hook

**Source:** 01-03-PLAN.md Task P1-3.5

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Replace existing `tool.execute.before` hook
  - Add first tool tracking logic
  - Add file modification blocking for non-builders
  - Add general permission check
  - Add delegation depth tracking
- **Lines Added:** ~110
- **Time:** 1 hour
- **Success Criteria:**
  - [ ] First tool violation logged if not context-gathering
  - [ ] File modification (edit/write) blocked for non-builders
  - [ ] Unauthorized tools blocked with error message
  - [ ] pendingDenials populated for violation guidance
- **Blocks:**
  - ALL governance enforcement
  - Task 1.1 (Session Start Injection)
- **Depends On:** Task 0.1, Task 0.2

---

## Task 0.4: Chain Rule Interfaces

**Source:** 01-05-PLAN.md Task 01-05-T1

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `ChainRule`, `Prerequisite`, `ViolationAction` interfaces
  - Add `READONLY_COMMANDS` constant array
  - Add `getChainRules()` function (hardcoded rules from chain-enforcement.md)
  - Add `matchCommand()` pattern matcher
  - Add `resolvePhaseInPath()` for {phase} placeholder resolution
- **Lines Added:** ~120
- **Time:** 45 minutes
- **Success Criteria:**
  - [ ] ChainRule interface matches chain-enforcement.md structure
  - [ ] All 7 chain rules from YAML encoded
  - [ ] Pattern matching works for wildcards (idumb:*)
  - [ ] Exception list (init, help) honored
- **Blocks:**
  - Task 0.5 (Chain Enforcement Hook)
  - ALL command prerequisite enforcement
- **Depends On:** None (parallel with 0.1-0.3)

---

## Task 0.5: Chain Enforcement in command.execute.before

**Source:** 01-05-PLAN.md Task 01-05-T2, 01-05-IMPL lines 440-575

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `checkPrerequisite()` and `checkPrerequisites()` functions
  - Add `buildChainBlockMessage()` and `buildChainWarnMessage()` functions
  - Replace/enhance `command.execute.before` hook with:
    - Readonly command bypass
    - Emergency bypass check (--emergency, --bypass-chain)
    - mustBefore prerequisite enforcement
    - shouldBefore soft warnings
    - HARD_BLOCK, SOFT_BLOCK, WARN handling
    - --force override support
- **Lines Added:** ~200
- **Time:** 1.5 hours
- **Success Criteria:**
  - [ ] `/idumb:roadmap` blocked without state.json → redirects to init
  - [ ] `/idumb:roadmap` blocked without PROJECT.md → shows error
  - [ ] `/idumb:help` works without any prerequisites
  - [ ] `/idumb:execute-phase --force` works despite missing CONTEXT.md
  - [ ] Violations logged in state.json history
- **Blocks:**
  - ALL command workflow execution
- **Depends On:** Task 0.4

---

## Task 0.6: Add Missing `readdirSync` Import

**Source:** 01-05-IMPL (code uses readdirSync but may not be imported)

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Verify `readdirSync` is imported from 'fs'
  - Add if missing: `import { ..., readdirSync } from "fs"`
- **Lines Added:** 1
- **Time:** 5 minutes
- **Success Criteria:**
  - [ ] Plugin compiles without import errors
- **Blocks:** Task 0.5 (path glob checking)
- **Depends On:** None

---

## Task 0.7: pendingViolations Map for Validation Results

**Source:** 01-05-PLAN.md Task 01-05-T3

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `pendingViolations` Map (parallel to pendingDenials)
  - Add `consumeValidationResult()` function
  - Add `buildValidationFailureMessage()` function
  - Modify `tool.execute.after` to check pendingViolations
- **Lines Added:** ~60
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] Validation tool outputs stored when overall === 'fail'
  - [ ] Failed validations can block subsequent operations
  - [ ] Actionable error messages provided
- **Blocks:** Validation-driven blocking
- **Depends On:** Task 0.3

---

# Priority 1: High Priority (Agent & Command Contracts)

> **Blocks execution workflows. Required for delegation chain to function.**

## Task 1.1: Session Start Governance Injection

**Source:** 01-03-PLAN.md Task P1-3.3

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `buildGovernancePrefix()` function with role-specific instructions
  - Add `detectSessionId()` helper
  - Add `experimental.chat.messages.transform` hook
  - Inject governance prefix to first user message on session start
- **Lines Added:** ~100
- **Time:** 45 minutes
- **Success Criteria:**
  - [ ] Hook is added to plugin return object
  - [ ] buildGovernancePrefix returns role-specific text
  - [ ] Session start correctly detected
  - [ ] Governance prepended to first user message
- **Blocks:** Agent role awareness
- **Depends On:** Task 0.1, Task 0.2, Task 0.3

---

## Task 1.2: Post-Compact Hierarchy Reminder

**Source:** 01-03-PLAN.md Task P1-3.4

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `buildPostCompactReminder()` function
  - Enhance `experimental.chat.messages.transform` to detect compaction
  - Append hierarchy reminder after compaction summary
- **Lines Added:** ~40
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] Post-compact detection works
  - [ ] Reminder includes role and critical anchors
  - [ ] Hierarchy reminder appended after compaction
- **Blocks:** Session continuity
- **Depends On:** Task 1.1

---

## Task 1.3: Permission Auto-Deny Hook

**Source:** 01-03-PLAN.md Task P1-3.6

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Add `permission.ask` hook
  - Add `buildViolationGuidance()` function
  - Enhance `tool.execute.after` for error transformation
- **Lines Added:** ~80
- **Time:** 45 minutes
- **Success Criteria:**
  - [ ] permission.ask hook auto-denies unauthorized tools
  - [ ] Violations logged to state history
  - [ ] Error output includes guidance message with hierarchy reminder
- **Blocks:** Permission enforcement feedback
- **Depends On:** Task 0.3

---

## Task 1.4: Event Lifecycle Hooks

**Source:** 01-03-PLAN.md Task P1-3.7

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Enhance `event` hook for session lifecycle
  - Handle session.created, session.idle, session.compacted
  - Handle permission.replied events
  - Cleanup session trackers on idle
- **Lines Added:** ~70
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] Session tracker initialized on session.created
  - [ ] Permission denials logged via event
  - [ ] Tracker cleaned up on session.idle
  - [ ] governanceInjected reset on compact
- **Blocks:** Session state management
- **Depends On:** Task 0.1

---

## Task 1.5-1.10: Add Frontmatter to 6 Existing Agents

**Source:** 01-01-PLAN.md Tasks P1-01-T1 through P1-01-T6

- **Files:** 
  - `template/agents/idumb-planner.md`
  - `template/agents/idumb-plan-checker.md`
  - `template/agents/idumb-roadmapper.md`
  - `template/agents/idumb-phase-researcher.md`
  - `template/agents/idumb-project-researcher.md`
  - `template/agents/idumb-research-synthesizer.md`
- **Type:** modify (each)
- **Changes:** Prepend OpenCode YAML frontmatter before existing `# @agent-name` heading
- **Lines Added:** ~20 per file (120 total)
- **Time:** 30 minutes (batch)
- **Success Criteria:**
  - [ ] Each file has valid YAML frontmatter
  - [ ] Frontmatter placed before first heading
  - [ ] No syntax errors in YAML
- **Blocks:** Agent recognition by OpenCode
- **Depends On:** None (parallel)

---

## Task 1.11-1.14: Create 4 Missing Agents

**Source:** 01-01-PLAN.md Tasks P1-01-T7 through P1-01-T10

- **Files (CREATE):**
  - `template/agents/idumb-executor.md` (~100 lines)
  - `template/agents/idumb-verifier.md` (~110 lines)
  - `template/agents/idumb-debugger.md` (~120 lines)
  - `template/agents/idumb-integration-checker.md` (~110 lines)
- **Type:** create
- **Changes:** Create agent files with full frontmatter and role definitions
- **Lines Added:** ~440 total
- **Time:** 1 hour (batch)
- **Success Criteria:**
  - [ ] Each file created at correct path
  - [ ] Valid YAML frontmatter
  - [ ] Content follows agent template structure
  - [ ] Integration sections accurate
- **Blocks:** Full agent hierarchy
- **Depends On:** None (parallel)

---

## Task 1.15-1.22: Add Frontmatter to 8 Commands

**Source:** 01-02-PLAN.md Tasks A2-T1 through A2-T8

- **Files:**
  - `template/commands/idumb/new-project.md`
  - `template/commands/idumb/research.md`
  - `template/commands/idumb/roadmap.md`
  - `template/commands/idumb/discuss-phase.md`
  - `template/commands/idumb/plan-phase.md`
  - `template/commands/idumb/execute-phase.md`
  - `template/commands/idumb/verify-work.md`
  - `template/commands/idumb/debug.md`
- **Type:** modify (each)
- **Changes:** Prepend `agent: idumb-supreme-coordinator` frontmatter
- **Lines Added:** ~5 per file (40 total)
- **Time:** 20 minutes (batch)
- **Success Criteria:**
  - [ ] Each command has valid YAML frontmatter
  - [ ] `agent: idumb-supreme-coordinator` present
  - [ ] `description` field accurate
- **Blocks:** Command-to-agent binding
- **Depends On:** None (parallel)

---

## Task 1.23-1.25: Create Missing Commands/Workflows

**Source:** 01-02-PLAN.md Tasks A3-T1 through A3-T3

- **Files (CREATE):**
  - `template/commands/idumb/resume.md` (~50 lines)
  - `template/workflows/research.md` (~130 lines)
  - `template/workflows/roadmap.md` (~130 lines)
- **Type:** create
- **Changes:** Create command and workflow files matching existing patterns
- **Lines Added:** ~310 total
- **Time:** 45 minutes
- **Success Criteria:**
  - [ ] Command file has frontmatter with agent binding
  - [ ] Workflows have entry/exit conditions
  - [ ] Chain rules and integration points defined
- **Blocks:** Complete command chain
- **Depends On:** None (parallel)

---

# Priority 2: Medium Priority (Validation & Integration)

> **Blocks verification workflows. Required for confidence in changes.**

## Task 2.1: Integration Point Validator

**Source:** 01-05-PLAN.md Task 01-05-T4

- **File(s):** `template/tools/idumb-validate.ts`
- **Type:** modify
- **Changes:**
  - Add `IntegrationResult` and `IntegrationReport` interfaces
  - Add `validateAgentIntegrations()` function
  - Add `validateCommandIntegrations()` function
  - Add `validateToolIntegrations()` function
  - Export new `integrationPoints` tool
- **Lines Added:** ~150
- **Time:** 1 hour
- **Success Criteria:**
  - [ ] `idumb-validate integrationPoints` returns tier results
  - [ ] Agents with no delegations flagged
  - [ ] Commands with no agent binding flagged
  - [ ] Tools with no exports flagged
- **Blocks:** Integration validation
- **Depends On:** None

---

## Task 2.2: Schema Validation Tools

**Source:** 01-05-PLAN.md Task 01-05-T5

- **File(s):** `template/tools/idumb-validate.ts`
- **Type:** modify
- **Changes:**
  - Add `SchemaField` and `ArtifactSchema` interfaces
  - Add `AGENT_SCHEMA`, `COMMAND_SCHEMA`, `PLAN_SCHEMA` constants
  - Add `extractYamlFrontmatter()` function
  - Add `validateFrontmatterAgainstSchema()` function
  - Export `frontmatter` validation tool
  - Export `configSchema` validation tool
- **Lines Added:** ~180
- **Time:** 1 hour
- **Success Criteria:**
  - [ ] `idumb-validate frontmatter --path=... --type=agent` works
  - [ ] Missing required fields reported as failures
  - [ ] `idumb-validate configSchema --configType=state` works
- **Blocks:** Schema enforcement
- **Depends On:** None

---

## Task 2.3: Agent Chain Validation

**Source:** 01-04-PLAN.md Task 01-04-T1

- **File(s):** N/A (validation task, creates evidence)
- **Type:** validation
- **Changes:**
  - Parse all `template/agents/idumb-*.md` files
  - Validate YAML frontmatter against schema
  - Verify hierarchy permissions
  - Create evidence file
- **Evidence:** `.idumb/governance/validations/agent-chain-2026-02-03.json`
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] All 10 agent files validated
  - [ ] No permission violations
  - [ ] Evidence artifact created
- **Blocks:** E2E chain test
- **Depends On:** Task 1.5-1.14 (agents complete)

---

## Task 2.4: Command Chain Validation

**Source:** 01-04-PLAN.md Task 01-04-T2

- **File(s):** N/A (validation task, creates evidence)
- **Type:** validation
- **Changes:**
  - Parse all `template/commands/idumb/*.md` files
  - Validate frontmatter and agent binding
  - Check workflow sequencing
  - Validate against chain-enforcement.md
  - Create evidence file
- **Evidence:** `.idumb/governance/validations/command-chain-2026-02-03.json`
- **Time:** 30 minutes
- **Success Criteria:**
  - [ ] All 12+ command files validated
  - [ ] All commands bound to idumb-supreme-coordinator
  - [ ] Evidence artifact created
- **Blocks:** E2E chain test
- **Depends On:** Task 1.15-1.25 (commands complete)

---

## Task 2.5: E2E Chain Test

**Source:** 01-04-PLAN.md Task 01-04-T3

- **File(s):** N/A (test task, creates evidence)
- **Type:** validation
- **Changes:**
  - Simulate `/idumb:plan-phase 1` workflow
  - Trace delegation chain through all agents
  - Verify permission enforcement at each level
  - Validate state mutations only by authorized agents
  - Create evidence file
- **Evidence:** `.idumb/governance/validations/e2e-chain-2026-02-03.json`
- **Time:** 45 minutes
- **Success Criteria:**
  - [ ] Full chain completes without permission violations
  - [ ] All 8 hops traced and documented
  - [ ] State mutations authorized
  - [ ] Evidence artifact created
- **Blocks:** Phase 1 completion sign-off
- **Depends On:** Task 2.3, Task 2.4, ALL Priority 0-1 tasks

---

## Task 2.6-2.11: Create map-codebase Command (6 subtasks)

**Source:** completion-definitions.yaml, GSD map-codebase.md research

### Task 2.6: Create map-codebase Command File

- **File (CREATE):** `template/commands/idumb/map-codebase.md`
- **Type:** create
- **Lines Added:** ~60
- **Time:** 15 minutes

### Task 2.7: Create map-codebase Workflow File

- **File (CREATE):** `template/workflows/map-codebase.md`
- **Type:** create
- **Lines Added:** ~200
- **Time:** 30 minutes

### Task 2.8: Create idumb-codebase-mapper Agent

- **File (CREATE):** `template/agents/idumb-codebase-mapper.md`
- **Type:** create
- **Lines Added:** ~80
- **Time:** 20 minutes

### Task 2.9: Create Codebase Document Templates

- **Files (ALREADY EXIST - verify):**
  - `template/templates/codebase/stack.md`
  - `template/templates/codebase/architecture.md`
  - `template/templates/codebase/structure.md`
  - `template/templates/codebase/conventions.md`
- **Type:** verify/update
- **Time:** 10 minutes

### Task 2.10: Update completion-definitions.yaml

- **File:** `template/governance/completion-definitions.yaml`
- **Type:** verify (already defined)
- **Changes:** Verify map_codebase section is complete
- **Time:** 5 minutes

### Task 2.11: Integration Test

- **Type:** validation
- **Time:** 15 minutes

**Combined Success Criteria:**
- [ ] `/idumb:map-codebase` command exists
- [ ] Workflow spawns 4 parallel scanner agents
- [ ] Creates `.idumb/codebase-map.json`
- [ ] Templates used for structured output
- [ ] Completion criteria from completion-definitions.yaml enforced

---

# Priority 3: Low Priority (Enhancements)

> **Not blocking, but improve robustness and user experience.**

## Task 3.1: Enhanced Error Messages

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:** Add more detailed guidance in violation messages
- **Time:** 20 minutes
- **Depends On:** Priority 0-1 complete

---

## Task 3.2: Execution Metrics Tracking

**Source:** completion-definitions.yaml Section 5

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Create `.idumb/brain/execution-metrics.json` on workflow start
  - Track iteration counts, agent spawns, errors
  - Check against global limits
- **Time:** 30 minutes
- **Depends On:** Task 0.1

---

## Task 3.3: Loop Termination Enforcement

**Source:** completion-definitions.yaml Section 3 (agent_loops)

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:**
  - Track planner→checker iterations (max 5)
  - Track validator→fix retries (max 3 per task)
  - Track delegation depth (max 3)
  - EMERGENCY_HALT on limits exceeded
- **Time:** 45 minutes
- **Depends On:** Task 0.1, Task 3.2

---

## Task 3.4: Checkpoint Management

- **Files (CREATE):** 
  - `.idumb/execution/{phase}/checkpoint-*.json` (structure)
- **Type:** create structure
- **Changes:** Define checkpoint schema and save points
- **Time:** 30 minutes
- **Depends On:** Priority 2 complete

---

## Task 3.5: VERIFICATION.md Template

- **File (CREATE):** `template/templates/verification.md`
- **Type:** create
- **Lines Added:** ~50
- **Time:** 15 minutes
- **Depends On:** None

---

## Task 3.6: SUMMARY.md Template

- **File (CREATE):** `template/templates/summary.md`
- **Type:** create
- **Lines Added:** ~40
- **Time:** 15 minutes
- **Depends On:** None

---

## Task 3.7: Update AGENTS.md with New Agents

- **File:** `AGENTS.md`
- **Type:** modify
- **Changes:** Add references to new agents (executor, verifier, debugger, integration-checker)
- **Time:** 15 minutes
- **Depends On:** Task 1.11-1.14

---

## Task 3.8: Plugin Log Rotation

- **File(s):** `template/plugins/idumb-core.ts`
- **Type:** modify
- **Changes:** Rotate logs when exceeding size limit
- **Time:** 20 minutes
- **Depends On:** None

---

# Files Summary

## Files To Be Created (12)

| Path | Priority | Lines | Source |
|------|----------|-------|--------|
| `template/agents/idumb-executor.md` | P1 | ~100 | 01-01-PLAN T7 |
| `template/agents/idumb-verifier.md` | P1 | ~110 | 01-01-PLAN T8 |
| `template/agents/idumb-debugger.md` | P1 | ~120 | 01-01-PLAN T9 |
| `template/agents/idumb-integration-checker.md` | P1 | ~110 | 01-01-PLAN T10 |
| `template/commands/idumb/resume.md` | P1 | ~50 | 01-02-PLAN A3-T1 |
| `template/workflows/research.md` | P1 | ~130 | 01-02-PLAN A3-T2 |
| `template/workflows/roadmap.md` | P1 | ~130 | 01-02-PLAN A3-T3 |
| `template/commands/idumb/map-codebase.md` | P2 | ~60 | completion-definitions |
| `template/workflows/map-codebase.md` | P2 | ~200 | GSD research |
| `template/agents/idumb-codebase-mapper.md` | P2 | ~80 | GSD research |
| `template/templates/verification.md` | P3 | ~50 | completion-definitions |
| `template/templates/summary.md` | P3 | ~40 | completion-definitions |

**Total Lines To Create:** ~1,180

## Files To Be Modified (17)

| Path | Priority | Changes | Lines Added | Source |
|------|----------|---------|-------------|--------|
| `template/plugins/idumb-core.ts` | P0-P1 | Session tracking, permissions, hooks | ~730 | 01-03, 01-05 |
| `template/tools/idumb-validate.ts` | P2 | Integration + schema validation | ~330 | 01-05 |
| `template/agents/idumb-planner.md` | P1 | Add frontmatter | ~20 | 01-01 |
| `template/agents/idumb-plan-checker.md` | P1 | Add frontmatter | ~20 | 01-01 |
| `template/agents/idumb-roadmapper.md` | P1 | Add frontmatter | ~20 | 01-01 |
| `template/agents/idumb-phase-researcher.md` | P1 | Add frontmatter | ~20 | 01-01 |
| `template/agents/idumb-project-researcher.md` | P1 | Add frontmatter | ~20 | 01-01 |
| `template/agents/idumb-research-synthesizer.md` | P1 | Add frontmatter | ~20 | 01-01 |
| `template/commands/idumb/new-project.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/research.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/roadmap.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/discuss-phase.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/plan-phase.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/execute-phase.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/verify-work.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `template/commands/idumb/debug.md` | P1 | Add frontmatter | ~5 | 01-02 |
| `AGENTS.md` | P3 | Add new agent references | ~10 | Enhancement |

**Total Lines To Add:** ~1,230

---

# Hierarchical TODO Export

```yaml
# iDumb Phase 1 Implementation TODO
# Generated: 2026-02-03
# Total Tasks: 44

phase_1:
  priority_0_critical:
    status: pending
    blocking: true
    estimated_hours: 3
    
    tasks:
      - id: P0-T1
        name: "Session Tracking Infrastructure"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: []
        blocks: ["P0-T2", "P0-T3", "P1-*"]
        
      - id: P0-T2
        name: "Tool Permission Matrix"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: ["P0-T1"]
        blocks: ["P0-T3"]
        
      - id: P0-T3
        name: "First Tool Enforcement Hook"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: ["P0-T1", "P0-T2"]
        blocks: ["P1-T1", "P1-T3"]
        
      - id: P0-T4
        name: "Chain Rule Interfaces"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: []
        blocks: ["P0-T5"]
        
      - id: P0-T5
        name: "Chain Enforcement Hook"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: ["P0-T4"]
        blocks: ["ALL_COMMANDS"]
        
      - id: P0-T6
        name: "Add readdirSync Import"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: []
        blocks: ["P0-T5"]
        
      - id: P0-T7
        name: "pendingViolations Map"
        file: "template/plugins/idumb-core.ts"
        status: pending
        depends_on: ["P0-T3"]
        blocks: ["VALIDATION_BLOCKING"]

  priority_1_high:
    status: pending
    blocking: true
    estimated_hours: 6
    
    tasks:
      # Plugin hooks (sequential)
      - id: P1-T1
        name: "Session Start Governance Injection"
        file: "template/plugins/idumb-core.ts"
        depends_on: ["P0-T1", "P0-T2", "P0-T3"]
        
      - id: P1-T2
        name: "Post-Compact Hierarchy Reminder"
        file: "template/plugins/idumb-core.ts"
        depends_on: ["P1-T1"]
        
      - id: P1-T3
        name: "Permission Auto-Deny Hook"
        file: "template/plugins/idumb-core.ts"
        depends_on: ["P0-T3"]
        
      - id: P1-T4
        name: "Event Lifecycle Hooks"
        file: "template/plugins/idumb-core.ts"
        depends_on: ["P0-T1"]

      # Agent frontmatter (parallel batch)
      - id: P1-T5
        name: "Add Frontmatter - idumb-planner.md"
        file: "template/agents/idumb-planner.md"
        parallel_group: "agent-frontmatter"
        
      - id: P1-T6
        name: "Add Frontmatter - idumb-plan-checker.md"
        file: "template/agents/idumb-plan-checker.md"
        parallel_group: "agent-frontmatter"
        
      - id: P1-T7
        name: "Add Frontmatter - idumb-roadmapper.md"
        file: "template/agents/idumb-roadmapper.md"
        parallel_group: "agent-frontmatter"
        
      - id: P1-T8
        name: "Add Frontmatter - idumb-phase-researcher.md"
        file: "template/agents/idumb-phase-researcher.md"
        parallel_group: "agent-frontmatter"
        
      - id: P1-T9
        name: "Add Frontmatter - idumb-project-researcher.md"
        file: "template/agents/idumb-project-researcher.md"
        parallel_group: "agent-frontmatter"
        
      - id: P1-T10
        name: "Add Frontmatter - idumb-research-synthesizer.md"
        file: "template/agents/idumb-research-synthesizer.md"
        parallel_group: "agent-frontmatter"

      # New agents (parallel batch)
      - id: P1-T11
        name: "Create idumb-executor.md"
        file: "template/agents/idumb-executor.md"
        type: create
        parallel_group: "new-agents"
        
      - id: P1-T12
        name: "Create idumb-verifier.md"
        file: "template/agents/idumb-verifier.md"
        type: create
        parallel_group: "new-agents"
        
      - id: P1-T13
        name: "Create idumb-debugger.md"
        file: "template/agents/idumb-debugger.md"
        type: create
        parallel_group: "new-agents"
        
      - id: P1-T14
        name: "Create idumb-integration-checker.md"
        file: "template/agents/idumb-integration-checker.md"
        type: create
        parallel_group: "new-agents"

      # Command frontmatter (parallel batch)
      - id: P1-T15
        name: "Add Frontmatter - new-project.md"
        file: "template/commands/idumb/new-project.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T16
        name: "Add Frontmatter - research.md"
        file: "template/commands/idumb/research.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T17
        name: "Add Frontmatter - roadmap.md"
        file: "template/commands/idumb/roadmap.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T18
        name: "Add Frontmatter - discuss-phase.md"
        file: "template/commands/idumb/discuss-phase.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T19
        name: "Add Frontmatter - plan-phase.md"
        file: "template/commands/idumb/plan-phase.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T20
        name: "Add Frontmatter - execute-phase.md"
        file: "template/commands/idumb/execute-phase.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T21
        name: "Add Frontmatter - verify-work.md"
        file: "template/commands/idumb/verify-work.md"
        parallel_group: "command-frontmatter"
        
      - id: P1-T22
        name: "Add Frontmatter - debug.md"
        file: "template/commands/idumb/debug.md"
        parallel_group: "command-frontmatter"

      # New commands/workflows (parallel batch)
      - id: P1-T23
        name: "Create resume.md command"
        file: "template/commands/idumb/resume.md"
        type: create
        parallel_group: "new-commands"
        
      - id: P1-T24
        name: "Create research.md workflow"
        file: "template/workflows/research.md"
        type: create
        parallel_group: "new-commands"
        
      - id: P1-T25
        name: "Create roadmap.md workflow"
        file: "template/workflows/roadmap.md"
        type: create
        parallel_group: "new-commands"

  priority_2_medium:
    status: pending
    blocking: false
    estimated_hours: 5
    
    tasks:
      - id: P2-T1
        name: "Integration Point Validator"
        file: "template/tools/idumb-validate.ts"
        
      - id: P2-T2
        name: "Schema Validation Tools"
        file: "template/tools/idumb-validate.ts"
        
      - id: P2-T3
        name: "Agent Chain Validation"
        type: validation
        depends_on: ["P1-T5..P1-T14"]
        
      - id: P2-T4
        name: "Command Chain Validation"
        type: validation
        depends_on: ["P1-T15..P1-T25"]
        
      - id: P2-T5
        name: "E2E Chain Test"
        type: validation
        depends_on: ["P2-T3", "P2-T4", "P0-*", "P1-*"]
        
      - id: P2-T6
        name: "Create map-codebase Command"
        file: "template/commands/idumb/map-codebase.md"
        type: create
        
      - id: P2-T7
        name: "Create map-codebase Workflow"
        file: "template/workflows/map-codebase.md"
        type: create
        
      - id: P2-T8
        name: "Create idumb-codebase-mapper Agent"
        file: "template/agents/idumb-codebase-mapper.md"
        type: create

  priority_3_low:
    status: pending
    blocking: false
    estimated_hours: 4
    
    tasks:
      - id: P3-T1
        name: "Enhanced Error Messages"
        
      - id: P3-T2
        name: "Execution Metrics Tracking"
        
      - id: P3-T3
        name: "Loop Termination Enforcement"
        
      - id: P3-T4
        name: "Checkpoint Management"
        
      - id: P3-T5
        name: "VERIFICATION.md Template"
        type: create
        
      - id: P3-T6
        name: "SUMMARY.md Template"
        type: create
        
      - id: P3-T7
        name: "Update AGENTS.md"
        
      - id: P3-T8
        name: "Plugin Log Rotation"
```

---

# Integration Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION DEPENDENCY GRAPH                         │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 1: Foundation (P0-T1..T7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────┐     ┌────────────────────┐
  │ P0-T1: Session   │────▶│ P0-T2: Tool Matrix │
  │ Tracking         │     └─────────┬──────────┘
  └────────┬─────────┘               │
           │     ┌───────────────────▼───────────────────┐
           │     │ P0-T3: First Tool Enforcement        │
           │     └───────────────────┬───────────────────┘
           │                         │
           │     ┌───────────────────▼───────────────────┐
           │     │ P0-T7: pendingViolations              │
           │     └───────────────────────────────────────┘
           │
  ┌────────┴─────────┐
  │ P0-T4: Chain     │
  │ Rule Interfaces  │
  └────────┬─────────┘
           │     ┌─────────────────────────────────────┐
           ├────▶│ P0-T5: Chain Enforcement Hook       │
           │     └─────────────────────────────────────┘
  ┌────────┴─────────┐
  │ P0-T6: readdirSync│
  └──────────────────┘

LAYER 2: Agent & Command Contracts (P1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [P1-T1..T4: Plugin Hooks]          [P1-T5..T10: Agent Frontmatter]
  ┌─────────────────────────┐        ┌─────────────────────────────┐
  │ P1-T1: Session Start    │        │ 6 existing agents           │
  │ P1-T2: Post-Compact     │        │ (parallel batch)            │
  │ P1-T3: Permission Deny  │        └─────────────┬───────────────┘
  │ P1-T4: Event Lifecycle  │                      │
  └─────────────────────────┘        [P1-T11..T14: New Agents]
           │                         ┌─────────────────────────────┐
           │                         │ 4 new agents                │
           │                         │ (parallel batch)            │
           ▼                         └─────────────┬───────────────┘
  [P1-T15..T22: Command Frontmatter]               │
  ┌─────────────────────────────┐                  │
  │ 8 existing commands         │                  │
  │ (parallel batch)            │                  │
  └─────────────┬───────────────┘                  │
                │                                  │
  [P1-T23..T25: New Commands/Workflows]            │
  ┌─────────────────────────────┐                  │
  │ 1 command, 2 workflows      │                  │
  │ (parallel batch)            │                  │
  └─────────────┬───────────────┘                  │
                │                                  │
                ▼                                  ▼

LAYER 3: Validation & Verification (P2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
  │  │ P2-T1:       │     │ P2-T2:       │     │ P2-T6..T8:   │   │
  │  │ Integration  │     │ Schema       │     │ map-codebase │   │
  │  │ Validator    │     │ Validation   │     │ command      │   │
  │  └──────────────┘     └──────────────┘     └──────────────┘   │
  │                                                                │
  │  ┌──────────────┐     ┌──────────────┐                        │
  │  │ P2-T3:       │     │ P2-T4:       │                        │
  │  │ Agent Chain  │     │ Command Chain│                        │
  │  │ Validation   │     │ Validation   │                        │
  │  └───────┬──────┘     └───────┬──────┘                        │
  │          │                    │                                │
  │          └────────┬───────────┘                                │
  │                   ▼                                            │
  │          ┌──────────────┐                                      │
  │          │ P2-T5:       │                                      │
  │          │ E2E Chain    │                                      │
  │          │ Test         │                                      │
  │          └──────────────┘                                      │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘

LAYER 4: Enhancements (P3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────┐
  │ P3-T1: Error Messages  │ P3-T5: Verification Template           │
  │ P3-T2: Metrics         │ P3-T6: Summary Template                │
  │ P3-T3: Loop Limits     │ P3-T7: Update AGENTS.md                │
  │ P3-T4: Checkpoints     │ P3-T8: Log Rotation                    │
  └──────────────────────────────────────────────────────────────────┘
```

---

# Execution Waves

For optimal parallel execution:

## Wave 1 (Parallel - 1.5 hours)
- P0-T1: Session Tracking Infrastructure
- P0-T4: Chain Rule Interfaces
- P0-T6: readdirSync Import
- P1-T5..T10: Agent Frontmatter (batch)
- P1-T11..T14: New Agents (batch)

## Wave 2 (Sequential on P0 deps - 1 hour)
- P0-T2: Tool Permission Matrix (after P0-T1)
- P0-T3: First Tool Enforcement (after P0-T2)
- P0-T5: Chain Enforcement (after P0-T4, P0-T6)

## Wave 3 (Parallel - 1 hour)
- P0-T7: pendingViolations (after P0-T3)
- P1-T1..T4: Plugin Hooks (after P0-T3)
- P1-T15..T22: Command Frontmatter (batch)
- P1-T23..T25: New Commands/Workflows (batch)

## Wave 4 (Validation - 2 hours)
- P2-T1..T2: Validation Tools
- P2-T3..T4: Agent/Command Chain Validation
- P2-T5: E2E Chain Test

## Wave 5 (Enhancement - 2 hours)
- P2-T6..T8: map-codebase command
- P3-T1..T8: Enhancements

---

# Sign-Off Criteria

Phase 1 is **COMPLETE** when:

- [ ] All Priority 0 tasks complete (7/7)
- [ ] All Priority 1 tasks complete (25/25)
- [ ] All Priority 2 tasks complete (8/8)
- [ ] Priority 3 tasks at least 50% complete (4/8)
- [ ] E2E chain test passes
- [ ] No blocking issues
- [ ] All evidence artifacts created

**Final Evidence:**
```
.idumb/governance/validations/
├── agent-chain-2026-02-03.json
├── command-chain-2026-02-03.json
└── e2e-chain-2026-02-03.json
```

---

*Generated: 2026-02-03 | Phase: 01-contracts-first-governance-core*
*Sources: 01-01-PLAN through 01-05-PLAN, completion-definitions.yaml, validation-matrix-code-spec*
