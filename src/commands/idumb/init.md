---
description: "Initialize iDumb governance for this project with bounce-back validation loops."
id: cmd-init
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:init

Initialize iDumb governance for this project.

<objective>
Set up the iDumb governance framework by creating the `.idumb/` directory structure, initializing state and configuration, detecting project type (greenfield/brownfield), and integrating with existing planning frameworks if present. This command is the entry point for all iDumb-governed projects.
</objective>

<execution_context>

## Reference Files (Read Before Execution)
- `.idumb/brain/state.json` - Check if already initialized
- `.planning/` - Detect planning framework
- `.planning/PROJECT.md` - Project definition
- `.planning/STATE.md` - Current state
- `.planning/ROADMAP.md` - Existing roadmap
- `PROJECT.md` - BMAD indicator
- `_bmad-output/` - BMAD output

## Agents Involved
| Agent | Role | Mode |
|-------|------|------|
| @idumb-supreme-coordinator | Command entry, orchestration | primary |
| @idumb-low-validator | Structure validation | hidden |
| @idumb-builder | File/directory creation | hidden |

</execution_context>

<context>

## Usage

```bash
/idumb:init [flags]
```

## Flags

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--greenfield` | Force greenfield mode (new project) | Boolean | Auto-detect |
| `--brownfield` | Force brownfield mode (existing code) | Boolean | Auto-detect |
| `--no-planning` | Skip planning integration | Boolean | `false` |
| `--force` | Reinitialize even if exists | Boolean | `false` |
| `--user` | Set user name | String | "Developer" |
| `--language` | Set communication language | String | "english" |

## Examples

```bash
# Standard initialization (auto-detect)
/idumb:init

# Greenfield project (new, no existing code)
/idumb:init --greenfield

# Brownfield project (existing codebase)
/idumb:init --brownfield

# Without planning framework integration
/idumb:init --no-planning

# Reinitialize existing setup
/idumb:init --force

# With user preferences
/idumb:init --user="Alex" --language="english"
```

## Project Types

| Type | Detection | Next Steps |
|------|-----------|------------|
| **Greenfield** | <5 source files, no .planning | `/idumb:new-project` |
| **Brownfield** | >5 source files, no .planning | `/idumb:map-codebase`, then `/idumb:new-project` |
| **Existing Planning** | .planning/ exists | Sync with planning state |

</context>

<process>

## Step 1: Check for Existing Setup

```yaml
existing_check:
  read: ".idumb/brain/state.json"
  
  if_exists:
    check: Is already initialized?
    if_yes:
      report:
        status: Already initialized
        framework: {detected framework}
        phase: {current phase}
        prompt: "Would you like to reinitialize? Use --force flag."
      unless: "--force flag provided"
      
  if_force:
    action: Archive existing state
    backup: ".idumb/brain/state.json.bak-{timestamp}"
    continue: Fresh initialization
```

## Step 2: Detect Project Context

```yaml
context_detection:
  delegate_to: "@idumb-low-validator"
  prompt: |
    ## Gather Project Context
    
    **Checks:**
    - .planning/ directory exists
    - .planning/PROJECT.md exists
    - .planning/STATE.md exists
    - .planning/ROADMAP.md exists
    - .planning/config.json exists
    - PROJECT.md in root (BMAD)
    - _bmad-output/ exists (BMAD)
    
    **Return Format:**
    \`\`\`yaml
    status: complete | partial | missing
    planning:
      detected: true/false
      files_found: [list]
      files_missing: [list]
    bmad:
      detected: true/false
      files_found: [list]
    \`\`\`
```

## Step 3: Create iDumb Directory Structure

