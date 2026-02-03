# GSD (Get Shit Done) Framework Deep Dive

**Research Date:** 2026-02-02  
**Sources:**
- https://github.com/glittercowboy/get-shit-done (Official Repository)
- GSD-STYLE.md (Official Style Guide)
- CROSS-CONCEPT-MATRIX-2026-02-02.md (iDumb cross-concept validation)
- INTERCEPTION-ARCHITECTURE-ANALYSIS.md (iDumb architecture analysis)
- CHANGELOG.md (Official changelog v1.0.0 - v1.11.1)

**Confidence Level:** HIGH - All findings verified against official GSD repository

---

## Executive Summary

GSD (Get Shit Done) is a **meta-prompting, context engineering, and spec-driven development system** designed for Claude Code, OpenCode, and Gemini CLI. It solves "context rot" — the quality degradation that happens as Claude fills its context window — through a structured phase-based workflow, XML-formatted plans, and multi-agent orchestration.

**Key Insight:** GSD is a **thin orchestrator pattern** where the main context window stays at 30-40% while subagents handle heavy lifting in fresh contexts.

---

## 1. GSD Core Concepts

### 1.1 Directory Structure (.planning/)

```
.planning/
├── PROJECT.md                    # Project vision, always loaded
├── REQUIREMENTS.md               # Scoped v1/v2 requirements with phase traceability
├── ROADMAP.md                    # Phases mapped to requirements
├── STATE.md                      # Decisions, blockers, position — memory across sessions
├── DISCOVERY.md                  # Codebase analysis (brownfield only)
├── research/
│   ├── SUMMARY.md               # Synthesized findings
│   ├── STACK.md                 # Technology recommendations
│   ├── FEATURES.md              # Feature landscape
│   ├── ARCHITECTURE.md          # System patterns
│   └── PITFALLS.md              # Domain warnings
├── phases/
│   ├── 01-authentication/       # Phase directory (zero-padded)
│   │   ├── CONTEXT.md          # Phase-specific decisions
│   │   ├── RESEARCH.md         # Phase research
│   │   ├── 01-1-PLAN.md        # Individual plan
│   │   ├── 01-1-SUMMARY.md     # Execution summary
│   │   ├── 01-2-PLAN.md        # Another plan
│   │   ├── 01-VERIFICATION.md  # Phase verification
│   │   └── 01-UAT.md           # User acceptance testing
│   ├── 02-api-development/
│   └── ...
└── quick/                        # Ad-hoc tasks
    ├── 001-add-dark-mode/
    │   ├── PLAN.md
    │   └── SUMMARY.md
    └── ...
```

**Key Files and Their Purpose:**

| File | Size Limit | Purpose |
|------|------------|---------|
| PROJECT.md | Always loaded | Project vision, never compress |
| REQUIREMENTS.md | Reference as needed | REQ-001 → REQ-NNN mapping |
| ROADMAP.md | Reference as needed | Phase structure with requirement traceability |
| STATE.md | Always loaded | Current position, decisions, blockers |
| CONTEXT.md | Per-phase | Decisions captured during discuss-phase |
| PLAN.md | 2-3 tasks max | Executable XML-structured plan |
| SUMMARY.md | Reference | What happened, what changed |

### 1.2 Phase-Based Workflow

