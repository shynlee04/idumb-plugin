# iDumb Framework Entity Manifest

**Generated:** 2026-02-05  
**Purpose:** Complete file inventory for tools restructure planning  
**Phase:** tools-restructure-planning

---

## Quick Statistics

| Category | File Count | Total Lines |
|----------|------------|-------------|
| Agents | 22 | 15,120 |
| Commands | 20 | 8,938 |
| Workflows | 11 | 7,892 |
| Tools | 12 | 7,147 |
| Plugins | 1 | 1,119 |
| Plugin Libs | 12 | 3,703 |
| Skills (src/) | 11 | 5,063 |
| Skills (.opencode/) | 21 | 7,548 |
| Bin Scripts | 1 | 1,003 |
| **TOTAL** | 111 | 57,533 |

---

## 1. Agents Inventory

### Agent: idumb-builder
- **File:** `src/agents/idumb-builder.md`
- **Lines:** 960
- **Mode:** all
- **Permissions:** write=allow, edit=allow, task=true
- **Tools:** none specified

### Agent: idumb-codebase-mapper
- **File:** `src/agents/idumb-codebase-mapper.md`
- **Lines:** 491
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=deny
- **Tools:** none specified

### Agent: idumb-debugger
- **File:** `src/agents/idumb-debugger.md`
- **Lines:** 618
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-high-governance
- **File:** `src/agents/idumb-high-governance.md`
- **Lines:** 708
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-integration-checker
- **File:** `src/agents/idumb-integration-checker.md`
- **Lines:** 896
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=deny
- **Tools:** none specified

### Agent: idumb-low-validator
- **File:** `src/agents/idumb-low-validator.md`
- **Lines:** 864
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=deny
- **Tools:** none specified

### Agent: idumb-meta-builder
- **File:** `src/agents/idumb-meta-builder.md`
- **Lines:** 1,428
- **Mode:** all
- **Permissions:** write=allow, edit=allow, task=allow
- **Tools:** none specified

### Agent: idumb-meta-validator
- **File:** `src/agents/idumb-meta-validator.md`
- **Lines:** 290
- **Mode:** all
- **Permissions:** write=allow, edit=allow, task=allow
- **Tools:** none specified

### Agent: idumb-mid-coordinator
- **File:** `src/agents/idumb-mid-coordinator.md`
- **Lines:** 810
- **Mode:** all
- **Permissions:** write=allow, edit=allow, task=allow
- **Tools:** none specified

### Agent: idumb-phase-researcher
- **File:** `src/agents/idumb-phase-researcher.md`
- **Lines:** 792
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-plan-checker
- **File:** `src/agents/idumb-plan-checker.md`
- **Lines:** 815
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-planner
- **File:** `src/agents/idumb-planner.md`
- **Lines:** 686
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-project-coordinator
- **File:** `src/agents/idumb-project-coordinator.md`
- **Lines:** 92
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-project-executor
- **File:** `src/agents/idumb-project-executor.md`
- **Lines:** 1,063
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-project-explorer
- **File:** `src/agents/idumb-project-explorer.md`
- **Lines:** 607
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=deny
- **Tools:** none specified

### Agent: idumb-project-researcher
- **File:** `src/agents/idumb-project-researcher.md`
- **Lines:** 784
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-project-validator
- **File:** `src/agents/idumb-project-validator.md`
- **Lines:** 130
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-research-synthesizer
- **File:** `src/agents/idumb-research-synthesizer.md`
- **Lines:** 731
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-roadmapper
- **File:** `src/agents/idumb-roadmapper.md`
- **Lines:** 522
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-skeptic-validator
- **File:** `src/agents/idumb-skeptic-validator.md`
- **Lines:** 1,077
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-supreme-coordinator
- **File:** `src/agents/idumb-supreme-coordinator.md`
- **Lines:** 677
- **Mode:** primary
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

