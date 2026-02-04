---
description: "Initialize iDumb governance for this project with bounce-back validation loops."
agent: idumb-supreme-coordinator
---

# Initialize iDumb Governance

You are initializing iDumb governance for this project.

**REMEMBER:** You (supreme-coordinator) have `write: false` and `edit: false`. You MUST delegate all file operations to @idumb-builder.

## INITIALIZATION FLOW

```
Step 1 → Step 2 → Step 3 → Step 4 ──┬→ [PASS] → Step 5 → Step 6 → Step 7
                                    │                                  ↓
                                    │         Step 8 (Project Detection)
                                    │                                  ↓
                                    │    ┌────────────────┬────────────┴────────────┐
                                    │    ↓                ↓                         ↓
                                    │ [brownfield]    [greenfield]           [existing_planning]
                                    │    ↓                ↓                         ↓
                                    │ Step 9            Step 9               Skip to Step 10
                                    │    ↓                ↓                         ↓
                                    │    └────────→ Step 10 (Menu) ←────────────────┘
                                    │                     ↓
                                    └→ [FAIL] →    Step 11 → COMPLETE
                                              ↓
                                    Step 4b (guide user) → USER DECISION
                                              │
                                   ┌──────────┴───────────┐
                                   ↓                      ↓
                           [proceed anyway]     [create planning first]
                                   ↓                      ↓
                             Step 5...              Status: planning_incomplete
```

## YOUR TASK

### Step 1: Check for existing setup
- Read `.idumb/brain/state.json` if exists
- Check if already initialized
- If yes, report current state and ask if user wants to reinitialize

### Step 2: Detect project context
Delegate to @idumb-low-validator to gather project context:
```
@idumb-low-validator
Task: Gather project context
Checks:
  - Check .planning/ exists (planning indicator)
  - Check .planning/PROJECT.md exists (project definition)
  - Check .planning/STATE.md exists (state file)
  - Check .planning/ROADMAP.md exists (roadmap)
  - Check .planning/config.json exists (planning config)
  - Check PROJECT.md exists in root (BMAD indicator)
  - Check _bmad-output/ exists (BMAD output)
Return Format:
  status: complete/partial/missing
  planning:
    detected: true/false
    files_found: [list]
    files_missing: [list]
  bmad:
    detected: true/false
    files_found: [list]
    files_missing: [list]
```

### Step 3: Create iDumb governance structure
**DELEGATE TO BUILDER** - You cannot create files directly!

```
@idumb-builder
Task: Create iDumb governance structure
Directories:
  - .idumb/
  - .idumb/brain/
  - .idumb/brain/context/
  - .idumb/brain/history/
  - .idumb/governance/
  - .idumb/governance/validations/
  - .idumb/anchors/
  - .idumb/sessions/
Files:
  - .idumb/brain/state.json (create with template below)
  - .idumb/config.json (create with template below)
Template for state.json:
  {
    "version": "0.1.0",
    "initialized": "[ISO timestamp]",
    "framework": "[detected: planning/bmad/both/none]",
    "phase": "[from STATE.md or 'init']",
    "lastValidation": null,
    "validationCount": 0,
    "anchors": [],
    "history": []
  }
Template for config.json:
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
      }
    },
    "planning": {
      "detected": [true/false],
      "configPath": ".planning/config.json",
      "syncEnabled": true
    }
  }
Return Format:
  status: success/partial/failed
  created: [list of created items]
  failed: [list of failed items with reasons]
```

### Step 4: Validate structure AND planning completeness
Delegate to @idumb-low-validator:
```
@idumb-low-validator
Task: Verify governance structure AND planning integration
Checks:
  - .idumb/ directory exists
  - .idumb/brain/state.json exists and is valid JSON
  - .idumb/governance/ directory exists
  - .idumb/config.json exists and is valid JSON
  - IF planning detected: Check required planning files exist
    - .planning/PROJECT.md (REQUIRED for planning)
    - .planning/STATE.md (REQUIRED for workflow)
    - .planning/ROADMAP.md (REQUIRED for phases)
    - .planning/config.json (REQUIRED for settings)
Return Format:
  status: pass/fail
  idumb_structure: pass/fail
  planning_completeness: pass/fail/not_applicable
  missing_planning_files: [list if any]
  evidence: [specific checks performed]
```

## ⚡ PLANNING INTEGRATION LOGIC (CRITICAL)

### Step 4b: IF planning detected but incomplete

**DO NOT SCAFFOLD PLANNING FILES. Guide user instead.**

When `planning_completeness: fail`:

1. **Report the gap clearly:**
```yaml
planning_gap_detected:
  status: incomplete
  files_missing:
    - .planning/PROJECT.md → "Run /idumb:new-project to create"
    - .planning/STATE.md → "Created by /idumb:new-project"
    - .planning/ROADMAP.md → "Created by roadmapping phase"
    - .planning/config.json → "Created by /idumb:new-project"
  guidance: |
    iDumb detected .planning/ directory but planning setup is incomplete.
    
    OPTIONS:
    1. Complete planning setup: Run `/idumb:new-project`
    2. Use iDumb without planning: Proceed with `--no-planning` flag
    3. Map existing codebase: Run `/idumb:map-codebase`
  
  recommended: "Run /idumb:new-project first, then /idumb:init"
```

2. **Ask user for decision:**
   - "Would you like to proceed without planning integration?"
   - If yes: Set `framework: "idumb-only"` and continue to Step 5
   - If no: Halt and wait for planning setup

