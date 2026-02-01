---
description: "Initialize iDumb governance for this project. The ONLY command you need to start."
agent: idumb-supreme-coordinator
---

# Initialize iDumb Governance

You are initializing iDumb governance for this project.

**REMEMBER:** You (supreme-coordinator) have `write: false` and `edit: false`. You MUST delegate all file operations to @idumb-builder.

## YOUR TASK

### Step 1: Check for existing setup
- Read `.idumb/brain/state.json` if exists using Read tool
- Check if already initialized
- If yes, report current state and ask if user wants to reinitialize

### Step 2: Detect project context
Delegate to @idumb-low-validator to gather project context:
```
@idumb-low-validator
Task: Gather project context
Checks:
  - Check .planning/ exists (GSD indicator)
  - Check .planning/STATE.md exists (GSD state file)
  - Check .planning/ROADMAP.md exists (GSD roadmap)
  - Check PROJECT.md exists (BMAD indicator)
  - Check _bmad-output/ exists (BMAD output)
  - Read .planning/STATE.md to get current GSD phase
Return: YAML with all findings
```

### Step 3: Create governance structure
**DELEGATE TO BUILDER** - You cannot create files directly!

```
@idumb-builder
Task: Create iDumb governance structure
Directories:
  - .idumb/
  - .idumb/brain/
  - .idumb/governance/
  - .idumb/anchors/
Files:
  - .idumb/brain/state.json (create with template below)
Template for state.json:
  {
    "version": "0.1.0",
    "initialized": "[ISO timestamp]",
    "framework": "[detected: gsd/bmad/both/none]",
    "phase": "[from GSD STATE.md or 'init']",
    "lastValidation": null,
    "validationCount": 0,
    "anchors": [],
    "history": []
  }
Verify: Confirm all paths exist after creation
Return: List of created files/directories
```

### Step 4: Validate structure
Delegate to @idumb-low-validator to confirm structure:
```
@idumb-low-validator
Task: Verify governance structure created correctly
Checks:
  - .idumb/ directory exists
  - .idumb/brain/state.json exists and is valid JSON
  - .idumb/governance/ directory exists
Return: pass/fail with evidence
```

### Step 5: Set up initial anchor
Delegate to @idumb-builder to create anchor:
```
@idumb-builder
Task: Create initial anchor
Use: idumb-state tool with anchor function
Anchor:
  type: checkpoint
  content: "iDumb initialized for [project name]"
  priority: high
```

### Step 6: Report to user
```yaml
initialization:
  status: complete
  framework_detected: [gsd/bmad/both/none]
  gsd_phase: [phase if GSD detected]
  governance_mode: hierarchical
  structure_created:
    - .idumb/brain/state.json
    - .idumb/governance/
    - .idumb/anchors/
  agents_available:
    - idumb-supreme-coordinator (primary) - Switch with Tab
    - idumb-high-governance (all) - Mid-level coordination
    - idumb-low-validator (hidden) - Validation work
    - idumb-builder (hidden) - File operations
  next_steps:
    - "Run /idumb:status to check state anytime"
    - "GSD commands work normally with invisible governance"
    - "Context anchors survive session compaction"
```

## CRITICAL RULES

- **NEVER create files directly** - You have write: false, edit: false
- **ALWAYS delegate file ops to @idumb-builder**
- **ALWAYS delegate validation to @idumb-low-validator**
- **ALWAYS read GSD phase from .planning/STATE.md** (not project root!)
- If GSD detected, sync phase from their STATE.md to our state.json

## GSD DETECTION

GSD files are in `.planning/`, NOT project root:
- `.planning/STATE.md` - Current phase/plan
- `.planning/ROADMAP.md` - Phase structure
- `.planning/config.json` - GSD configuration
- `.planning/phases/` - Phase directories

$ARGUMENTS
