---
description: "Show all iDumb commands and usage information"
id: cmd-help
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:help

<objective>
Display comprehensive help information for the iDumb governance system. Show all available commands organized by category, explain the agent hierarchy, list governance files and tools, and provide quick-start guidance. This is a reference command for users to understand the iDumb system capabilities.
</objective>

<context>

## Usage

```bash
/idumb:help                     # Show full help
/idumb:help commands            # List all commands
/idumb:help agents              # Explain agent hierarchy
/idumb:help <command-name>      # Help for specific command
/idumb:help quick-start         # Getting started guide
```

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `commands` | List all available commands | `/idumb:help commands` |
| `agents` | Explain agent hierarchy | `/idumb:help agents` |
| `<command>` | Specific command help | `/idumb:help validate` |
| `quick-start` | Getting started guide | `/idumb:help quick-start` |

</context>

<process>

## Step 1: Parse Help Request

Determine what help content to display.

```yaml
help_routing:
  /idumb:help → full_help
  /idumb:help commands → commands_list
  /idumb:help agents → agents_hierarchy
  /idumb:help quick-start → quick_start_guide
  /idumb:help <name> → specific_command_help
```

## Step 2: Display Requested Content

Based on routing, display appropriate help section.

### Full Help (default)

Display overview with links to detailed sections.

### Commands List

Display all commands organized by category.

### Agents Hierarchy

Display agent structure with permissions.

### Specific Command

Display detailed help for the requested command.

### Quick Start

Display getting started guide.

</process>

<completion_format>

## Full Help Output

```
┌─────────────────────────────────────────────────────────────────┐
│                         iDumb Help                              │
│         Intelligent Delegation Using Managed Boundaries         │
└─────────────────────────────────────────────────────────────────┘

OVERVIEW
────────
iDumb is a hierarchical AI governance framework that ensures safe,
controlled code development through agent delegation and permission
management.

QUICK START
───────────
  1. /idumb:init            Initialize governance for this project
  2. /idumb:status          Check current governance state
  3. /idumb:validate        Verify governance integrity
  4. /idumb:help commands   See all available commands

COMMAND CATEGORIES
──────────────────

  Lifecycle:
    /idumb:init             Initialize governance
    /idumb:new-project      Create new governed project
    /idumb:resume           Resume idle session

  Status & Validation:
    /idumb:status           Show governance state
    /idumb:validate         Run validation checks
    /idumb:config           View/edit configuration

  Planning:
    /idumb:roadmap          Create project roadmap
    /idumb:plan-phase       Plan a specific phase
    /idumb:discuss-phase    Discuss phase approach

  Research:
    /idumb:research         Research requirements
    /idumb:map-codebase     Analyze existing code

  Information:
    /idumb:help             Show this help

MORE HELP
─────────
  /idumb:help commands      List all commands with descriptions
  /idumb:help agents        Explain agent hierarchy
  /idumb:help <command>     Help for specific command
  /idumb:help quick-start   Getting started guide
```

## Commands List Output

```
┌─────────────────────────────────────────────────────────────────┐
│                       iDumb Commands                            │
└─────────────────────────────────────────────────────────────────┘

LIFECYCLE COMMANDS
──────────────────
  /idumb:init               Initialize governance for existing project
  /idumb:new-project        Create new governed project with structure
  /idumb:resume             Resume session with context recovery

STATUS & VALIDATION
───────────────────
  /idumb:status             Show governance state, health, anchors
  /idumb:validate           Run full validation hierarchy
  /idumb:config             View and edit configuration settings

PLANNING COMMANDS
─────────────────
  /idumb:roadmap            Create or view project roadmap
  /idumb:plan-phase         Create detailed phase plan
  /idumb:discuss-phase      Interactive phase discussion

RESEARCH COMMANDS
─────────────────
  /idumb:research           Research project requirements
  /idumb:map-codebase       Map existing codebase structure

USAGE EXAMPLES
──────────────
  # Start a new project
  /idumb:new-project my-app --framework=planning

  # Check health
  /idumb:status

  # Run validation
  /idumb:validate --fix

  # Change settings
  /idumb:config experience pro
```

## Agents Hierarchy Output

```
┌─────────────────────────────────────────────────────────────────┐
│                      iDumb Agent Hierarchy                      │
└─────────────────────────────────────────────────────────────────┘

The iDumb framework uses a strict delegation hierarchy where:
- Coordinators DELEGATE work to lower agents
- Validators READ and verify
- Only Builders WRITE files

HIERARCHY
─────────

  @idumb-supreme-coordinator (primary)
  │ ├── Role: Top-level orchestration
  │ ├── Permissions: delegate only, no file ops
  │ └── Tab to: switch to this agent
  │
  ├─► @idumb-high-governance (all)
  │   │ ├── Role: Mid-level coordination
  │   │ └── Delegates to validators/builders
  │   │
  │   ├─► @idumb-low-validator (hidden)
  │   │   ├── Role: Validation work
  │   │   ├── Permissions: read-only
  │   │   └── Uses: grep, glob, file reads
  │   │
  │   └─► @idumb-builder (hidden)
  │       ├── Role: File operations
  │       ├── Permissions: write, edit
  │       └── Only agent that modifies files

PERMISSION MATRIX
─────────────────

  Agent                  │ task │ write │ edit │ bash
  ───────────────────────┼──────┼───────┼──────┼──────
  supreme-coordinator    │  ✓   │   ✗   │  ✗   │  ✗
  high-governance        │  ✓   │   ✗   │  ✗   │  ✗
  low-validator          │  ✗   │   ✗   │  ✗   │  📖
  builder                │  ✗   │   ✓   │  ✓   │  ✓

  Legend: ✓ = allowed, ✗ = denied, 📖 = read-only

THE CHAIN CANNOT BREAK
──────────────────────
  Milestone → Phase → Plan → Task
       ↓
  coordinator → governance → validator → builder

Every action is traceable through .idumb/idumb-brain/state.json
```

