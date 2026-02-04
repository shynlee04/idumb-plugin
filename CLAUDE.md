# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NON-NEGOTIABLE RULES
- All agents must work by gathering context first, knowing which workflow **MUST FIND SKILL** to adapt the best selection for Complex, multi-step, recurring, or, domain-specific tasks. There is **NO TOLERANCE** for agents that start execute tasks without proper context gathering, and planning.
- Update this CLAUDE.md iteratively, and be the single-source-of-truth, at all time for all agents.

## Project Overview

iDumb (Intelligent Delegation Using Managed Boundaries) is a hierarchical AI governance framework for OpenCode that ensures safe, controlled code development through agent delegation and permission management. It is distributed as an installable plugin that creates a local "brain" under `.idumb/` for durable governance state.

**Version:** 0.2.0 | **Last Updated:** 2026-02-04

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

### Testing
This is a meta-framework (markdown profiles + TypeScript tools). Testing is manual:
1. Install the plugin
2. Verify files are copied to correct locations
3. Test command execution in OpenCode CLI
4. Verify agent profiles load correctly

## Slash Commands

All commands are under `.opencode/commands/idumb/*.md`:

| Command | Purpose |
|---------|---------|
| `/idumb:init` | Initialize governance state |
| `/idumb:status` | Show governance status |
| `/idumb:certify` | Certify phase completion |
| `/idumb:validate` | Run validation checks |
| `/idumb:health-check` | Check system health |
| `/idumb:stress-test` | Run stress tests |
| `/idumb:pre-flight` | Pre-flight checks before operations |
| `/idumb:research` | Research phase |
| `/id:plan-phase` | Planning phase |
| `/idumb:execute-phase` | Execution phase |
| `/idumb:verify-phase` | Verification phase |
| `/idumb:discuss-phase` | Discussion phase |
| `/idumb:map-codebase` | Map codebase structure |
| `/idumb:roadmap` | Generate roadmap |
| `/idumb:config` | Configure governance |
| `/idumb:debug` | Debug governance state |
| `/idumb:help` | Show help |
| `/idumb:resume` | Resume from checkpoint |
| `/idumb:new-project` | Create new project |
| `/idumb:verify-work` | Verify work artifacts |

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
├── agents/*.md           # Agent profiles (23 agents)
├── commands/idumb/*.md   # Slash commands (19 commands)
├── tools/*.ts            # TypeScript tools (11 tools)
├── plugins/*.ts          # Event hooks (idumb-core.ts)
├── lib/                  # Shared libraries
│   ├── logging.ts
│   ├── state.ts
│   ├── checkpoint.ts
│   ├── chain-rules.ts
│   └── ...
└── types/                # TypeScript definitions
```

### Agent Categories

**Meta-Governance** (framework self-management):
- `idumb-meta-builder` - Builds iDumb framework components
- `idumb-meta-validator` - Validates iDumb framework integrity

**Coordinators** (delegation only, no file ops):
- `idumb-supreme-coordinator` - Top-level orchestration
- `idumb-high-governance` - Mid-level coordination
- `idumb-project-executor` - Phase execution management
- `idumb-verifier` - Verification coordination
- `idumb-debugger` - Debug coordination
- `idumb-mid-coordinator` - Mid-level delegation

**Planners/Researchers** (read-only analysis):
- `idumb-planner`, `idumb-plan-checker`, `idumb-roadmapper`
- `idumb-project-researcher`, `idumb-phase-researcher`, `idumb-codebase-mapper`
- `idumb-research-synthesizer`, `idumb-project-explorer`
- `idumb-integration-checker`

**Workers** (leaf nodes):
- `idumb-low-validator` - Read-only validation (grep, glob, tests)
- `idumb-skeptic-validator` - Deep validation skepticism
- `idumb-builder` - **ONLY** agent that can write/edit files

### Permission Matrix

| Agent Category | edit | write | bash | task | delegate |
|----------------|------|-------|------|------|----------|
| Meta-Governance | ✅   | ✅    | ✅   | ✅   | ✅       |
| Coordinators   | ❌   | ❌    | ❌   | ✅   | ✅       |
| Researchers    | ❌   | ❌    | ❌   | ❌   | ❌       |
| Validators     | ❌   | ❌    | read | ❌   | ❌       |
| Builder        | ✅   | ✅    | ✅   | ❌   | ❌       |

### OpenCode Integration Skills

iDumb includes OpenCode-specific skills for plugin development:

| Skill | Purpose |
|-------|---------|
| `opencode-conflict-prevention` | Plugin loading order, deduplication rules, naming conventions |
| `opencode-plugin-compliance` | Plugin development compliance - hooks, events, validation |
| `opencode-tool-compliance` | Custom tool development compliance |
| `opencode-tui-safety` | TUI safety guidelines - avoid console pollution |

See `.plugin-dev/` for comprehensive integration documentation.

## Key Files

### `bin/install.js`
Installer script that:
1. Detects project type (greenfield/brownfield/existing planning)
2. Archives legacy GSD files if present
3. Copies agents, commands, tools, plugins to `.opencode/`
4. Creates `.idumb/` directory structure with initial state.json and config.json
5. Supports both local and global installation modes

### `src/plugins/idumb-core.ts`
Main event hook system. Key responsibilities:
- **Session tracking**: Tracks agent role, delegation depth, first tool used
- **Checkpoint management**: Create/load/list/delete checkpoints for rollback
- **State persistence**: Manages `.idumb/idumb-brain/state.json` with anchors and history
- **Governance enforcement**: Intercepts tools to enforce permissions
- **Security**: Input validation, sanitization, and pre-write gates

**Important**: The plugin includes security hardening as of 2026-02-04:
- File path sanitization to prevent directory traversal
- Input validation on all user-provided paths
- Pre-write gates to validate operations before execution
- See `SECURITY_FIXES_SUMMARY.md` for details

### `src/tools/idumb-state.ts`
State management tool with exports:
- `read` - Read current governance state
- `write` - Update state (phase, framework, validation count)
- `anchor` - Add context anchor (survives compaction)
- `history` - Record action in governance history
- `getAnchors` - Get anchors for context injection
- `createSession`, `modifySession`, `exportSession`, `listSessions` - Session management
- `purgeOldSessions` - Garbage collection for old sessions and checkpoints

### `src/tools/` Directory
All iDumb tools:
- `idumb-state.ts` - State management
- `idumb-config.ts` - Configuration management
- `idumb-validate.ts` - Validation operations
- `idumb-context.ts` - Context management
- `idumb-manifest.ts` - Project manifest
- `idumb-todo.ts` - Todo list management
- `idumb-chunker.ts` - Code chunking
- `idumb-orchestrator.ts` - Orchestration
- `idumb-performance.ts` - Performance monitoring
- `idumb-quality.ts` - Quality metrics
- `idumb-security.ts` - Security checks

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

.opencode/                   # Installed by iDumb from src/
├── agents/idumb-*.md        # 23 agent profiles
├── commands/idumb/*.md      # 19 slash commands
├── tools/idumb-*.ts         # 11 TypeScript tools
├── plugins/idumb-core.ts    # Main event hook
├── skills/                  # OpenCode integration skills
│   ├── opencode-conflict-prevention/
│   ├── opencode-plugin-compliance/
│   ├── opencode-tool-compliance/
│   └── opencode-tui-safety/
└── workflows/               # GSD-quality workflows

.plugin-dev/                 # Development artifacts
├── ROADMAP.md               # Project roadmap
├── PROJECT.md               # Project documentation
├── OPENCODE-INTEGRATION-PLAN.md
├── SKILL-INTEGRATION-GUIDE.md
├── SKILL-INVOCATION-PATTERNS.md
├── opencode-plugins-and-tools-dev-best-practices.md
└── plugins-and-tools-for-opencode-guidelines.md
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

### GSD Pattern Standards
As of 2026-02-04, all agents, commands, and workflows follow GSD-quality executable program patterns:
- **Agents**: role, philosophy, execution_flow, structured_returns, success_criteria
- **Commands**: objective, execution_context, context, process, completion_format
- **Workflows**: purpose, philosophy, entry_check, execution_flow, chain_rules

### JavaScript (install.js)
- ESM imports only (package.json: `"type": "module"`)
- Step-based functions (`step1_*`, `step2_*`) for clarity
- Always use fallback patterns: `const result = operation() || fallback`
- Use `existsSync()` before operations, create directories with `mkdirSync(path, { recursive: true })`

## Security

As of 2026-02-04, iDumb includes comprehensive security hardening:

1. **Input Validation**: All user-provided paths are validated and sanitized
2. **Pre-write Gates**: Operations are validated before file writes
3. **Path Traversal Prevention**: `sanitize_path()` prevents directory traversal attacks
4. **Session Boundaries**: Clear session isolation prevents cross-contamination
5. **Skill Validation**: Pre-write gates validate skill integrity before execution

See `SECURITY_FIXES_SUMMARY.md` for complete security documentation.

## Session Handoff

When resuming work on iDumb itself, check `.idumb/idumb-brain/SESSION-HANDOFF-*.md` files for:
- What was completed in previous sessions
- Current known issues and their fixes
- Remaining work by priority phase
- Context anchors that survived compaction

## Current Status (as of 2026-02-04)

### GSD Transformation Complete
- **46 files transformed** (~28,000 lines total)
  - 23 agents transformed (~15,500 lines)
  - 19 commands transformed (~5,900 lines)
  - 9 workflows transformed (~7,000 lines)
- **Validation**: 14/14 checks passed, 0 warnings

### Phase 1: Contracts-First Governance Core (In Progress)
- Session State System (stop hook, depth-aware injection)
- Brain State System (session status hierarchy)
- Agent Concept Fix (meta vs project agents naming)
- Permission Refinement (selective blocking)

### Recent Additions
- OpenCode integration skills (conflict prevention, compliance)
- Security hardening and input validation
- Skill validation tools and pre-write gates
- Comprehensive plugin development documentation

See `.plugin-dev/ROADMAP.md` for full roadmap and phase definitions.
