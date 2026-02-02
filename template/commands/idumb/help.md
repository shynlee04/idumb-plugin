---
description: "Show all iDumb commands and usage information"
agent: idumb-supreme-coordinator
---

# iDumb Help

Display help information for the iDumb governance system.

## COMMANDS

### Core Commands

| Command | Description |
|---------|-------------|
| `/idumb:init` | Initialize governance for this project. **Start here.** |
| `/idumb:status` | Show current governance state and health |
| `/idumb:validate` | Run full validation hierarchy |
| `/idumb:help` | Show this help message |

### Usage

```bash
# Initialize (first time)
/idumb:init

# Check current state
/idumb:status

# Run validation
/idumb:validate
/idumb:validate scope:structure    # Validate only structure
/idumb:validate scope:alignment    # Validate planning alignment only
```

## AGENT HIERARCHY

```
@idumb-supreme-coordinator (primary)
  - Top of hierarchy, NEVER executes directly
  - Delegates all work to sub-agents
  - Tab to switch to this agent

@idumb-high-governance (all)
  - Mid-level coordination
  - Receives delegation from coordinator
  - Further delegates to validators/builders

@idumb-low-validator (hidden subagent)
  - Does actual validation work
  - grep, glob, file reads
  - Returns evidence-based results

@idumb-builder (hidden subagent)
  - Does actual file operations
  - Creates, edits, deletes files
  - Reports changes made
```

## FILES

| Path | Purpose |
|------|---------|
| `.idumb/brain/state.json` | Current governance state |
| `.idumb/governance/` | Validation history |
| `.idumb/anchors/` | Context anchors |

## TOOLS

| Tool | Purpose |
|------|---------|
| `idumb-state` | Read/write governance state |
| `idumb-validate` | Run validation checks |
| `idumb-context` | Classify context types |

## SKILLS

Load with the `skill` tool:
- `idumb-governance` - Full governance protocols

$ARGUMENTS