### Agent: idumb-verifier
- **File:** `src/agents/idumb-verifier.md`
- **Lines:** 1,079
- **Mode:** all
- **Permissions:** write=deny, edit=deny, task=allow
- **Tools:** none specified

---

## 2. Commands Inventory

| Command | File | Lines |
|---------|------|-------|
| certify | `src/commands/idumb/certify.md` | 463 |
| config | `src/commands/idumb/config.md` | 430 |
| debug | `src/commands/idumb/debug.md` | 532 |
| discuss-phase | `src/commands/idumb/discuss-phase.md` | 423 |
| execute-phase | `src/commands/idumb/execute-phase.md` | 546 |
| health-check | `src/commands/idumb/health-check.md` | 475 |
| help | `src/commands/idumb/help.md` | 412 |
| init | `src/commands/idumb/init.md` | 683 |
| map-codebase | `src/commands/idumb/map-codebase.md` | 457 |
| new-project | `src/commands/idumb/new-project.md` | 358 |
| plan-phase | `src/commands/idumb/plan-phase.md` | 555 |
| pre-flight | `src/commands/idumb/pre-flight.md` | 409 |
| research | `src/commands/idumb/research.md` | 441 |
| resume | `src/commands/idumb/resume.md` | 450 |
| roadmap | `src/commands/idumb/roadmap.md` | 448 |
| status | `src/commands/idumb/status.md` | 397 |
| stress-test | `src/commands/idumb/stress-test.md` | 395 |
| style | `src/commands/idumb/style.md` | 169 |
| validate | `src/commands/idumb/validate.md` | 517 |
| verify-work | `src/commands/idumb/verify-work.md` | 378 |

**Total Commands:** 20 | **Total Lines:** 8,938

---

## 3. Workflows Inventory

| Workflow | File | Lines |
|----------|------|-------|
| continuous-validation | `src/workflows/continuous-validation.md` | 419 |
| discuss-phase | `src/workflows/discuss-phase.md` | 553 |
| execute-phase | `src/workflows/execute-phase.md` | 728 |
| map-codebase | `src/workflows/map-codebase.md` | 719 |
| plan-phase | `src/workflows/plan-phase.md` | 838 |
| research | `src/workflows/research.md` | 745 |
| resume-project | `src/workflows/resume-project.md` | 833 |
| roadmap | `src/workflows/roadmap.md` | 848 |
| stress-test | `src/workflows/stress-test.md` | 431 |
| transition | `src/workflows/transition.md` | 793 |
| verify-phase | `src/workflows/verify-phase.md` | 985 |

**Total Workflows:** 11 | **Total Lines:** 7,892

---

## 4. Tools Inventory (DETAILED)

### Tool: idumb-state
- **File:** `src/tools/idumb-state.ts`
- **Lines:** 557
- **Status:** ✅ ACTIVE
- **Exported Functions:**
  - `read()` - Read current governance state from state.json
  - `write()` - Write/update governance state
  - `anchor()` - Add a context anchor that survives compaction
  - `history()` - Record an action in governance history
  - `getAnchors()` - Get anchors for compaction context injection
  - `createSession()` - Create new session record for tracking
  - `modifySession()` - Update existing session record
  - `exportSession()` - Export session for long-term brain storage
  - `listSessions()` - List all tracked sessions with status
  - `purgeOldSessions()` - Garbage collection for old sessions/checkpoints

### Tool: idumb-todo
- **File:** `src/tools/idumb-todo.ts`
- **Lines:** 385
- **Status:** ✅ ACTIVE
- **Exported Functions:**
  - `create()` - Create new hierarchical TODO with prefixes
  - `update()` - Update TODO status/content/priority
  - `complete()` - Mark TODO as completed with notes
  - `list()` - List TODOs with filtering
  - `hierarchy()` - Get TODOs organized by hierarchical prefixes
  - `sync()` - Sync with OpenCode's built-in TODO system