3. **DO NOT create any files in .planning/**

### Step 4c: Handle user decision
```yaml
user_decision:
  proceed_without_planning:
    - Update state.json with: framework: "idumb-only"
    - Set planning_ready: false in config
    - Continue to Step 5
  wait_for_planning:
    - Report: "Run /idumb:new-project then /idumb:init --force"
    - Status: planning_incomplete
    - Do NOT continue to Step 5
```

### Step 5: Set up initial anchor (only after Step 4 PASS)
```
@idumb-builder
Task: Create initial anchor
Use: idumb-state_anchor tool
Anchor:
  type: checkpoint
  content: "iDumb initialized for [project name] - [framework] detected"
  priority: high
```

### Step 6: Record in history
```
@idumb-builder
Task: Record initialization in history
Use: idumb-state_history tool
Action: "governance_init"
Result: "[summary of what was created/scaffolded]"
```

### Step 7: Final integrity check (MANDATORY)
```
@idumb-low-validator
Task: Final initialization integrity check
Checks:
  - state.json exists AND valid JSON AND has required fields
  - config.json exists AND valid JSON
  - At least 1 anchor exists
  - History has at least 1 entry
  - IF planning: All 4 required files exist
Return Format:
  status: pass/fail
  initialization_complete: true/false
  summary: "[brief status]"
```

### Step 8: Project Type Detection (Brownfield Detection)

**Check project type:**
```bash
# Count source files (excluding node_modules, .git)
SRC_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
PLANNING_EXISTS=$([ -d ".planning" ] && echo "true" || echo "false")
```

**Determine project type:**
```yaml
project_type_detection:
  if: SRC_FILES > 5 AND PLANNING_EXISTS == false
    type: brownfield
    action: Run /idumb:map-codebase first
  elif: SRC_FILES <= 5 AND PLANNING_EXISTS == false
    type: greenfield
    action: Run /idumb:new-project
  else:
    type: existing_planning
    action: Sync with existing .planning/ state
```

### Step 9: Auto-Trigger iDumb Flow

**IF brownfield or greenfield:**

Report to user:
```yaml
project_detected:
  type: [brownfield | greenfield]
  status: "Project type detected with ${SRC_FILES} source files"
  next_steps:
    brownfield:
      1: "/idumb:map-codebase - Analyze existing code structure"
      2: "/idumb:new-project - Create project context and roadmap"
    greenfield:
      1: "/idumb:new-project - Start project planning"
  governance: "iDumb will track and manage your project progress"
```

### Step 10: Present Final Menu

```yaml
idumb_ready:
  status: complete
  project_status: [ready | brownfield_pending | greenfield_pending]
  next_actions:
    if_brownfield:
      - "Run /idumb:map-codebase to analyze codebase"
      - "Then /idumb:new-project to create roadmap"
    if_greenfield:
      - "Run /idumb:new-project to start project"
    if_existing_planning:
      - "Planning already initialized - iDumb synced"
      - "Run /idumb:status to see current state"
  commands_available:
    - "/idumb:status - Check governance state"
    - "/idumb:validate - Run validation checks"
    - "/idumb:new-project - Start new project planning"
    - "/idumb:roadmap - Create/view roadmap"
```

### Step 11: Report to user

**ONLY report `status: complete` if Step 7 returns `pass`**

```yaml
initialization:
  status: [complete/partial/failed/planning_incomplete]
  framework_detected: [planning/bmad/both/none/idumb-only]
  planning_phase: [phase if planning detected and complete]
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
    - "iDumb commands manage your project planning"
    - "Context anchors survive session compaction"
  warnings: [list any issues that need user attention]
```

**IF status is `partial` or `failed`:**
```yaml
initialization:
  status: partial
  completed_steps: [list]
  failed_steps: [list with reasons]
  manual_action_required:
    - "[specific action needed]"
    - "[specific file to complete]"
  retry_command: "/idumb:init --force"
```

**IF status is `planning_incomplete` (planning detected but not fully set up):**
```yaml
initialization:
  status: planning_incomplete
  framework_detected: planning (partial)
  planning_files_found: [list]
  planning_files_missing: [list]
  idumb_ready: true
  planning_ready: false
  next_steps:
    - "Run /idumb:new-project to complete planning setup"
    - "Then run /idumb:init --force to re-sync"
    - "Or run /idumb:init --no-planning to proceed without planning"
  warning: "iDumb will operate in degraded mode without full planning"
```

## CRITICAL RULES

1. **NEVER create files directly** - You have write: false, edit: false
2. **ALWAYS delegate file ops to @idumb-builder**
3. **ALWAYS delegate validation to @idumb-low-validator**
4. **NEVER stop when issues detected** - Guide user or fix iDumb files
5. **NEVER report complete** unless final integrity check passes
6. **Track retry counts** - Max 3 before escalating to user
7. **NEVER scaffold planning files** - Guide user to /idumb:new-project instead
8. **Planning files are READ-ONLY** - iDumb only reads .planning/, never writes

## PLANNING DETECTION

Planning files are in `.planning/`, NOT project root:
- `.planning/PROJECT.md` - Project definition (REQUIRED)
- `.planning/STATE.md` - Current phase/plan
- `.planning/ROADMAP.md` - Phase structure
- `.planning/config.json` - Planning configuration
- `.planning/phases/` - Phase directories

$ARGUMENTS
