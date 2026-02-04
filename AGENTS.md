# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iDumb (Intelligent Delegation Using Managed Boundaries) is a hierarchical AI governance framework for OpenCode that ensures safe, controlled code development through agent delegation and permission management. It is distributed as an installable plugin that creates a local "brain" under `.idumb/` for durable governance state.

## Agents profiles MUST ALWAYS BE LOADED AND CHECK HERE
/Users/apple/Documents/coding-projects/idumb/.opencode/agents
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-builder.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-codebase-mapper.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-debugger.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-executor.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-high-governance.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-integration-checker.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-low-validator.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-mid-coordinator.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-phase-researcher.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-plan-checker.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-planner.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-project-explorer.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-project-researcher.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-research-synthesizer.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-roadmapper.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-skeptic-validator.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-supreme-coordinator.md
/Users/apple/Documents/coding-projects/idumb/.opencode/agents/idumb-verifier.md
## Commands

### Installation
```bash
# Local install (current project only)
npm run install:local
# or
node bin/install.js --local

# Global install (all projects)
npm run install:global
# or
node bin/install.js --global

# Uninstall
npm run uninstall
```

### Development Workflow
```bash
# After modifying source files, reinstall locally
npm run install:local

# Verify installation
ls -la .opencode/agents/idumb-*.md
ls -la .opencode/tools/idumb-*.ts
ls -la .opencode/plugins/idumb-core.ts
```

### No Automated Tests
This is a meta-framework (markdown profiles + TypeScript tools). Testing is manual:
1. Install the plugin
2. Verify files are copied to correct locations
3. Test command execution in OpenCode CLI
4. Verify agent profiles load correctly

## Architecture

### Hierarchy: The Core Concept

iDumb enforces a strict delegation hierarchy. The "Chain Cannot Break":

```
Milestone → Phase → Plan → Task
     ↓
coordinator → governance → validator → builder
```

**Critical Rule**: Coordinators delegate, validators validate, only builders write files. Every action is traceable through `.idumb/idumb-brain/state.json` history.

### Plugin Structure

The installer copies files from `src/` to `.opencode/`:

```
src/
├── agents/*.md           # Agent profiles (19 agents)
├── commands/idumb/*.md   # Slash commands (14 commands)
├── tools/*.ts            # TypeScript tools (8 tools)
├── plugins/*.ts          # Event hooks (idumb-core.ts)
└── skills/**/*.md        # Reusable skill workflows
```

### Agent Categories

**Coordinators** (delegation only, no file ops):
- `idumb-supreme-coordinator` - Top-level orchestration
- `idumb-high-governance` - Mid-level coordination
- `idumb-executor` - Phase execution management
- `idumb-verifier` - Verification coordination
- `idumb-debugger` - Debug coordination

**Planners/Researchers** (read-only analysis):
- `idumb-planner`, `idumb-plan-checker`, `idumb-roadmapper`
- `idumb-project-researcher`, `idumb-phase-researcher`, `idumb-codebase-mapper`

**Workers** (leaf nodes):
- `idumb-low-validator` - Read-only validation (grep, glob, tests)
- `idumb-builder` - **ONLY** agent that can write/edit files

### Permission Matrix

| Agent Category | edit | write | bash | task | delegate |
|----------------|------|-------|------|------|----------|
| Coordinators   | ❌   | ❌    | ❌   | ✅   | ✅       |
| Researchers    | ❌   | ❌    | ❌   | ❌   | ❌       |
| Validator      | ❌   | ❌    | read | ❌   | ❌       |
| Builder        | ✅   | ✅    | ✅   | ❌   | ❌       |

## Key Files

### `bin/install.js`
Installer script that:
1. Detects project type (greenfield/brownfield/existing planning)
2. Archives legacy GSD files if present
3. Copies agents, commands, tools, plugins to `.opencode/`
4. Creates `.idumb/` directory structure with initial state.json and config.json
5. Supports both local and global installation modes

### `src/plugins/idumb-core.ts`
Main event hook system (~3000 lines). Key responsibilities:
- **Session tracking**: Tracks agent role, delegation depth, first tool used
- **Checkpoint management**: Create/load/list/delete checkpoints for rollback
- **State persistence**: Manages `.idumb/idumb-brain/state.json` with anchors and history
- **Governance enforcement**: Intercepts tools to enforce permissions (LOG-ONLY mode currently)

