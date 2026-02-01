# GSD Framework Research

**Project:** iDumb Meta-Framework Plugin
**Researched:** 2026-02-02
**Source Confidence:** HIGH (Official GitHub README, npm registry)

---

## Executive Summary

GSD (Get Shit Done) is a lightweight, powerful meta-prompting and context engineering system for Claude Code, OpenCode, and Gemini CLI. It solves "context rot" - the quality degradation that happens as context windows fill up. iDumb will wrap GSD to add hierarchical governance, advanced context management, and expert-skeptic enforcement.

---

## Framework Overview

### Philosophy
- **Simplicity over ceremony** - No enterprise theater (sprint ceremonies, story points)
- **Complexity in system, not workflow** - Behind-the-scenes: context engineering, XML prompts, subagent orchestration
- **Trust the workflow** - System gives Claude everything it needs to do work AND verify it

### Installation

```bash
npx get-shit-done-cc

# Options
--claude --global    # Install to ~/.claude/
--claude --local     # Install to ./.claude/
--opencode --global  # Install to ~/.config/opencode/
--gemini --global    # Install to ~/.gemini/
--all --global       # Install to all directories
```

### Stats (as of 2026-02-02)
- **7.6k GitHub stars**
- **782 forks**
- **v1.9.11 latest release**
- **Trusted by engineers at Amazon, Google, Shopify, Webflow**

---

## Core Hierarchy

### Milestone → Phase → Plan → Task

| Level | Description | Files Generated |
|-------|-------------|-----------------|
| **Milestone** | Major version/release cycle | `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md` |
| **Phase** | Roadmap segment (feature area) | `{N}-CONTEXT.md`, `{N}-RESEARCH.md`, `{N}-{M}-PLAN.md` |
| **Plan** | Atomic execution unit (2-3 per phase) | `{N}-{M}-PLAN.md`, `{N}-{M}-SUMMARY.md` |
| **Task** | Individual work item in XML format | Within PLAN.md |

---

## Workflow Commands

### Core Workflow (Full Cycle)

| Command | What It Does | Creates |
|---------|--------------|---------|
| `/gsd:new-project` | Questions → Research → Requirements → Roadmap | `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `.planning/research/` |
| `/gsd:discuss-phase [N]` | Capture implementation decisions before planning | `{N}-CONTEXT.md` |
| `/gsd:plan-phase [N]` | Research → Plan → Verify for phase | `{N}-RESEARCH.md`, `{N}-{M}-PLAN.md` |
| `/gsd:execute-phase <N>` | Run plans in waves, verify when complete | `{N}-{M}-SUMMARY.md`, `{N}-VERIFICATION.md` |
| `/gsd:verify-work [N]` | Manual user acceptance testing | `{N}-UAT.md`, fix plans if needed |
| `/gsd:complete-milestone` | Archive milestone, tag release | Git tag |
| `/gsd:new-milestone [name]` | Start next version | New `ROADMAP.md` |

### Navigation

| Command | Purpose |
|---------|---------|
| `/gsd:progress` | Where am I? What's next? |
| `/gsd:help` | Show all commands |
| `/gsd:update` | Update GSD with changelog |

### Phase Management

| Command | Purpose |
|---------|---------|
| `/gsd:add-phase` | Append phase to roadmap |
| `/gsd:insert-phase [N]` | Insert urgent work between phases |
| `/gsd:remove-phase [N]` | Remove future phase, renumber |
| `/gsd:list-phase-assumptions [N]` | See Claude's intended approach |
| `/gsd:plan-milestone-gaps` | Create phases to close gaps from audit |

### Session Management

| Command | Purpose |
|---------|---------|
| `/gsd:pause-work` | Create handoff when stopping mid-phase |
| `/gsd:resume-work` | Restore from last session |

### Utilities

| Command | Purpose |
|---------|---------|
| `/gsd:map-codebase` | Analyze existing codebase (brownfield) |
| `/gsd:quick` | Ad-hoc task without full planning |
| `/gsd:debug [desc]` | Systematic debugging with persistent state |
| `/gsd:add-todo [desc]` | Capture idea for later |
| `/gsd:check-todos` | List pending todos |
| `/gsd:settings` | Configure model profile and agents |
| `/gsd:set-profile <profile>` | Switch model profile |

---

## Context Engineering Files

### File System

| File | Purpose | Size Constraint |
|------|---------|-----------------|
| `PROJECT.md` | Project vision, always loaded | Must stay concise |
| `.planning/research/` | Ecosystem knowledge (stack, features, architecture, pitfalls) | Segmented by topic |
| `REQUIREMENTS.md` | Scoped v1/v2 requirements with phase traceability | Phase-mapped |
| `ROADMAP.md` | Where you're going, what's done | Phase status |
| `STATE.md` | Decisions, blockers, position — memory across sessions | **< 100 lines critical** |
| `PLAN.md` | Atomic task with XML structure, verification steps | Per-execution |
| `SUMMARY.md` | What happened, what changed, committed to history | Post-execution |
| `todos/` | Captured ideas and tasks for later work | Append-only |
| `{N}-CONTEXT.md` | Implementation decisions for phase N | User preferences |
| `{N}-UAT.md` | User acceptance test results | Verification |

### STATE.md (Critical)

The single source of truth for session memory. Must stay under ~100 lines to remain effective.

Contains:
- Current position (phase, plan, task)
- Decisions made
- Blockers encountered
- Key context that must survive compaction

---

## Multi-Agent Orchestration

### Pattern: Thin Orchestrator + Specialized Agents

| Stage | Orchestrator Does | Agents Do |
|-------|-------------------|-----------|
| **Research** | Coordinates, presents findings | 4 parallel researchers: stack, features, architecture, pitfalls |
| **Planning** | Validates, manages iteration | Planner creates plans, checker verifies, loop until pass |
| **Execution** | Groups into waves, tracks progress | Executors implement in parallel, each with fresh 200k context |
| **Verification** | Presents results, routes next | Verifier checks codebase against goals, debuggers diagnose failures |

### Key Insight: Context Isolation

**The orchestrator never does heavy lifting.** It spawns agents, waits, integrates results.

**Result:** An entire phase (research, multiple plans, thousands of LOC, verification) runs while main context stays at 30-40%. Work happens in fresh subagent contexts.

---

## XML Task Format

```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT (not jsonwebtoken - CommonJS issues).
    Validate credentials against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