```yaml
structure_creation:
  delegate_to: "@idumb-builder"
  prompt: |
    ## Create iDumb Governance Structure
    
    **Directories to Create:**
    - .idumb/
    - .idumb/brain/
    - .idumb/brain/context/
    - .idumb/brain/history/
    - .idumb/brain/governance/
    - .idumb/brain/governance/validations/
    - .idumb/brain/sessions/
    - .idumb/brain/execution/
    - .idumb/project-output/
    - .idumb/project-output/phases/
    - .idumb/project-output/roadmaps/
    - .idumb/project-output/research/
    
    **Files to Create:**
    
    1. `.idumb/brain/state.json`:
    \`\`\`json
    {
      "version": "0.2.0",
      "initialized": "{ISO-8601 timestamp}",
      "framework": "{detected: planning | bmad | both | none}",
      "phase": "{from STATE.md or 'init'}",
      "lastValidation": null,
      "validationCount": 0,
      "anchors": [],
      "history": []
    }
    \`\`\`
    
    2. `.idumb/brain/config.json`:
    \`\`\`json
    {
      "version": "0.2.0",
      "user": {
        "name": "{from --user or 'Developer'}",
        "language": {
          "communication": "{from --language or 'english'}",
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
          "sessions": ".idumb/brain/sessions/"
        },
        "output": {
          "phases": ".idumb/project-output/phases/",
          "roadmaps": ".idumb/project-output/roadmaps/",
          "research": ".idumb/project-output/research/"
        }
      },
      "planning": {
        "detected": {true/false},
        "configPath": ".planning/config.json",
        "syncEnabled": true
      }
    }
    \`\`\`
    
    **Return:**
    \`\`\`yaml
    status: success | partial | failed
    created: [list]
    failed: [list with reasons]
    \`\`\`
```

## Step 4: Validate Structure AND Planning Completeness

```yaml
structure_validation:
  delegate_to: "@idumb-low-validator"
  prompt: |
    ## Verify Governance Structure
    
    **iDumb Structure Checks:**
    - .idumb/ directory exists
    - .idumb/brain/state.json exists and valid JSON
    - .idumb/brain/config.json exists and valid JSON
    - .idumb/brain/governance/ exists
    
    **Planning Integration Checks (if detected):**
    - .planning/PROJECT.md exists (REQUIRED)
    - .planning/STATE.md exists (REQUIRED)
    - .planning/ROADMAP.md exists (REQUIRED)
    - .planning/config.json exists (REQUIRED)
    
    **Return:**
    \`\`\`yaml
    status: pass | fail
    idumb_structure: pass | fail
    planning_completeness: pass | fail | not_applicable
    missing_planning_files: [list]
    evidence: [specific checks]
    \`\`\`
```

## Step 4b: Handle Incomplete Planning (if applicable)

```yaml
planning_gap:
  condition: "planning detected but planning_completeness == fail"
  
  DO_NOT: Create planning files
  DO: Guide user to complete planning
  
  report: |
    ## Planning Gap Detected
    
    iDumb detected `.planning/` directory but planning setup is incomplete.
    
    **Files Found:** {list}
    **Files Missing:** {list}
    
    **OPTIONS:**
    1. **Complete planning:** Run `/idumb:new-project`
    2. **Proceed without planning:** Use `--no-planning` flag
    3. **Map existing codebase:** Run `/idumb:map-codebase`
    
    **Recommended:** Run `/idumb:new-project` first, then `/idumb:init`
    
  prompt_user: "Would you like to proceed without planning integration?"
  
  if_proceed:
    update_state:
      framework: "idumb-only"
      planning_ready: false
    continue_to: Step 5
    
  if_wait:
    status: planning_incomplete
    halt: true
```

## Step 5: Set Up Initial Anchor

```yaml
anchor_creation:
  condition: Step 4 passed
  delegate_to: "@idumb-builder"
  
  use_tool: idumb-state_anchor
  params:
    type: checkpoint
    content: "iDumb initialized for {project name} - {framework} detected"
    priority: high
```

## Step 6: Record in History

```yaml
history_record:
  delegate_to: "@idumb-builder"
  
  use_tool: idumb-state_history
  params:
    action: governance_init
    result: "Initialized with {framework} framework, {x} directories, {y} files"
```

## Step 7: Final Integrity Check

```yaml
integrity_check:
  delegate_to: "@idumb-low-validator"
  prompt: |
    ## Final Initialization Integrity Check
    
    **Checks:**
    - state.json exists AND valid JSON AND has required fields
    - config.json exists AND valid JSON
    - At least 1 anchor exists
    - History has at least 1 entry
    - IF planning: All 4 required files exist
    
    **Return:**
    \`\`\`yaml
    status: pass | fail
    initialization_complete: true | false
    summary: "{brief status}"
    \`\`\`
  
  on_fail:
    max_retries: 3
    escalate_to_user: true
```