GSD follows a strict 6-step workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GSD WORKFLOW PIPELINE                         │
├─────────────────┬───────────────────────────────────────────────┤
│ 1. QUESTIONING  │ Understand the idea completely                │
│    (new-project │ Goals, constraints, tech preferences, edges   │
│    new-milestone│ Creates: PROJECT.md                           │
├─────────────────┼───────────────────────────────────────────────┤
│ 2. RESEARCH     │ (Optional but recommended)                    │
│    (research-*) │ Spawn parallel agents to investigate domain   │
│                 │ Creates: STACK.md, FEATURES.md, etc.          │
├─────────────────┼───────────────────────────────────────────────┤
│ 3. REQUIREMENTS │ Extract v1/v2/out-of-scope                    │
│    (define-*)   │ Creates: REQUIREMENTS.md with REQ-IDs         │
├─────────────────┼───────────────────────────────────────────────┤
│ 4. ROADMAP      │ Create phases mapped to requirements          │
│    (create-*)   │ Creates: ROADMAP.md with phase-requirement    │
│                 │ traceability (validated for 100% coverage)    │
├─────────────────┼───────────────────────────────────────────────┤
│ 5. DISCUSS      │ (Optional but critical)                       │
│    (discuss-*)  │ Capture implementation decisions              │
│                 │ Creates: {phase}-CONTEXT.md                   │
├─────────────────┼───────────────────────────────────────────────┤
│ 6. PLAN →       │ Research + plan + verify → execute in waves   │
│    EXECUTE →    │ Creates: {phase}-{N}-PLAN.md, SUMMARY.md      │
│    VERIFY       │ Verifies: VERIFICATION.md, UAT.md             │
└─────────────────┴───────────────────────────────────────────────┘
```

**Loop Pattern:**
```
discuss-phase N → plan-phase N → execute-phase N → verify-work N
       ↑                                              │
       └──────────────────────────────────────────────┘ (if gaps found)
```

### 1.3 Command Structure (/gsd:* commands)

**Command Format:**
```yaml
---
name: gsd:command-name
description: One-line description
argument-hint: "<required>" or "[optional]"
allowed-tools: [Read, Write, Bash, Glob, Grep, AskUserQuestion]
---
```

**Core Commands by Category:**

| Category | Command | Purpose |
|----------|---------|---------|
| **Setup** | `/gsd:new-project` | Full init: questions → research → requirements → roadmap |
| | `/gsd:map-codebase` | Brownfield analysis before new-project |
| | `/gsd:new-milestone [name]` | Start next version (brownfield new-project) |
| **Execution** | `/gsd:discuss-phase [N]` | Capture implementation decisions |
| | `/gsd:plan-phase [N]` | Research + plan + verify |
| | `/gsd:execute-phase <N>` | Execute all plans in waves |
| | `/gsd:quick` | Ad-hoc task with GSD guarantees |
| **Verification** | `/gsd:verify-work [N]` | Manual UAT with debug agents |
| | `/gsd:audit-milestone` | Verify milestone definition of done |
| **Milestones** | `/gsd:complete-milestone` | Archive, tag, delete ROADMAP/REQUIREMENTS |
| **Phase Mgmt** | `/gsd:add-phase` | Append phase |
| | `/gsd:insert-phase [N]` | Insert urgent work |
| | `/gsd:remove-phase [N]` | Remove phase |
| **Session** | `/gsd:pause-work` | Handoff when stopping mid-phase |
| | `/gsd:resume-work` | Restore from last session |
| **Utilities** | `/gsd:progress` | Where am I? What's next? |
| | `/gsd:help` | Show commands |
| | `/gsd:settings` | Configure workflow |
| | `/gsd:set-profile <profile>` | quality/balanced/budget |

### 1.4 Agent Orchestration Patterns

**Multi-Agent Orchestration Pattern:**

```
Orchestrator (thin, main context)
    ↓
    ├── Spawns Researcher agents (parallel)
    │       ├── Stack Researcher → STACK.md
    │       ├── Features Researcher → FEATURES.md
    │       ├── Architecture Researcher → ARCHITECTURE.md
    │       └── Pitfalls Researcher → PITFALLS.md
    │
    ├── Spawns Planner agent
    │       └── Creates 2-3 PLAN.md files
    │
    ├── Spawns Plan Checker agent
    │       └── Verifies plans achieve phase goals
    │           └── Revision loop (max 3)
    │
    ├── Spawns Executor agents (parallel waves)
    │       └── Each gets fresh 200k context
    │
    └── Spawns Verifier agent
            └── Checks goals achieved, creates fix plans
```

**Key Principle:** The orchestrator never does heavy lifting. It:
1. Spawns specialized agents
2. Waits for completion
3. Integrates results
4. Routes to next step

**Context Efficiency:**
- Main context stays at 30-40%
- Subagents work in fresh 200k contexts
- No accumulated garbage
- Session stays fast and responsive

---

## 2. GSD Entry Points

### 2.1 Project Initialization

**Greenfield (new project):**
```bash
npx get-shit-done-cc
# Choose runtime: Claude Code, OpenCode, Gemini, or all
# Choose location: Global (all projects) or local (current project only)
```

Then inside runtime:
```
/gsd:new-project
```

**Flow:**
1. **Questions** — Until understanding is complete
2. **Research** — Parallel agents investigate domain
3. **Requirements** — Extract v1/v2/out-of-scope
4. **Roadmap** — Create phases with requirement traceability

**Creates:**
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/*.md`

### 2.2 Brownfield (existing code)

**First:**
```
/gsd:map-codebase
```

This analyzes stack, architecture, conventions, and concerns. Creates:
- `DISCOVERY.md` — Codebase intelligence
- Stack analysis
- Architecture patterns
- Conventions detected
- Testing approach
- Integration points
- Risk areas

**Then:**
```
/gsd:new-project
```

Questions now focus on what you're adding (not the existing codebase). Planning automatically loads your patterns from DISCOVERY.md.

### 2.3 State Management (STATE.md)

**STATE.md Structure:**
```markdown
# Project State

**Last Updated:** 2026-02-02T10:30:00Z
**Current Phase:** 02-user-authentication
**Current Plan:** 02-2

## Milestone
**Version:** v1.0.0
**Name:** Core Platform
**Status:** In Progress

## Decisions
| Date | Decision | Context |
|------|----------|---------|
| 2026-02-01 | Use PostgreSQL | JSONB for flexible schemas |

## Blockers
| Issue | Since | Impact |
|-------|-------|--------|
| None | - | - |

## Quick Tasks Completed
| # | Description | Date | Commit |
|---|-------------|------|--------|
| 001 | Add dark mode | 2026-02-01 | abc123f |
```

**STATE.md is:**
- Living memory across sessions
- Always loaded in context
- Updated by orchestrator (not subagents)
- Source of truth for "where am I?"

### 2.4 Roadmap Structure (ROADMAP.md)

**ROADMAP.md Structure:**
```markdown
# Roadmap: Core Platform (v1.0.0)

**Created:** 2026-02-02
**Milestone:** v1.0.0
**Estimated Phases:** 8

## Phase Summary
| # | Phase | Requirements | Status |
|---|-------|--------------|--------|
| 01 | Project Setup | REQ-001, REQ-002 | ✅ Complete |
| 02 | User Authentication | REQ-003, REQ-004 | 🔄 In Progress |
| 03 | API Development | REQ-005, REQ-006 | ⏳ Planned |

## Phase Details

### Phase 01: Project Setup
**Requirements:** REQ-001, REQ-002
**Goal:** Initialize repository, configure CI/CD, set up development environment
**Must-Haves:**
- [x] Git repository initialized
- [x] CI/CD pipeline configured
**Status:** Complete
**Completed:** 2026-02-01

### Phase 02: User Authentication
**Requirements:** REQ-003, REQ-004
**Goal:** Users can register, log in, and manage sessions
**Must-Haves:**
- [ ] Email/password registration
- [ ] JWT authentication
- [ ] Password reset flow
**Status:** In Progress
**Started:** 2026-02-02
```

**Requirement Traceability:**
Every phase lists `Requirements:` field mapping to REQ-IDs. Plan checker validates:
- 100% coverage (all v1 requirements mapped to phases)
- No orphaned requirements
- No requirements mapped to multiple phases inappropriately

---

## 3. GSD Integration Points

### 3.1 Where GSD Can Be Extended

**1. Custom Agents**
Location: `.claude/agents/` or `.opencode/agents/`

Agents can be:
- Spawned by orchestrators via `task` tool
- Loaded with specific expertise via `@-references`
- Given restricted tool permissions

**2. Custom Workflows**
Location: `get-shit-done/workflows/*.md`

Workflows define multi-step processes:
- No YAML frontmatter
- Use semantic XML containers
- Can `@-reference` other workflows, templates, references

**3. Custom Templates**
Location: `get-shit-done/templates/*.md`

Templates provide:
- File structures
- Output formats
- Placeholder conventions (`[Project Name]`, `{phase}-{plan}-PLAN.md`)

**4. Custom References**
Location: `get-shit-done/references/*.md`

References provide:
- Deep dives on specific concepts
- Best practices
- Pitfall documentation

**5. Configuration Extensions**
Location: `.planning/config.json`

```json
{
  "mode": "interactive",
  "depth": "standard",
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  },
  "parallelization": {
    "enabled": true
  },
  "git": {
    "branching_strategy": "none",
    "phase_branch_template": "gsd/phase-{phase}-{slug}",
    "milestone_branch_template": "gsd/{milestone}-{slug}"
  }
}
```

### 3.2 Hook Points in the Workflow

**Lifecycle Hooks (Node.js scripts):**

| Hook | When | Use Case |
|------|------|----------|
| `gsd-statusline.js` | Every prompt | Show context usage, current task |
| `gsd-update-check.js` | Session start | Check for GSD updates |
| `gsd-stop-notification.js` | Session end | Show pending todos |

**Plugin Hooks (OpenCode):**

| Hook | When | Extension Point |
|------|------|-----------------|
| `session.created` | New session | Initialize custom tracking |
| `session.compacted` | Context compacted | Persist critical state |
| `tool.execute.before` | Before any tool | Add logging, validation |
| `tool.execute.after` | After any tool | Sync with external systems |
| `command.executed` | Command ran | Track usage, analytics |

### 3.3 Requirements Traceability

**GSD's Traceability System:**

```
REQUIREMENTS.md
    ├── REQ-001 (v1 - must have)
    ├── REQ-002 (v1 - must have)
    ├── REQ-003 (v1 - must have)
    ├── REQ-004 (v2 - nice to have)
    └── ...
         ↓
ROADMAP.md
    ├── Phase 01: Requirements REQ-001, REQ-002
    ├── Phase 02: Requirements REQ-003
    └── ...
         ↓
{phase}-PLAN.md
    ├── Task 1: Implements REQ-001
    ├── Task 2: Implements REQ-003
    └── ...
         ↓
VERIFICATION.md
    ├── REQ-001: Verified ✓
    ├── REQ-003: Verified ✓
    └── ...
```

**Validation Points:**
1. **Roadmap creation** — Ensures 100% v1 requirement coverage
2. **Plan verification** — Checks plans implement phase requirements
3. **Phase verification** — Verifies phase achieved its requirements
4. **Milestone audit** — Aggregates all phase verifications

---

## 4. GSD Limitations

### 4.1 Precision/Control Issues

**1. Context Rot in Long Conversations**
- Problem: Even with subagents, main context eventually fills
- Symptom: Quality degrades after 50+ turns
- Current mitigation: Compaction, but loses nuanced context
- Gap: No technical enforcement of hierarchy after compaction

**2. No Runtime Role Enforcement**
- Problem: Agents receive governance as "suggestions" in system prompts
- Symptom: Coordinator may try to edit files directly
- Current mitigation: Agents are told "NEVER execute directly"
- Gap: No technical block — just polite instructions

**3. Hallucination in Plan Creation**
- Problem: Planner may create plans for files that don't exist
- Symptom: Executors fail when files aren't found
- Current mitigation: Plan checker validates, but may not catch all
- Gap: No pre-plan file existence verification

**4. Lossy Delegation Handoffs**
- Problem: Subagent doesn't know it's in a delegation chain
- Symptom: Subagent acts independently, loses parent context
- Current mitigation: Orchestrator passes context via prompt
- Gap: No structured delegation metadata

**5. Checkpoint Fatigue**
- Problem: Too many human checkpoints slow workflow
- Symptom: Users skip verification, miss bugs
- Current mitigation: YOLO mode available
- Gap: No smart checkpoint reduction based on confidence

### 4.2 Where Hallucination Can Occur

**High-Risk Areas:**

| Area | Risk | Why |
|------|------|-----|
| **File paths** | HIGH | Planner guesses paths without glob verification |
| **Dependencies** | HIGH | Plans assume packages are installed |
| **API signatures** | MEDIUM | Planner uses outdated API patterns |
| **Configuration** | MEDIUM | Assumes default configs match needs |
| **Test commands** | MEDIUM | Verification steps may not match actual test setup |
| **Research findings** | MEDIUM | Web search results may be outdated |

**Current Mitigations:**
- Plan checker validates against requirements
- Verifier checks goals achieved
- User must verify via `/gsd:verify-work`
- Debug agents diagnose failures

**Gaps:**
- No automated verification of file existence before planning
- No automated verification of command existence
- No automated verification of API currentness

### 4.3 What Gaps iDumb Can Fill

**Gap Analysis from CROSS-CONCEPT-MATRIX:**

| Gap | GSD Limitation | iDumb Solution |
|-----|----------------|----------------|
| **P3-5** | No TODO manipulation with hierarchy | Create `idumb-todo.ts` tool with hierarchy |
| **P3-1** | No session creation/modification/export | Create session CRUD tools |
| **CL-1, CL-4** | No DOS/DONTS matrix enforcement | Embed DOS/DONTS in agents with technical enforcement |
| **CL-3** | Config overlap not prevented | Add overlap guard logic |
| **Context anchoring** | Compaction loses critical decisions | Anchors survive compaction |
| **Role enforcement** | "Should" not "must" delegate | Technical tool-level enforcement |
| **Freshness validation** | May use stale files | 48h freshness checks |
| **Expert-skeptic mode** | Trusts too much | Never trust, always verify |

**iDumb's Technical Enforcement (from INTERCEPTION-ARCHITECTURE):**

**1. Message Control (`experimental.chat.messages.transform`)**
- Prepends governance to first user message
- Injects hierarchy reminder after compaction
- Modifies task prompts with delegation context

**2. First Tool Enforcement (`tool.execute.before`)**
- Tracks if first tool was used
- Enforces role-based tool whitelist
- Blocks coordinator from using edit/write
- Logs violations for analysis

**3. Error Transformation (`permission.ask`, `tool.execute.after`)**
- Transforms denials into educational guidance
- Explains hierarchy on violation
- Suggests correct delegation path

**Agent Permissions Matrix (iDumb):**

| Agent | Can Read | Can Write | Can Delegate | Must Start With |
|-------|----------|-----------|--------------|-----------------|
| Supreme Coordinator | ✅ | ❌ | ✅ | idumb-todo |
| High Governance | ✅ | ❌ | ✅ | idumb-todo |
| Low Validator | ✅ | ❌ | ❌ | idumb-todo |
| Builder | ✅ | ✅ | ❌ | read |

---

## 5. GSD Architecture Patterns

### 5.1 XML Prompt Formatting

**Task Structure:**
```xml
<task type="auto">
  <name>Task N: Action-oriented name</name>
  <files>src/path/file.ts, src/other/file.ts</files>
  <action>What to do, what to avoid and WHY</action>
  <verify>Command or check to prove completion</verify>
  <done>Measurable acceptance criteria</done>
</task>
```

**Task Types:**
- `type="auto"` — Claude executes autonomously
- `type="checkpoint:human-verify"` — User must verify
- `type="checkpoint:decision"` — User must choose

**Checkpoint Structure:**
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Description of what was built</what-built>
  <how-to-verify>Numbered steps for user</how-to-verify>
  <resume-signal>Text telling user how to continue</resume-signal>
</task>
```

### 5.2 Plan Frontmatter Schema

```yaml
---
type: standard  # or "tdd"
phase: "08"
plan: "2"
name: "Add email verification"
depth: standard
wave: 2
depends_on: ["08-1"]
files_modified: ["src/auth/verify.ts"]
autonomous: true
---
```

**Wave-Based Execution:**
- Wave 1: Independent tasks (parallel)
- Wave 2: Tasks depending on Wave 1
- Wave 3: Tasks depending on Wave 2
- etc.

### 5.3 Atomic Git Commits

**Commit Format:**
```
{type}({phase}-{plan}): {description}
```

**Types:**
| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Tests only (TDD RED) |
| `refactor` | Code cleanup (TDD REFACTOR) |
| `docs` | Documentation/metadata |
| `chore` | Config/dependencies |

**Example:**
```
feat(08-02): implement email confirmation flow

docs(08-02): complete user registration plan
test(08-03): add failing test for password reset
```

**Benefits:**
- Git bisect finds exact failing task
- Each task independently revertable
- Clear history for Claude in future sessions
- Better observability in AI-automated workflow

---

## 6. GSD Configuration System

### 6.1 Model Profiles

Control which Claude model each agent uses:

| Profile | Planning | Execution | Verification |
|---------|----------|-----------|--------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced` (default) | Opus | Sonnet | Sonnet |
| `budget` | Sonnet | Sonnet | Haiku |

### 6.2 Workflow Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `mode` | `interactive` | `yolo` (auto-approve) vs `interactive` (confirm) |
| `depth` | `standard` | Planning thoroughness (quick/standard/comprehensive) |
| `workflow.research` | `true` | Research domain before planning |
| `workflow.plan_check` | `true` | Verify plans before execution |
| `workflow.verifier` | `true` | Confirm must-haves delivered after execution |
| `parallelization.enabled` | `true` | Run independent plans simultaneously |

### 6.3 Git Branching Strategies

| Strategy | Behavior |
|----------|----------|
| `none` (default) | Commits to current branch |
| `phase` | Creates branch per phase (`gsd/phase-{N}-{slug}`) |
| `milestone` | Creates one branch for entire milestone |

---

## 7. Research Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core Concepts | HIGH | Verified against official README, GSD-STYLE.md |
| Entry Points | HIGH | Verified against command workflows |
| State Management | HIGH | STATE.md structure from official docs |
| Integration Points | MEDIUM | Some extension points inferred from code structure |
| Limitations | HIGH | Derived from CHANGELOG, GitHub issues, and iDumb analysis |
| Architecture Patterns | HIGH | GSD-STYLE.md is authoritative |
| Configuration | HIGH | Official config documentation |

---

## 8. Key Findings Summary

### 8.1 GSD Strengths

1. **Thin Orchestrator Pattern** — Main context stays at 30-40%, subagents do heavy lifting
2. **XML-Structured Plans** — Precise, executable, verifiable
3. **Requirement Traceability** — 100% coverage validation
4. **Atomic Commits** — Each task = one commit, git history as context source
5. **Context Engineering** — File size limits, progressive disclosure
6. **Multi-Runtime Support** — Claude Code, OpenCode, Gemini CLI

### 8.2 GSD Weaknesses (iDumb Opportunities)

1. **No Technical Enforcement** — Agents "should" follow roles, but no runtime block
2. **Context Loss on Compaction** — Critical decisions may be lost
3. **No TODO Manipulation** — No structured TODO hierarchy tools
4. **No Session Management** — No session CRUD tools
5. **Trust-Based Validation** — Assumes files are current, no freshness enforcement

### 8.3 iDumb v2 Opportunity

**iDumb can TAKE OVER GSD functions by:**

1. **Intercepting at 4 entry points** using OpenCode plugin hooks
2. **Enforcing hierarchy** via tool-level permissions
3. **Anchoring critical decisions** to survive compaction
4. **Adding missing tools** (TODO, session, validation)
5. **Wrapping GSD transparently** — `/gsd:*` still work, iDumb intercepts via hooks

**Migration Path:**
- GSD remains for project structure (`.planning/`)
- iDumb provides governance layer (`.idumb/`)
- Together: GSD structure + iDumb enforcement = reliable AI development

---

## 9. Sources

1. **Official GSD Repository:** https://github.com/glittercowboy/get-shit-done
2. **GSD Style Guide:** https://raw.githubusercontent.com/glittercowboy/get-shit-done/main/GSD-STYLE.md
3. **GSD Changelog:** https://raw.githubusercontent.com/glittercowboy/get-shit-done/main/CHANGELOG.md
4. **iDumb Cross-Concept Matrix:** `/Users/apple/Documents/coding-projects/idumb/CROSS-CONCEPT-MATRIX-2026-02-02.md`
5. **iDumb Interception Analysis:** `/Users/apple/Documents/coding-projects/idumb/INTERCEPTION-ARCHITECTURE-ANALYSIS.md`
6. **iDumb Implementation Guide:** `/Users/apple/Documents/coding-projects/idumb/IMPLEMENTATION-GUIDE.md`

---

**END OF RESEARCH**

*This document feeds into iDumb v2 which will TAKE OVER GSD functions through technical enforcement at message, tool, and error interception points.*