### Task Attributes
- `type="auto"` - Automated execution
- `<name>` - Task identifier
- `<files>` - Target files
- `<action>` - What to do
- `<verify>` - How to verify
- `<done>` - Definition of done

---

## Configuration

### Location
`.planning/config.json`

### Core Settings

| Setting | Options | Default | Purpose |
|---------|---------|---------|---------|
| `mode` | `yolo`, `interactive` | `interactive` | Auto-approve vs confirm each step |
| `depth` | `quick`, `standard`, `comprehensive` | `standard` | Planning thoroughness |

### Model Profiles

| Profile | Planning | Execution | Verification |
|---------|----------|-----------|--------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced` | Opus | Sonnet | Sonnet |
| `budget` | Sonnet | Sonnet | Haiku |

### Workflow Agents (Optional)

| Setting | Default | Purpose |
|---------|---------|---------|
| `workflow.research` | `true` | Research before planning each phase |
| `workflow.plan_check` | `true` | Verify plans achieve goals before execution |
| `workflow.verifier` | `true` | Confirm must-haves delivered after execution |

### Execution Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| `parallelization.enabled` | `true` | Run independent plans simultaneously |
| `planning.commit_docs` | `true` | Track `.planning/` in git |

### Git Branching

| Setting | Options | Default |
|---------|---------|---------|
| `git.branching_strategy` | `none`, `phase`, `milestone` | `none` |
| `git.phase_branch_template` | string | `gsd/phase-{phase}-{slug}` |
| `git.milestone_branch_template` | string | `gsd/{milestone}-{slug}` |

---

## Atomic Git Commits

Each task gets its own commit immediately after completion:

```bash
abc123f docs(08-02): complete user registration plan
def456g feat(08-02): add email confirmation flow
hij789k feat(08-02): implement password hashing
lmn012o feat(08-02): create registration endpoint
```

**Benefits:**
- Git bisect finds exact failing task
- Each task independently revertable
- Clear history for Claude in future sessions
- Better observability in AI-automated workflow

---

## Integration Points for iDumb Wrapper

### What iDumb Should Hook Into

| GSD Concept | iDumb Enhancement |
|-------------|-------------------|
| `STATE.md` | Add hierarchical governance state, validation history |
| Research phase | Inject iDumb expert-skeptic framework |
| Plan verification | Add multi-level validation gates |
| Execution | Wrap with pre/post hooks for state sync |
| Compaction | Use experimental.session.compacting hook |

### Directory Structure to Create

```
.idumb/
├── brain/           # Advanced context (classification, hierarchy, metadata)
├── governance/      # Validation artifacts, health scores
├── prompts/         # Enforced thinking frameworks per agent type
└── config.json      # iDumb-specific settings

.planning/           # GSD standard (preserved)
├── research/
├── quick/
├── todos/
└── config.json      # GSD config (augmented)
```

### Command Wrapping Strategy

| GSD Command | iDumb Wrapper |
|-------------|---------------|
| `/gsd:new-project` | Pre-hook: Init .idumb, inject context |
| `/gsd:plan-phase` | Inject expert-skeptic prompts |
| `/gsd:execute-phase` | Pre: validate state, Post: update governance |
| `/gsd:verify-work` | Add multi-level validation hierarchy |

---

## Why GSD Works for iDumb

### Alignment with User's "Absolute Resolutions"

| User Requirement | GSD Feature | iDumb Enhancement |
|------------------|-------------|-------------------|
| Priority and Orders | Phase → Plan → Task hierarchy | Add governance levels |
| Hierarchical governance | Orchestrator → Agent pattern | Multi-tier validators |
| Incremental approach | Atomic commits per task | Validation gates between |
| Context-first | STATE.md, research phase | Advanced .idumb-brain |
| Expert-skeptic mode | Plan checker, verifier | Enforce throughout |
| Prevention of drift | Fresh context per plan | Stale context purging |

### What GSD Does NOT Have (iDumb adds)

1. **Hierarchical agent governance** - GSD has flat orchestrator → agent
2. **Cross-phase validation** - GSD validates within phase only
3. **Context classification** - GSD treats all context equally
4. **Stale context detection** - GSD relies on compaction only
5. **Expert-skeptic enforcement** - GSD is neutral/helpful mode
6. **Multi-level approval gates** - GSD has user checkpoints only

---

## Key Insights

### GSD Strengths to Leverage
1. **Proven workflow** - Battle-tested by thousands of users
2. **Context engineering** - Size limits, file organization
3. **Parallel execution** - Wave-based plan execution
4. **Atomic commits** - Clean git history
5. **Session management** - Pause/resume with handoff

### GSD Limitations to Enhance
1. **No governance hierarchy** - All agents at same level
2. **No validation enforcement** - User decides to skip
3. **No context classification** - All context treated equally
4. **No drift detection** - Relies on human validation
5. **Happy path bias** - Assumes success, not skeptical

---

## Sources

- https://github.com/glittercowboy/get-shit-done/blob/main/README.md (2026-02-02)
- https://www.npmjs.com/package/get-shit-done-cc