**Important**: The plugin is currently in "LOG-ONLY" mode after emergency fixes. It observes and logs violations but does NOT block tools. See `.idumb/idumb-brain/SESSION-HANDOFF-2026-02-03.md`.

### `src/tools/idumb-state.ts`
State management tool with exports:
- `read` - Read current governance state
- `write` - Update state (phase, framework, validation count)
- `anchor` - Add context anchor (survives compaction)
- `history` - Record action in governance history
- `getAnchors` - Get anchors for context injection
- `createSession`, `modifySession`, `exportSession`, `listSessions` - Session management
- `purgeOldSessions` - Garbage collection for old sessions and checkpoints

### `.idumb/idumb-brain/state.json`
Single source of truth for governance state:
```json
{
  "version": "0.2.0",
  "initialized": "ISO-8601 timestamp",
  "framework": "idumb | planning | bmad | custom | none",
  "phase": "current phase identifier",
  "lastValidation": "ISO timestamp or null",
  "validationCount": 0,
  "anchors": [{ "id": "...", "type": "decision|context|checkpoint", "content": "...", "priority": "critical|high|normal" }],
  "history": [{ "timestamp": "...", "action": "...", "agent": "...", "result": "pass|fail|partial" }]
}
```

### `.idumb/idumb-brain/config.json`
User settings and governance configuration. Contains:
- User profile (name, experience level, language preferences)
- Hierarchy settings (agent order, permissions, chain enforcement)
- Automation settings (mode, context-first enforcement, workflow flags)
- Path mappings to all governance artifacts

## Path Conventions

```
.idumb/                      # Root iDumb directory
├── idumb-brain/             # AI governance memory (runtime state)
│   ├── state.json           # Governance state (SINGLE SOURCE OF TRUTH)
│   ├── config.json          # User settings and governance config
│   ├── context/             # Preserved context artifacts
│   ├── history/             # Archived history entries
│   ├── governance/          # Governance rules and reports
│   │   └── validations/     # Validation reports (JSON)
│   ├── sessions/            # Session tracking
│   ├── drift/               # Drift detection artifacts
│   ├── metadata/            # Metadata storage
│   └── execution/           # Checkpoints per phase
│       └── {phase}/
│           └── checkpoint-{id}.json
├── idumb-project-output/    # Project artifacts (replaces .plan/)
│   ├── phases/              # Phase outputs
│   ├── roadmaps/            # Project roadmaps
│   ├── research/            # Research outputs
│   └── validations/         # Validation outputs
└── idumb-modules/           # Optional user-generated extensions

.planning/                # Planning artifacts (READ ONLY for iDumb)
├── PROJECT.md
├── STATE.md
├── ROADMAP.md
└── phases/{N}/

.opencode/                # Installed by iDumb from src/
├── agents/idumb-*.md
├── commands/idumb/*.md
├── tools/idumb-*.ts
└── plugins/idumb-core.ts
```

## Code Style

### TypeScript (tools, plugins)
- Use `@opencode-ai/plugin` `tool()` wrapper for exports
- **NO console.log** - causes TUI background text pollution. Use file logging via `log()` function
- Always handle errors with try-catch, return error objects (never throw unhandled)
- Use explicit TypeScript interfaces for all data structures
- Functions: camelCase, Interfaces: PascalCase, Constants: SCREAMING_SNAKE

### Agent/Command Markdown
- YAML frontmatter must be accurate (description, mode, permission, tools)
- Coordinators: `write: false, edit: false, task: true`
- Builder: `write: true, edit: true, task: false`
- Use `temperature: 0.1` for deterministic governance behavior

### JavaScript (install.js)
- ESM imports only (package.json: `"type": "module"`)
- Step-based functions (`step1_*`, `step2_*`) for clarity
- Always use fallback patterns: `const result = operation() || fallback`
- Use `existsSync()` before operations, create directories with `mkdirSync(path, { recursive: true })`

## Session Handoff

When resuming work on iDumb itself, check `.idumb/idumb-brain/SESSION-HANDOFF-*.md` files for:
- What was completed in previous sessions
- Current known issues and their fixes
- Remaining work by priority phase
- Context anchors that survived compaction

## Current Status (as of 2026-02-04)