### Tool: idumb-style
- **File:** `src/tools/idumb-style.ts`
- **Lines:** 196
- **Status:** ⚠️ PARTIAL
- **Exported Functions:**
  - `list()` - List available output styles
  - `set()` - Set the active output style
  - `info()` - Show style details
  - `reset()` - Reset to default style

### Tool: idumb-config
- **File:** `src/tools/idumb-config.ts`
- **Lines:** 1,022
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `read()` - Read iDumb config (merges with planning config)
  - `update()` - Update configuration values
  - `init()` - Initialize config with defaults
  - `status()` - Get hierarchical status (milestone/phase/plan/task)
  - `sync()` - Sync with .planning/config.json
  - `ensure()` - Ensure config exists, auto-generate if missing

### Tool: idumb-validate
- **File:** `src/tools/idumb-validate.ts`
- **Lines:** 1,043
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `structure()` - Validate .idumb/ directory structure
  - `schema()` - Validate state.json schema
  - `freshness()` - Check for stale context (>48 hours)
  - `planningAlignment()` - Check iDumb/planning state alignment
  - `integrationPoints()` - Validate agent/command/tool integrations
  - `frontmatter()` - Validate YAML frontmatter against schema
  - `configSchema()` - Validate config file against schema

### Tool: idumb-context
- **File:** `src/tools/idumb-context.ts`
- **Lines:** 277
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `default()` - Analyze and classify project context
  - `summary()` - Get brief context summary for compaction
  - `patterns()` - Detect specific patterns (api, database, auth, etc.)

### Tool: idumb-chunker
- **File:** `src/tools/idumb-chunker.ts`
- **Lines:** 930
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `read()` - Read long document in sequential chunks
  - `overview()` - Get document metadata/structure overview
  - `validate()` - Validate document chunk for governance compliance
  - `append()` - Append content to document with validation
  - `parseHierarchy()` - Parse XML/YAML/JSON/MD hierarchical data
  - `shard()` - Shard document by hierarchy levels
  - `index()` - Create ID-based searchable index
  - `extract()` - Fast extraction via bash tools (jq/yq/xmllint)
  - `insert()` - Insert content at hierarchy position
  - `targetEdit()` - Edit content at specific hierarchy location

### Tool: idumb-manifest
- **File:** `src/tools/idumb-manifest.ts`
- **Lines:** 598
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `snapshot()` - Create/update codebase manifest snapshot
  - `drift()` - Check for drift from last manifest
  - `conflicts()` - Detect naming conflicts, circular dependencies
  - `verifyGitHash()` - Verify git state matches expected hash

### Tool: idumb-orchestrator
- **File:** `src/tools/idumb-orchestrator.ts`
- **Lines:** 527
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `orchestrate()` - Meta-orchestrator for validation by operation/risk
  - `preWrite()` - Pre-write validation hook
  - `preDelegate()` - Pre-delegate validation hook
  - `phaseTransition()` - Phase transition validation
  - `activateSkills()` - Activate specific validation skills

### Tool: idumb-performance
- **File:** `src/tools/idumb-performance.ts`
- **Lines:** 533
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `validate()` - Validate for performance issues
  - `monitor()` - Check .idumb resource usage
  - `checkIterationLimits()` - Detect unbounded loops

### Tool: idumb-quality
- **File:** `src/tools/idumb-quality.ts`
- **Lines:** 524
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `validate()` - Validate error handling, cross-platform, docs
  - `checkDocs()` - Check documentation coverage
  - `checkErrors()` - Check error handling patterns

### Tool: idumb-security
- **File:** `src/tools/idumb-security.ts`
- **Lines:** 359
- **Status:** ❌ ORPHANED
- **Exported Functions:**
  - `validate()` - Validate bash scripts for security vulnerabilities
  - `scan()` - Quick security scan for common vulnerabilities

---

## 5. Plugins Inventory

### Core Plugins

| Plugin | File | Lines |
|--------|------|-------|
| idumb-core | `src/plugins/idumb-core.ts` | 1,119 |

### Plugin Libraries

