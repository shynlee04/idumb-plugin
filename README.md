# iDumb

> **Hierarchical Governance Plugin for OpenCode + GSD Framework**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode](https://img.shields.io/badge/OpenCode-Compatible-blue)](https://opencode.ai)
[![GSD](https://img.shields.io/badge/GSD-Wrapper-green)](https://github.com/glittercowboy/get-shit-done)

---

## What is iDumb?

**iDumb** is an OpenCode plugin that **wraps** the [Get Shit Done (GSD)](https://github.com/glittercowboy/get-shit-done) framework with:

- **Hierarchical Agent Governance** — Coordinator → Governor → Validator → Builder
- **Context Anchoring** — Critical decisions survive context compaction
- **Expert-Skeptic Validation** — Never trust, always verify with evidence
- **Automatic Timestamp Injection** — Metadata control for staleness detection
- **GSD Integration** — `/gsd:*` commands work normally, iDumb wraps via hooks

### The Wrapper Relationship

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         THE WRAPPER PRINCIPLE                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   GSD OWNS (read-only to iDumb):        iDumb OWNS (write):              │
│   .planning/                            .idumb/                          │
│     ├── PROJECT.md                        ├── config.json                │
│     ├── ROADMAP.md                        ├── brain/                     │
│     ├── STATE.md                          │   └── state.json             │
│     ├── config.json                       ├── governance/                │
│     └── phases/                           │   └── validations/           │
│         └── {phase-slug}/                 └── anchors/                   │
│             └── PLAN.md                                                  │
│                                                                          │
│   iDumb READS from .planning/ (NEVER writes)                             │
│   iDumb WRITES to .idumb/ (syncs state FROM GSD)                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Install

### From GitHub

```bash
# Clone and install locally
git clone https://github.com/shynlee04/idumb.git
cd idumb
node bin/install.js --local

# Or install globally (all projects)
node bin/install.js --global
```

### With NPX (coming soon)

```bash
npx idumb --local     # Current project only
npx idumb --global    # All projects (~/.config/opencode/)
```

### Flags

| Flag | Description |
|------|-------------|
| `--local` / `-l` | Install to `./.opencode/` (current project) |
| `--global` / `-g` | Install to `~/.config/opencode/` (all projects) |
| `--uninstall` | Remove iDumb from target location |

---

## After Installation

```bash
1. Restart OpenCode to load new agents/commands
2. Run /idumb:init to initialize governance for your project
3. Run /idumb:help for all commands
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/idumb:init` | Initialize governance (creates `.idumb/`, syncs with GSD) |
| `/idumb:status` | Show current governance state and GSD phase |
| `/idumb:validate` | Run full hierarchical validation |
| `/idumb:help` | Show all available commands |

---

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HIERARCHICAL DELEGATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  @idumb-supreme-coordinator (mode: primary)                         │
│  │  • NEVER executes directly — ONLY delegates                      │
│  │  • Context-first: reads state, frames work, assigns tasks        │
│  │  • Maintains TODO hierarchy (20+ items with metadata)            │
│  │                                                                  │
│  └─→ @idumb-high-governance (mode: all)                             │
│      │  • Mid-level coordination and validation                     │
│      │  • Enforces GSD phase alignment                              │
│      │  • Further delegates to specialists                          │
│      │                                                              │
│      ├─→ @idumb-low-validator (mode: subagent, hidden)              │
│      │     • Does actual validation work                            │
│      │     • Uses grep, glob, tests, schema checks                  │
│      │     • Reports results UP the hierarchy                       │
│      │                                                              │
│      └─→ @idumb-builder (mode: subagent, hidden)                    │
│            • META modifier ONLY                                     │
│            • Edits: .idumb/*, .opencode/*, template/*               │
│            • NEVER touches: .planning/*, src/*, app/*               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Rules:**
- **Supreme Coordinator** — Delegates only, never executes
- **High Governance** — Enforces GSD alignment, delegates specialists  
- **Low Validator** — Reads and validates, never modifies code
- **Builder** — Modifies META only (frontmatter, config, iDumb files)

---

## GSD Integration

iDumb wraps GSD transparently:

| What | How |
|------|-----|
| `/gsd:*` commands | Work normally — iDumb hooks into execution |
| GSD state sync | iDumb reads `.planning/STATE.md` → syncs to `.idumb/brain/state.json` |
| Phase tracking | Automatically detects `Phase: [X] of [Y] (name)` format |
| Validation | Runs after GSD operations via plugin hooks |
| Config tracing | Reads `.planning/config.json` — never writes to it |

### GSD Commands (via GSD plugin)

```bash
/gsd:new-project      # Initialize GSD for your project
/gsd:plan-phase       # Plan current phase
/gsd:execute-phase    # Execute planned work
/gsd:status           # Check GSD state
```

---

## Files Created

### OpenCode Directory (`.opencode/`)

```
.opencode/
├── agents/
│   ├── idumb-supreme-coordinator.md   # Primary agent
│   ├── idumb-high-governance.md       # Mid-level coordinator
│   ├── idumb-low-validator.md         # Validation specialist
│   └── idumb-builder.md               # META modifier
├── commands/idumb/
│   ├── init.md                        # /idumb:init
│   ├── status.md                      # /idumb:status
│   ├── validate.md                    # /idumb:validate
│   └── help.md                        # /idumb:help
├── tools/
│   ├── idumb-state.ts                 # State management
│   ├── idumb-validate.ts              # Validation runner
│   ├── idumb-context.ts               # Context classification
│   ├── idumb-config.ts                # Configuration management
│   ├── idumb-manifest.ts              # Drift/conflict detection
│   └── idumb-chunker.ts               # Chunk reading for long docs
├── plugins/
│   └── idumb-core.ts                  # Event hooks & orchestration
└── skills/idumb-governance/
    └── SKILL.md                       # Governance protocols
```

### Project Directory (`.idumb/`)

```
.idumb/                                # Created by /idumb:init
├── config.json                        # User preferences, paths, governance level
├── brain/
│   ├── state.json                     # Governance state (synced from GSD)
│   ├── history/                       # Action history
│   └── context/                       # Context classification
├── governance/
│   ├── validations/                   # Validation artifacts
│   └── plugin.log                     # Plugin activity log
├── anchors/                           # Context anchoring for compaction survival
└── sessions/                          # Session metadata (Phase 3)
```

---

## Core Concepts

### 1. Context Anchoring

Critical decisions are anchored to survive context compaction:

```yaml
anchor:
  type: decision
  content: "Using PostgreSQL because of JSONB requirements"
  priority: critical
  created: 2026-02-02T10:30:00Z
```

When OpenCode compacts context, anchors are re-injected automatically.

### 2. Expert-Skeptic Mode

**NEVER assume. ALWAYS verify.**

- Don't trust files are current — check timestamps
- Don't trust state is consistent — validate structure
- Don't trust context survives compaction — anchor critical decisions
- Don't trust GSD files are valid — validate before reading

### 3. Hierarchical Delegation

Coordinators delegate to governors, governors delegate to validators/builders.
Each layer adds context and validates results. **No level can skip the hierarchy.**

### 4. Timestamp Frontmatter Injection

GSD short-lived artifacts automatically receive metadata:

```yaml
---
idumb_created: 2026-02-02T10:30:00Z
idumb_modified: 2026-02-02T14:45:00Z  
idumb_stale_after_hours: 48
---
```

Enables staleness detection and conflict resolution.

---

## Configuration

### `.idumb/config.json`

```json
{
  "version": "0.1.0",
  "user": {
    "name": "Developer",
    "language": {
      "communication": "english",
      "documents": "english"
    }
  },
  "governance": {
    "level": "moderate",
    "expertSkeptic": true,
    "autoValidation": true
  },
  "paths": {
    "state": {
      "brain": ".idumb/brain/state.json",
      "history": ".idumb/brain/history/",
      "anchors": ".idumb/anchors/"
    },
    "artifacts": {
      "governance": ".idumb/governance/",
      "validations": ".idumb/governance/validations/"
    }
  },
  "frameworks": {
    "gsd": {
      "detected": true,
      "configPath": ".planning/config.json",
      "syncEnabled": true
    }
  },
  "staleness": {
    "warningThresholdHours": 48,
    "purgeThresholdHours": 168
  },
  "timestamps": {
    "enabled": true,
    "format": "ISO8601",
    "frontmatterInjection": true
  }
}
```

### Governance Levels

| Level | Description |
|-------|-------------|
| `light` | Minimal validation, faster execution |
| `moderate` | Balanced validation, GSD alignment (default) |
| `strict` | Full validation, all checks required |

---

## Plugin Hooks

iDumb uses OpenCode's plugin system for:

| Hook | Purpose |
|------|---------|
| `event: session.created` | Initialize/load state, sync with GSD |
| `event: session.compacted` | Re-inject anchors and critical context |
| `tool.execute.before` | Inject governance context into delegations |
| `tool.execute.after` | Sync state after GSD file modifications |
| `stop` | TODO enforcement (don't stop with incomplete tasks) |

---

## Roadmap

### Phase 1+2 (Current) ✅

- [x] Cross-OS installation (macOS, Linux, Windows)
- [x] Non-interactive and interactive installation modes
- [x] Hierarchical agent definitions with proper modes
- [x] GSD state sync (reads `.planning/STATE.md`)
- [x] Context anchoring for compaction survival
- [x] Timestamp frontmatter injection
- [x] Plugin hooks for session lifecycle
- [x] Staleness detection configuration

### Phase 3 (Next)

- [ ] Session manipulation (auto-create, export with metadata)
- [ ] TODO task list hierarchy (20+ items with context)
- [ ] Stop hook enforcement (no stop with incomplete tasks)
- [ ] Chunk reading tool for long documents
- [ ] Manifest watch for drift/conflict detection
- [ ] Integration with GSD atomic git hash control

---

## Checklist Matrix (For Contributors)

Before any feature is considered "working", it must pass ALL applicable checks:

### Non-Negotiable

- [ ] NOT modifying OpenCode source code (plugin only)
- [ ] Obeys Dos/Don'ts from core concepts
- [ ] Features resonate with Core Concepts (hierarchy, context, governance)
- [ ] No user-controlled LLM model configs
- [ ] Runtime starting → hierarchy + bounce-back enforcement
- [ ] Mid-session → automation OR prompts consumed by LLMs
- [ ] Wrappers → unbreak, accurate, complete, consistent, meta-controlled
- [ ] YAML/JSON/API schema → accurate to OpenCode API

### Delegation Rules

- [ ] Highest level (coordinator) → context-first, TODO, delegate only
- [ ] Mid-level → depends on phase, no code modification permission
- [ ] idumb-builder = META modifier only (frontmatter, config)

### Core Concepts

- [ ] Multi-level integration (OpenCode ↔ GSD) without conflicts
- [ ] Edge cases addressed for user's GSD journey
- [ ] Issues assessed both strategically (high-level) and tactically (implementation)

---

## Development

```bash
# Clone the repository
git clone https://github.com/shynlee04/idumb.git
cd idumb

# Test local installation
node bin/install.js --local

# Make changes to template/
# Re-run install to apply changes

# Uninstall
node bin/install.js --uninstall --local
```

### Project Structure

```
idumb/
├── bin/
│   └── install.js          # NPX installer (cross-OS)
├── template/               # FILES COPIED DURING INSTALL
│   ├── agents/             # Agent definitions
│   ├── commands/idumb/     # Slash commands
│   ├── tools/              # Custom tools
│   ├── plugins/            # Plugin files
│   └── skills/             # Skill definitions
├── package.json            # NPM package config
└── README.md               # This file
```

**Important:** Always modify `template/` — never edit `.opencode/` directly.

---

## Requirements

- **Node.js** >= 18.0.0
- **OpenCode** installed and configured
- **(Optional)** GSD framework for full integration

---

## Troubleshooting

### Installation fails

```bash
# Ensure you're in a project directory
pwd

# Try with explicit flags
node bin/install.js --local

# Check if .opencode already exists
ls -la .opencode/
```

### GSD not detected

```bash
# Install GSD first
npx get-shit-done-cc --opencode --local

# Then run iDumb init
/idumb:init
```

### Commands not showing

```bash
# Restart OpenCode to reload plugins
# Then check commands
/idumb:help
```

---

## License

MIT

---

## Credits

- [OpenCode](https://opencode.ai) — The agentic coding platform
- [Get Shit Done (GSD)](https://github.com/glittercowboy/get-shit-done) — The wrapped framework
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) — Inspiration for plugin patterns

---

**Built for the [OpenCode](https://opencode.ai) ecosystem**
