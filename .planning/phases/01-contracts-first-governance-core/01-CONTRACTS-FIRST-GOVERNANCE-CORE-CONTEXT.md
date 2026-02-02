# Phase 1: Contracts-First Governance Core - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish deterministic governance using OpenCode-native primitives (agents/commands/tools/permissions). Create the hierarchical role system and workflow contracts that replace GSD's "should" with technical "must" through tool-level boundaries. This phase does NOT build the brain (Phase 2) or implement complex interception — it establishes clear contracts that downstream phases will enforce and persist.

**What this phase delivers:**
- `/idumb:init` command that creates `.idumb/` governance structure
- 4-tier agent hierarchy with native OpenCode permissions (not experimental hooks)
- Basic validation tools (`idumb-state`, `idumb-validate`, `idumb-config`)
- GSD integration detection (read-only from `.planning/`, never write)
- Evidence-based validation contracts (pass/fail/partial with evidence paths)

**What this phase does NOT do:**
- Build brain/SQLite storage (Phase 2)
- Implement hop-reading (Phase 3)
- Add async validation loops (Phase 4)
- Lazy-load governance rules (Phase 5)
- Use experimental hooks for enforcement

</domain>

<decisions>
## Implementation Decisions

### Role Hierarchy & Enforcement Style
- Use OpenCode native `permission:` blocks in agent frontmatter (stable API)
- 4-tier hierarchy: Supreme Coordinator (delegate-only) → High Governance (coordination) → Low Validator (read-only validation) → Builder (write-only execution)
- Tool-level permissions enforced by OpenCode, NOT by runtime interception
- Coordinator has `edit: deny, write: deny` in agent config — OpenCode enforces this natively
- NO experimental hook-based blocking — use agent definitions only

### Command Design & GSD Relationship
- `/idumb:*` commands are governance-specific (init, status, validate, help)
- GSD workflow commands (`/gsd:new-project`, `/gsd:plan-phase`, etc.) remain GSD
- iDumb takes over GSD enforcement through agent permissions, NOT command replacement
- Phase 1 does NOT recreate GSD commands — iDumb agents enforce hierarchy when GSD runs
- GSD files in `.planning/` are READ-ONLY for iDumb agents

### Evidence Format & Storage (Phase 1 MVP)
- Phase 1 uses JSON files in `.idumb/governance/validations/`
- Format: `{id, timestamp, scope, result: pass|fail|partial, evidence: [], agent}`
- Evidence paths reference files/lines, not full content
- Prep for Phase 2 SQLite: same schema structure, just file-based initially
- Validation results MUST persist to disk (not context-only) — lesson from SYNTHESIS-05

### Initialization Scope (`/idumb:init`)
- Creates `.idumb/` directory structure only (no GSD scaffolding)
- Detects existing GSD setup via `.planning/` directory presence
- If GSD incomplete: guide user to `/gsd:new-project`, do NOT scaffold GSD files
- Creates:
  - `.idumb/brain/state.json` — current governance state
  - `.idumb/config.json` — governance configuration
  - `.idumb/governance/validations/` — validation result storage
  - `.idumb/anchors/` — context anchor storage (Phase 2 will use)
- Sets `framework.gsd.detected: true/false` in config

### Delegation Patterns
- Use OpenCode native `@agent` delegation in command files
- Pattern: `/idumb:validate` → delegates to @idumb-supreme-coordinator → @idumb-high-governance → @idumb-low-validator
- Delegation context passed via structured prompts, NOT runtime message injection
- Each agent returns YAML-structured results with `status`, `evidence`, `recommendations`
- NO hidden delegation — all chains are explicit in command/agent files

### Permission Boundaries (Tool-Level)
From SYNTHESIS-05 (opencode-workspace pattern):

| Agent | read | write | delegate | tools |
|-------|------|-------|----------|-------|
| Supreme Coordinator | ✅ | ❌ | ✅ | idumb-state, idumb-config, idumb-context |
| High Governance | ✅ | ❌ | ✅ | + idumb-validate, idumb-chunker |
| Low Validator | ✅ | ❌ | ❌ | idumb-validate, idumb-manifest (read-only) |
| Builder | ✅ | ✅ | ❌ | idumb-state, idumb-config |

Enforced via OpenCode `permission:` blocks and `tools:` whitelist — NOT runtime interception.

### Validation Requirements
Every validation MUST produce:
1. **Validation ID**: UUID or timestamp-based
2. **Scope**: what was checked (structure, alignment, schema)
3. **Result**: pass / fail / partial
4. **Evidence**: array of `{check, result, proof}` objects
5. **Timestamp**: ISO 8601
6. **Agent**: which agent performed validation

Stored at: `.idumb/governance/validations/{validation-id}.json`

### Anti-Patterns to Avoid (from SYNTHESIS-01)
- ❌ Experimental hook-based enforcement (`experimental.chat.messages.transform`)
- ❌ Runtime tool blocking via arg modification
- ❌ Pre-loading all governance rules into context
- ❌ Context-only validation results (must persist to disk)
- ❌ Scaffolding GSD files (guide user instead)
- ❌ Writing to `.planning/` directory

</decisions>

<specifics>
## Specific Requirements from Synthesis

### From SYNTHESIS-01 (Wrapper Era Lessons)
- Agent definitions use clear system prompts, not adversarial enforcement
- Hooks are for observation/logging only, not blocking
- Accept LLMs are probabilistic — guide, don't control
- Validate assumptions with minimal prototypes before building