| Library | File | Lines |
|---------|------|-------|
| chain-rules | `src/plugins/lib/chain-rules.ts` | 467 |
| checkpoint | `src/plugins/lib/checkpoint.ts` | 356 |
| config | `src/plugins/lib/config.ts` | 312 |
| execution-metrics | `src/plugins/lib/execution-metrics.ts` | 372 |
| governance-builder | `src/plugins/lib/governance-builder.ts` | 634 |
| index | `src/plugins/lib/index.ts` | 130 |
| logging | `src/plugins/lib/logging.ts` | 117 |
| schema-validator | `src/plugins/lib/schema-validator.ts` | 284 |
| session-tracker | `src/plugins/lib/session-tracker.ts` | 384 |
| state | `src/plugins/lib/state.ts` | 188 |
| styles | `src/plugins/lib/styles.ts` | 178 |
| types | `src/plugins/lib/types.ts` | 281 |

**Total Plugin Libs:** 12 | **Total Lines:** 3,703

---

## 6. Skills Inventory (src/skills/)

| Skill | Path | Lines |
|-------|------|-------|
| hierarchical-mindfulness | `src/skills/hierarchical-mindfulness/SKILL.md` | 356 |
| idumb-code-quality | `src/skills/idumb-code-quality/SKILL.md` | 479 |
| idumb-governance | `src/skills/idumb-governance/SKILL.md` | 342 |
| idumb-meta-builder | `src/skills/idumb-meta-builder/SKILL.md` | 465 |
| idumb-meta-orchestrator | `src/skills/idumb-meta-orchestrator/SKILL.md` | 376 |
| idumb-performance | `src/skills/idumb-performance/SKILL.md` | 477 |
| idumb-project-validation | `src/skills/idumb-project-validation/SKILL.md` | 687 |
| idumb-security | `src/skills/idumb-security/SKILL.md` | 336 |
| idumb-stress-test | `src/skills/idumb-stress-test/SKILL.md` | 703 |
| idumb-validation | `src/skills/idumb-validation/SKILL.md` | 719 |
| output-style-enforcement | `src/skills/output-style-enforcement/SKILL.md` | 123 |

**Total Skills (src/):** 11 | **Total Lines:** 5,063

---

## 7. Bin Scripts Inventory

| Script | File | Lines |
|--------|------|-------|
| install | `bin/install.js` | 1,003 |

---

## 8. Tool Status Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ ACTIVE | 2 | 16.7% |
| ⚠️ PARTIAL | 1 | 8.3% |
| ❌ ORPHANED | 9 | 75.0% |

### Orphaned Tools Detail

| Tool | Lines | Why Orphaned | Priority |
|------|-------|--------------|----------|
| **idumb-config** | 1,022 | Config created by installer only, no runtime calls | MEDIUM |
| **idumb-validate** | 1,043 | 7 exports, no plugin invocation | HIGH |
| **idumb-context** | 277 | Never called despite 18 agent references | HIGH |
| **idumb-chunker** | 930 | 10 exports overwhelm LLM decision | HIGH |
| **idumb-manifest** | 598 | No drift detection wired | MEDIUM |
| **idumb-orchestrator** | 527 | Coordinates nothing, no hooks | LOW |
| **idumb-performance** | 533 | No hook integration | LOW |
| **idumb-quality** | 524 | No hook integration | LOW |
| **idumb-security** | 359 | No hook integration | LOW |

**Total Orphaned Lines:** 5,813 (81% of all tool code)

---

## 9. Agent Capability Matrix