## Step 8: Project Type Detection

```yaml
project_type:
  method: Count source files
  command: |
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
      -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l
  
  classification:
    if: SRC_FILES > 5 AND !planning_exists
      type: brownfield
      message: "Existing codebase detected with {count} source files"
      next: "/idumb:map-codebase"
      
    elif: SRC_FILES <= 5 AND !planning_exists
      type: greenfield
      message: "New project detected"
      next: "/idumb:new-project"
      
    else:
      type: existing_planning
      message: "Planning framework detected"
      next: "Synced with existing planning state"
```

## Step 9: Project-Type-Specific Guidance

```yaml
guidance:
  brownfield:
    report: |
      **Brownfield Project Detected**
      
      Found {count} source files without planning setup.
      
      **Recommended Next Steps:**
      1. `/idumb:map-codebase` - Analyze existing code structure
      2. `/idumb:new-project` - Create project context and roadmap
      
  greenfield:
    report: |
      **Greenfield Project Detected**
      
      Fresh project with minimal code.
      
      **Recommended Next Step:**
      1. `/idumb:new-project` - Start project planning
      
  existing_planning:
    report: |
      **Planning Framework Detected**
      
      iDumb has synced with existing planning state.
      
      **Current Phase:** {phase from STATE.md}
      **Ready to:** Continue where you left off
```

## Step 10: Present Final Menu

```yaml
menu:
  status: complete | brownfield_pending | greenfield_pending
  
  display: |
    ## iDumb Governance Ready
    
    **Status:** {status}
    **Framework:** {framework}
    **Project Type:** {type}
    
    ### Available Commands
    
    | Command | Description |
    |---------|-------------|
    | `/idumb:status` | Check governance state |
    | `/idumb:validate` | Run validation checks |
    | `/idumb:new-project` | Start new project planning |
    | `/idumb:roadmap` | Create/view roadmap |
    | `/idumb:map-codebase` | Analyze existing code (brownfield) |
    
    ### Agents Available
    
    - **idumb-supreme-coordinator** - Primary orchestrator (Tab to switch)
    - **idumb-high-governance** - Mid-level coordination
    - **idumb-low-validator** - Validation work (hidden)
    - **idumb-builder** - File operations (hidden)
```

## Step 11: Final Report

```yaml
report:
  condition: Step 7 returns pass
  
  output: |
    ## INITIALIZATION COMPLETE
    
    **Status:** {complete | partial | failed | planning_incomplete}
    **Framework Detected:** {planning | bmad | both | none | idumb-only}
    **Planning Phase:** {phase if applicable}
    **Governance Mode:** hierarchical
    
    ### Structure Created
    - .idumb/brain/state.json
    - .idumb/brain/config.json
    - .idumb/brain/governance/
    - .idumb/project-output/
    
    ### Next Steps
    {Based on project type detection}
    
    ### Warnings
    {Any issues needing attention}
```

</process>

<completion_format>

## INITIALIZATION COMPLETE

```markdown
# iDumb Governance Initialized

**Date:** {YYYY-MM-DD HH:MM:SS}
**Status:** Complete
**Framework:** {planning | bmad | both | none | idumb-only}
**Project Type:** {greenfield | brownfield | existing_planning}

## Structure Created

```
.idumb/
├── brain/
│   ├── state.json          ✓ Created
│   ├── config.json         ✓ Created
│   ├── context/            ✓ Created
│   ├── history/            ✓ Created
│   ├── governance/         ✓ Created
│   │   └── validations/    ✓ Created
│   ├── sessions/           ✓ Created
│   └── execution/          ✓ Created
└── project-output/
    ├── phases/             ✓ Created
    ├── roadmaps/           ✓ Created
    └── research/           ✓ Created
