# iDumb - Meta-Framework for OpenCode + GSD

> Hierarchical governance, context anchoring, and expert-skeptic validation for OpenCode

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode](https://img.shields.io/badge/OpenCode-Compatible-blue)](https://opencode.ai)

## What is iDumb?

iDumb wraps your existing AI development workflow (GSD, BMAD, or custom) with:

- **Hierarchical Agent Governance** - Coordinator → Governors → Validators
- **Context Anchoring** - Critical decisions survive context compaction
- **Expert-Skeptic Mode** - Never trust, always verify with evidence
- **Invisible GSD Integration** - `/gsd:*` commands work normally, iDumb intercepts via hooks

## Quick Install

### From GitHub (Recommended)

```bash
# Non-interactive installation (recommended for CI/scripts)
npx github:shynlee04/idumb-plugin --local   # Current project only
npx github:shynlee04/idumb-plugin --global  # All projects (~/.config/opencode/)

# Interactive installation (when running in terminal)
npx github:shynlee04/idumb-plugin
```

### From Source

```bash
git clone https://github.com/shynlee04/idumb-plugin.git
cd idumb-plugin
node bin/install.js --local
```

## After Installation

1. **Restart OpenCode** to load new agents/commands
2. Run `/idumb:init` to initialize governance
3. Run `/idumb:help` for all commands

## Commands

| Command | Description |
|---------|-------------|
| `/idumb:init` | Initialize governance for this project |
| `/idumb:status` | Show current governance state |
| `/idumb:validate` | Run full validation hierarchy |
| `/idumb:help` | Show all commands |

## Agent Hierarchy

```
@idumb-supreme-coordinator (primary)
  └─→ @idumb-high-governance (all)
        ├─→ @idumb-low-validator (hidden subagent)
        └─→ @idumb-builder (hidden subagent)
```

**How it works:**
- **Supreme Coordinator** - NEVER executes directly, ONLY delegates
- **High Governance** - Mid-level coordination, further delegates
- **Low Validator** - Does actual validation (grep, glob, tests)
- **Builder** - Does actual file operations

## GSD Integration

iDumb wraps GSD transparently:

- `/gsd:*` commands work normally
- iDumb intercepts via plugin hooks
- Validation runs automatically after GSD operations
- State tracked separately in `.idumb/` (not `.planning/`)

## Files Created

```
.opencode/
├── agents/
│   ├── idumb-supreme-coordinator.md
│   ├── idumb-high-governance.md
│   ├── idumb-low-validator.md
│   └── idumb-builder.md
├── commands/idumb/
│   ├── init.md
│   ├── status.md
│   ├── validate.md
│   └── help.md
├── tools/
│   ├── idumb-state.ts
│   ├── idumb-validate.ts
│   └── idumb-context.ts
├── plugins/
│   └── idumb-core.ts
└── skills/idumb-governance/
    └── SKILL.md

.idumb/                    # Created in your project
├── brain/
│   └── state.json         # Governance state
└── governance/
    └── plugin.log         # Plugin activity log
```

## Core Concepts

### Context Anchoring

Critical decisions are anchored to survive context compaction:

```yaml
anchor:
  type: decision
  content: "Using PostgreSQL because of JSONB requirements"
  priority: critical
```

### Expert-Skeptic Mode

**NEVER assume. ALWAYS verify.**

- Don't trust files are current - check timestamps
- Don't trust state is consistent - validate structure
- Don't trust context survives compaction - anchor critical decisions

### Hierarchical Delegation

Coordinators delegate to governors, governors delegate to validators/builders.
Each layer adds context and validates results.

## Uninstall

```bash
npx github:shynlee04/idumb --uninstall
# Or manually remove files from .opencode/
```

Note: `.idumb/` directory is preserved (contains state).

## Development

```bash
git clone https://github.com/shynlee04/idumb.git
cd idumb

# Test local installation
node bin/install.js --local

# Make changes to template/
# Re-run install to apply
```

## Project Structure

```
idumb/
├── bin/
│   └── install.js         # npx installer
├── template/              # Files copied during install
│   ├── agents/            # Agent definitions
│   ├── commands/idumb/    # Slash commands
│   ├── tools/             # Custom tools
│   ├── plugins/           # Plugin files
│   └── skills/            # Skill definitions
├── .planning/research/    # Research documentation
├── package.json           # npm package config
└── README.md              # This file
```

## Research

Based on official OpenCode documentation:
- [OpenCode Internals](.planning/research/OPENCODE-INTERNALS-2026-02-02.md)
- [GSD Framework](.planning/research/GSD-FRAMEWORK-2026-02-02.md)
- [Plugin Distribution](.planning/research/PLUGIN-DISTRIBUTION-2026-02-02.md)

## Requirements

- Node.js >= 18.0.0
- OpenCode installed and configured
- (Optional) GSD framework for full integration

## License

MIT

---

**Built for the [OpenCode](https://opencode.ai) ecosystem**