## Quick Start Output

```
┌─────────────────────────────────────────────────────────────────┐
│                    iDumb Quick Start Guide                      │
└─────────────────────────────────────────────────────────────────┘

STEP 1: INITIALIZE
──────────────────
For an existing project:
  $ /idumb:init

For a new project:
  $ /idumb:new-project my-app --framework=planning

STEP 2: CHECK STATUS
────────────────────
  $ /idumb:status

This shows:
  - Initialization state
  - Current phase
  - Governance health
  - Active anchors

STEP 3: MAP YOUR CODEBASE (if existing project)
───────────────────────────────────────────────
  $ /idumb:map-codebase

This analyzes:
  - Technology stack
  - Architecture patterns
  - Code quality
  - Areas of concern

STEP 4: CREATE ROADMAP
──────────────────────
  $ /idumb:roadmap

This creates a phased plan for your project.

STEP 5: PLAN FIRST PHASE
────────────────────────
  $ /idumb:discuss-phase 1
  $ /idumb:plan-phase 1

STEP 6: EXECUTE
───────────────
Follow the plan. The governance system will:
  - Track your progress
  - Validate your work
  - Maintain context
  - Prevent governance violations

TIPS
────
  • Use /idumb:validate regularly to check governance health
  • Use /idumb:config experience pro for less guidance
  • Use /idumb:resume when returning after idle time
  • Check .idumb/idumb-brain/state.json for current state

FILES TO KNOW
─────────────
  .idumb/idumb-brain/state.json    Current governance state
  .idumb/idumb-brain/config.json   Your preferences
  .idumb/idumb-project-output/     Generated artifacts
```

## Specific Command Help Output

```
┌─────────────────────────────────────────────────────────────────┐
│                    /idumb:validate                              │
└─────────────────────────────────────────────────────────────────┘

DESCRIPTION
───────────
Run the full validation hierarchy to verify governance integrity.

USAGE
─────
  /idumb:validate [scope] [--fix] [--report-only]

ARGUMENTS
─────────
  scope         Which validations to run (default: all)
                Options: all, structure, schema, freshness, alignment

  --fix         Attempt auto-fix for issues
  --report-only Report without updating state

EXAMPLES
────────
  /idumb:validate                    # Full validation
  /idumb:validate structure          # Structure only
  /idumb:validate --fix              # Validate and fix issues
  /idumb:validate freshness          # Check for stale context

SEE ALSO
────────
  /idumb:status     Quick health check
  /idumb:config     View configuration
```

</completion_format>

<success_criteria>

## Help Display Checklist

- [ ] Requested help type determined
- [ ] Appropriate content displayed
- [ ] Content is formatted clearly
- [ ] Examples are provided
- [ ] Related commands/topics linked
- [ ] No errors in display

## Content Requirements

- [ ] All commands listed
- [ ] All commands have descriptions
- [ ] Agent hierarchy explained
- [ ] Permission matrix shown
- [ ] Quick start guide is actionable
- [ ] Specific command help is detailed

</success_criteria>

## Tools Reference

| Tool | Purpose |
|------|---------|
| `idumb-state` | Read/write governance state |
| `idumb-validate` | Run validation checks |
| `idumb-config` | Read/update configuration |
| `idumb-context` | Classify context types |
| `idumb-chunker` | Read large documents |
| `idumb-manifest` | Track codebase changes |
| `idumb-todo` | Manage hierarchical TODOs |

## Skills Reference

Load skills with the `skill` tool:

| Skill | Purpose |
|-------|---------|
| `idumb-governance` | Full governance protocols |
| `idumb-validation` | Comprehensive validation workflows |
| `idumb-meta-builder` | Framework transformation |
| `hierarchical-mindfulness` | Delegation patterns |

## Files Reference

| Path | Purpose |
|------|---------|
| `.idumb/idumb-brain/state.json` | Current governance state |
| `.idumb/idumb-brain/config.json` | User configuration |
| `.idumb/idumb-brain/governance/` | Validation history |
| `.idumb/idumb-brain/anchors/` | Context anchors |
| `.idumb/idumb-brain/sessions/` | Session tracking |
| `.idumb/idumb-project-output/` | Generated artifacts |

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:init` | Initialize governance |
| `/idumb:status` | Check current state |
| `/idumb:validate` | Run validations |

## Metadata

```yaml
category: information
priority: P1
complexity: low
read_only: true
version: 0.2.0
```