### From SYNTHESIS-02 (GSD Analysis)
- Preserve GSD artifacts: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md
- Add technical enforcement where GSD has "should" — use tool permissions
- Support thin orchestrator pattern (coordinator delegates, doesn't execute)
- Require VERIFICATION.md-style evidence for all validations

### From SYNTHESIS-04 (Brain Stack)
- Phase 1 creates directory structure for Phase 2 brain
- Use JSON files initially, migrate to SQLite in Phase 2
- Schema validation with Zod (start with schemas, add validation in Phase 2)
- Directory layout: `.idumb/brain/`, `.idumb/index/`, `.idumb/governance/`

### From SYNTHESIS-05 (Community Patterns)
- Lazy-load governance rules (opencode-skillful pattern) — Phase 5
- Permission boundaries from opencode-workspace
- Memory blocks pattern (state, history, conflicts)
- Async delegation with disk persistence — Phase 2
- Context pruning (DCP) — Phase 5

</specifics>

<deferred>
## Deferred to Later Phases

**Phase 2 (Brain MVP):**
- SQLite database with better-sqlite3
- Zod schema validation at database level
- Chunked document nodes with IDs
- Relationship graph with graphlib
- Session CRUD operations

**Phase 3 (Retrieval + Hop-Reading):**
- Orama search index
- Tree-sitter parsing for symbol extraction
- Hop-reading across code relationships
- AST caching

**Phase 4 (Auto-Governance Loops):**
- Async validation with background agents
- Closed-loop delegation patterns
- TODO enforcement loops
- Drift detection

**Phase 5 (Context Optimization):**
- Lazy-loading of governance rules/skills
- Context pruning policies
- Model-specific format rendering
- Deduplication and supersede logic

**Out of Scope (GSD handles):**
- `/gsd:new-project` — GSD command
- `/gsd:plan-phase` — GSD command
- `/gsd:execute-phase` — GSD command
- Project roadmap creation
- Requirement traceability (GSD feature)

</deferred>

<architecture>
## Phase 1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER COMMANDS                            │
│  /idumb:init  /idumb:status  /idumb:validate  /idumb:help   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPREME COORDINATOR (primary)                   │
│  - Receives all /idumb:* commands                           │
│  - edit: deny, write: deny (OpenCode enforces)              │
│  - MUST delegate — cannot execute directly                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ HIGH         │    │ HIGH         │    │ HIGH         │
│ GOVERNANCE   │    │ GOVERNANCE   │    │ GOVERNANCE   │
│ (validation) │    │ (delegation) │    │ (status)     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       ↓                   ↓                   ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ LOW          │    │ LOW          │    │ LOW          │
│ VALIDATOR    │    │ VALIDATOR    │    │ VALIDATOR    │
│ (structure)  │    │ (alignment)  │    │ (freshness)  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       ↓                   ↓                   ↓
   Evidence             Evidence            Evidence
       ↓                   ↓                   ↓
┌─────────────────────────────────────────────────────────────┐
│              GOVERNANCE STORAGE (Phase 1: JSON)              │
│  .idumb/governance/validations/{id}.json                    │
│  .idumb/brain/state.json                                    │
│  .idumb/config.json                                         │
└─────────────────────────────────────────────────────────────┘
```

</architecture>

<files>
## Phase 1 Files to Create

### Agents (4 files)
1. `template/agents/idumb-supreme-coordinator.md` — primary mode, delegates only
2. `template/agents/idumb-high-governance.md` — subagent, coordinates validation
3. `template/agents/idumb-low-validator.md` — subagent, read-only validation
4. `template/agents/idumb-builder.md` — subagent, write-only execution

### Commands (4 files)
1. `template/commands/idumb/init.md` — initialize governance
2. `template/commands/idumb/status.md` — check governance state
3. `template/commands/idumb/validate.md` — run validation hierarchy
4. `template/commands/idumb/help.md` — show help information

### Tools (6 files)
1. `template/tools/idumb-state.ts` — read/write state
2. `template/tools/idumb-config.ts` — read/write config
3. `template/tools/idumb-validate.ts` — run validation checks
4. `template/tools/idumb-context.ts` — context classification
5. `template/tools/idumb-manifest.ts` — manifest operations
6. `template/tools/idumb-chunker.ts` — document chunking (stub for Phase 2)

### Plugin
1. `template/plugins/idumb-core.ts` — main plugin file

### Skills
1. `template/skills/idumb-governance/SKILL.md` — governance protocols

</files>

<success_criteria>
## Phase 1 Success Criteria

1. **User can run `/idumb:init`** and see `.idumb/` directory created with:
   - `.idumb/brain/state.json` (valid JSON with required fields)
   - `.idumb/config.json` (valid JSON with governance settings)
   - `.idumb/governance/validations/` (directory exists)
   - `.idumb/anchors/` (directory exists)

2. **Coordinator cannot write files directly**:
   - `edit: deny` in agent config prevents file edits
   - `write: deny` in agent config prevents file writes
   - OpenCode enforces natively (not runtime interception)

3. **Builder can write files**:
   - `edit: allow` in agent config
   - `write: allow` in agent config
   - Only builder agent has these permissions

4. **All governance runs produce validation results**:
   - JSON file created in `.idumb/governance/validations/`
   - Contains: id, timestamp, scope, result, evidence[], agent
   - Evidence references files/paths, not full content

5. **GSD integration respected**:
   - `.planning/` files are never modified by iDumb
   - GSD detected status recorded in config
   - User guided to `/gsd:new-project` if GSD incomplete

</success_criteria>

---

*Phase: 01-contracts-first-governance-core*
*Context gathered: 2026-02-02*
*Based on synthesis: SYNTHESIS-01 through SYNTHESIS-05*