| Agent | Mode | Write | Edit | Task | Category |
|-------|------|-------|------|------|----------|
| idumb-supreme-coordinator | primary | deny | deny | allow | Coordinator |
| idumb-high-governance | all | deny | deny | allow | Coordinator |
| idumb-mid-coordinator | all | allow | allow | allow | Coordinator |
| idumb-project-coordinator | all | deny | deny | allow | Coordinator |
| idumb-meta-builder | all | allow | allow | allow | Builder |
| idumb-builder | all | allow | allow | allow | Builder |
| idumb-meta-validator | all | allow | allow | allow | Validator |
| idumb-low-validator | all | deny | deny | deny | Validator |
| idumb-skeptic-validator | all | deny | deny | allow | Validator |
| idumb-project-validator | all | deny | deny | allow | Validator |
| idumb-verifier | all | deny | deny | allow | Validator |
| idumb-integration-checker | all | deny | deny | deny | Validator |
| idumb-project-executor | all | deny | deny | allow | Executor |
| idumb-debugger | all | deny | deny | allow | Executor |
| idumb-planner | all | deny | deny | allow | Planner |
| idumb-plan-checker | all | deny | deny | allow | Planner |
| idumb-roadmapper | all | deny | deny | allow | Planner |
| idumb-phase-researcher | all | deny | deny | allow | Researcher |
| idumb-project-researcher | all | deny | deny | allow | Researcher |
| idumb-research-synthesizer | all | deny | deny | allow | Researcher |
| idumb-project-explorer | all | deny | deny | deny | Researcher |
| idumb-codebase-mapper | all | deny | deny | deny | Researcher |

### Permission Summary

| Permission | Allow | Deny | Total |
|------------|-------|------|-------|
| Write | 4 | 18 | 22 |
| Edit | 4 | 18 | 22 |
| Task | 17 | 5 | 22 |

---

## 10. Cross-Reference: Tools to Assessment

From `.plugin-dev/TOOLS-ASSESSMENT-2026-02-05.md`:

| Tool | Assessment Status | Agent Refs | Cmd Refs | Runtime Evidence |
|------|-------------------|------------|----------|------------------|
| idumb-state | ✅ ACTIVE | 18 | 8 | state.json updates, logs |
| idumb-todo | ✅ ACTIVE | 22 | 5 | todos.json exists |
| idumb-style | ⚠️ PARTIAL | 0 | 1 | styles/ dir exists |
| idumb-config | ❌ ORPHANED | 5 | 5 | config from installer only |
| idumb-validate | ❌ ORPHANED | 13 | 5 | no execution artifacts |
| idumb-context | ❌ ORPHANED | 18 | 4 | no execution evidence |
| idumb-chunker | ❌ ORPHANED | 16 | 1 | no execution evidence |
| idumb-manifest | ❌ ORPHANED | 5 | 1 | no execution evidence |
| idumb-orchestrator | ❌ ORPHANED | 4 | 0 | no execution evidence |
| idumb-performance | ❌ ORPHANED | 5 | 0 | no execution evidence |
| idumb-quality | ❌ ORPHANED | 5 | 0 | no execution evidence |
| idumb-security | ❌ ORPHANED | 5 | 0 | no execution evidence |

---

## 11. Key Findings

### Tools Analysis
- **75% orphaned** (9 of 12 tools)
- **Only 16% actively used** (1,138 of 7,147 lines)
- **50+ exports** across all tools - LLM decision fatigue

### Agent Analysis
- **22 agents** total
- **81.8% deny write/edit** (18 of 22)
- **77.3% allow task delegation** (17 of 22)
- **Only 4 agents can write files** (builders + meta-validator)

### Framework Scope
- **Total Lines:** 57,533
- **Largest File:** `idumb-meta-builder.md` (1,428 lines)
- **Smallest File:** `idumb-project-coordinator.md` (92 lines)

### Ready For Restructure
Based on assessment, priority candidates for restructure:
1. **Consolidate 5 validation tools** → single `idumb-check`
2. **Wire idumb-context** → session.created hook
3. **Wire idumb-validate** → pre-write hook
4. **Clean agent frontmatter** → remove unused tool references

---

*Manifest generated by @idumb-codebase-mapper for restructure planning*
*Source: Research from `.plugin-dev/TOOLS-ASSESSMENT-2026-02-05.md`*