```

## Framework Integration

| Framework | Status |
|-----------|--------|
| Planning (.planning/) | {Detected / Not Found} |
| BMAD (PROJECT.md) | {Detected / Not Found} |

## Project Detection

**Type:** {greenfield | brownfield | existing_planning}
**Source Files:** {count}
**Planning Ready:** {yes | no}

## Agents Available

| Agent | Mode | Description |
|-------|------|-------------|
| idumb-supreme-coordinator | primary | Top-level orchestration (Tab) |
| idumb-high-governance | all | Mid-level coordination |
| idumb-low-validator | hidden | Validation work |
| idumb-builder | hidden | File operations |

## Next Steps

{Based on project type:}

### For Greenfield Projects
1. `/idumb:new-project` - Start project planning

### For Brownfield Projects
1. `/idumb:map-codebase` - Analyze existing code
2. `/idumb:new-project` - Create project context

### For Existing Planning
1. `/idumb:status` - View current state
2. Continue with current phase work

## Context Anchors

Anchors survive session compaction. Your initialization is recorded.

---

**iDumb Governance Active** | Version {version} | Run `/idumb:status` anytime
```

## INITIALIZATION PARTIAL/FAILED

```markdown
# iDumb Initialization: {PARTIAL | FAILED}

**Date:** {YYYY-MM-DD HH:MM:SS}
**Status:** {partial | failed}

## Completed Steps

- [x] {Step 1}
- [x] {Step 2}
- [ ] {Failed step}

## Failed Steps

| Step | Error | Resolution |
|------|-------|------------|
| {step} | {error} | {how to fix} |

## Manual Action Required

1. {Specific action needed}
2. {Additional action}

## Retry

```bash
/idumb:init --force
```
```

## PLANNING INCOMPLETE

```markdown
# iDumb Initialization: Planning Incomplete

**Date:** {YYYY-MM-DD HH:MM:SS}
**Status:** planning_incomplete

## Planning Detection

**Directory:** .planning/ exists
**Files Found:** {list}
**Files Missing:** {list}

## iDumb Status

- [x] .idumb/ structure created
- [x] state.json initialized
- [x] config.json created
- [ ] Planning integration incomplete

## Options

1. **Complete planning:** `/idumb:new-project`
2. **Proceed without planning:** `/idumb:init --no-planning`
3. **Map codebase first:** `/idumb:map-codebase`

## Warning

iDumb will operate in degraded mode without full planning integration.
Some phase-tracking features will be unavailable.
```

</completion_format>

<error_handling>

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `I001` | Already initialized | Use `--force` to reinitialize |
| `I002` | Cannot create directories | Check file permissions |
| `I003` | Invalid JSON created | Check for syntax errors, retry |
| `I004` | Planning incomplete | Complete planning setup first |
| `I005` | Integrity check failed | Review failed checks, retry |
| `I006` | State write failed | Check disk space, permissions |

</error_handling>

<governance>

## Delegation Chain

```
user → supreme-coordinator
              ↓
       low-validator (detect context)
              ↓
          builder (create structure)
              ↓
       low-validator (verify structure)
              ↓
          builder (create anchor, history)
              ↓
       low-validator (final integrity)
              ↓
      supreme-coordinator (report)
```

## Critical Rules

1. **NEVER create files directly** - supreme-coordinator has `write: false`, `edit: false`
2. **ALWAYS delegate file ops to @idumb-builder**
3. **ALWAYS delegate validation to @idumb-low-validator**
4. **NEVER stop when issues detected** - Guide user or fix iDumb files
5. **NEVER report complete** unless final integrity check passes
6. **Track retry counts** - Max 3 before escalating to user
7. **NEVER scaffold planning files** - Guide user to `/idumb:new-project`
8. **Planning files are READ-ONLY** - iDumb only reads `.planning/`, never writes

## Validation Points

| Point | Check | Agent |
|-------|-------|-------|
| Pre | Not already initialized (or --force) | supreme-coordinator |
| During | Structure created correctly | low-validator |
| During | Planning integration complete | low-validator |
| Post | Final integrity check | low-validator |
| Post | All required files exist and valid | low-validator |

## Permission Model

| Agent | Can Delegate | Can Write | Can Read |
|-------|--------------|-----------|----------|
| supreme-coordinator | Yes | No | Yes |
| low-validator | No | No | Yes |
| builder | No | Yes | Yes |

</governance>

<metadata>
```yaml
category: setup
priority: P0
complexity: medium
version: 0.2.0
requires: nothing (entry point)
outputs:
  - .idumb/brain/state.json
  - .idumb/brain/config.json
  - .idumb/brain/governance/
  - .idumb/project-output/
```
</metadata>