- **Phase 1** (Contracts-First Governance Core) is in progress
- Plugin is in LOG-ONLY mode (no blocking) after emergency TUI fixes
- Session handoff documents indicate remaining work on:
  - Phase A: Session State System (stop hook, depth-aware injection)
  - Phase B: Brain State System (session status hierarchy)
  - Phase C: Agent Concept Fix (meta vs project agents naming)
  - Phase D: Permission Refinement (re-enable selective blocking)

See `.plugin-dev/ROADMAP.md` for full roadmap and phase definitions.

## Agent Transformation Summary (GSD-Quality)

All 18 core agents have been transformed from abstract YAML schemas to GSD-quality executable LLM programs.

### Transformation Metrics

| Category | Before | After |
|----------|--------|-------|
| Total agent files | 18 | 22 |
| Average lines per agent | ~300 | ~700 |
| Total lines | ~5,500 | ~15,310 |
| GSD patterns per agent | 0 | 5-11 |

### GSD Patterns Applied to All Agents

1. **`<role>`** - First-person voice establishing identity
2. **`<philosophy>`** - Core principles and mindset
3. **`<execution_flow>`** - Step-by-step workflow with bash commands
4. **`<structured_returns>`** - Consistent output formats
5. **`<success_criteria>`** - Measurable checkboxes

### Agent Categories and Key Patterns

#### Core Execution Agents
| Agent | Lines | Key Patterns |
|-------|-------|--------------|
| idumb-project-executor | 1063 | deviation_rules, checkpoint_protocol, tdd_execution, task_commit_protocol |
| idumb-verifier | 1070 | verification_levels (4), stub_detection, gap_diagnosis |
| idumb-debugger | 608 | debug_state_machine, hypothesis_management, isolation_techniques |

#### Planning Agents
| Agent | Lines | Key Patterns |
|-------|-------|--------------|
| idumb-planner | 677 | discovery_levels (0-3), task_breakdown, goal_backward, dependency_graph |
| idumb-plan-checker | 815 | must_haves_verification, context_budget_check, dependency_graph_check |
| idumb-roadmapper | 522 | goal_backward_phases, phase_sizing, dependency_analysis |

#### Research Agents
| Agent | Lines | Key Patterns |
|-------|-------|--------------|
| idumb-project-researcher | 784 | research_dimensions (4), source_hierarchy, mcp_integration |
| idumb-phase-researcher | 790 | discovery_levels, verification_protocol |
| idumb-research-synthesizer | 722 | synthesis_methodology, conflict_resolution |

#### Builder Agents
| Agent | Lines | Key Patterns |
|-------|-------|--------------|
| idumb-builder | 955 | permission_model, file_operations, git_protocol, quality_gates |
| idumb-meta-builder | 1378 | entity_patterns, BMAD protocols (52 patterns) |

#### Validation Agents
| Agent | Lines | Key Patterns |
|-------|-------|--------------|
| idumb-low-validator | 864 | validation_types (7), test_execution, strict read-only |
| idumb-skeptic-validator | 1077 | challenge_categories (5), questioning_techniques (5), bias_detection (6) |
| idumb-integration-checker | 896 | integration_points, e2e_flow_verification, contract_checking |

#### Coordinator Agents
| Agent | Lines | Key Patterns |
|-------|-------|--------------|
| idumb-supreme-coordinator | 667 | delegation_model, request_routing |
| idumb-high-governance | 708 | meta_governance_operations, state_management |
| idumb-mid-coordinator | 810 | project_coordination_patterns, task_delegation |

### Quality Degradation Curve

All planning/execution agents use this context budget awareness:

| Context Usage | Quality | Claude's State |
|---------------|---------|----------------|
| 0-30% | PEAK | Thorough, comprehensive |
| 30-50% | GOOD | Confident, solid work |
| 50-70% | DEGRADING | Efficiency mode begins |
| 70%+ | POOR | Rushed, minimal |

**Rule:** Plans should complete within ~50% context.

### Guardrails Model

| Agent Category | task | write | edit | bash |
|----------------|------|-------|------|------|
| Coordinators | ✅ | ❌ | ❌ | ❌ |
| Builders | ❌ | ✅ | ✅ | ✅ |
| Validators (leaf) | ❌ | ❌ | ❌ | 📖 |
| Researchers | ✅ | ❌ | ❌ | 📖 |
| Executors | ✅ | ❌ | ❌ | 📖 |

Legend: ✅ = allowed, ❌ = denied, 📖 = read-only
