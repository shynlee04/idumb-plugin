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
                                    │         Step 8 (Brownfield Detection)
                                    │                                  ↓
                                    │    ┌────────────────┬────────────┴────────────┐
                                    │    ↓                ↓                         ↓
                                    │ [brownfield]    [greenfield]           [existing_gsd]
                                    │    ↓                ↓                         ↓
                                    │ Step 9 + 10     Step 9               Skip to Step 11
                                    │    ↓                ↓                         ↓
                                    │    └────────→ Step 11 (Menu) ←────────────────┘
                                    │                     ↓
                                    └→ [FAIL] →    Step 12 → COMPLETE
                                              ↓
                                    Step 4b (guide user) → USER DECISION
                                              │
                                   ┌──────────┴───────────┐
                                   ↓                      ↓
                           [proceed --no-gsd]     [wait for GSD]
                                   ↓                      ↓
                             Step 5...              Status: gsd_incomplete
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
  - Check .planning/ exists (GSD indicator)
  - Check .planning/PROJECT.md exists (GSD project definition)
  - Check .planning/STATE.md exists (GSD state file)
  - Check .planning/ROADMAP.md exists (GSD roadmap)
  - Check .planning/config.json exists (GSD config)
  - Check PROJECT.md exists in root (BMAD indicator)
  - Check _bmad-output/ exists (BMAD output)
Return Format:
  status: complete/partial/missing
  gsd:
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
    "framework": "[detected: gsd/bmad/both/none]",
    "phase": "[from GSD STATE.md or 'init']",
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
    "frameworks": {
      "gsd": {
        "detected": [true/false],
        "configPath": ".planning/config.json",
        "syncEnabled": true
      }
    }
  }
Return Format:
  status: success/partial/failed
  created: [list of created items]
  failed: [list of failed items with reasons]
```

### Step 4: Validate structure AND framework completeness
Delegate to @idumb-low-validator:
```
@idumb-low-validator
Task: Verify governance structure AND framework integration
Checks:
  - .idumb/ directory exists
  - .idumb/brain/state.json exists and is valid JSON
  - .idumb/governance/ directory exists
  - .idumb/config.json exists and is valid JSON
  - IF GSD detected: Check required GSD files exist
    - .planning/PROJECT.md (REQUIRED for GSD)
    - .planning/STATE.md (REQUIRED for workflow)
    - .planning/ROADMAP.md (REQUIRED for phases)
    - .planning/config.json (REQUIRED for settings)
Return Format:
  status: pass/fail
  idumb_structure: pass/fail
  gsd_completeness: pass/fail/not_applicable
  missing_gsd_files: [list if any]
  evidence: [specific checks performed]
```

## ⚡ GSD INTEGRATION LOGIC (CRITICAL)

### Step 4b: IF GSD detected but incomplete

**DO NOT SCAFFOLD GSD FILES. Guide user instead.**

When `gsd_completeness: fail`:

1. **Report the gap clearly:**
```yaml
gsd_gap_detected:
  status: incomplete
  files_missing:
    - .planning/PROJECT.md → "Run /gsd:new-project to create"
    - .planning/STATE.md → "Created by /gsd:new-project"
    - .planning/ROADMAP.md → "Created by roadmapping phase"
    - .planning/config.json → "Created by /gsd:new-project"
  guidance: |
    iDumb detected .planning/ directory but GSD setup is incomplete.
    
    OPTIONS:
    1. Complete GSD setup: Run `/gsd:new-project`
    2. Use iDumb without GSD: Proceed with `--no-gsd` flag
    3. Map existing codebase: Run `/gsd:map-codebase`
  
  recommended: "Run /gsd:new-project first, then /idumb:init"
```

2. **Ask user for decision:**
   - "Would you like to proceed without GSD integration?"
   - If yes: Set `framework: "idumb-only"` and continue to Step 5
   - If no: Halt and wait for GSD setup

3. **DO NOT create any files in .planning/**

### Step 4c: Handle user decision
```yaml
user_decision:
  proceed_without_gsd:
    - Update state.json with: framework: "idumb-only"
    - Set gsd_ready: false in config
    - Continue to Step 5
  wait_for_gsd:
    - Report: "Run /gsd:new-project then /idumb:init --force"
    - Status: gsd_incomplete
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
  - IF GSD: All 4 required files exist
Return Format:
  status: pass/fail
  initialization_complete: true/false
  summary: "[brief status]"
```

### Step 8: GSD Integration (Brownfield Detection)

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
    action: Auto-run /gsd:map-codebase then /gsd:new-project
  elif: SRC_FILES <= 5 AND PLANNING_EXISTS == false
    type: greenfield
    action: Offer /gsd:new-project
  else:
    type: existing_gsd
    action: Sync with existing .planning/ state
```

### Step 9: GSD Agent Header Wrapping

**IF brownfield or greenfield, delegate to builder:**

```
@idumb-builder
Task: Wrap GSD agent frontmatter with iDumb governance
Files: .opencode/agents/gsd-*.md
For each file:
  1. Read current frontmatter
  2. Add to tools section:
     idumb-state: true
     idumb-validate: true
  3. Add idumb block:
     idumb:
       governance: true
       sync_on_complete: true
       report_to: idumb-supreme-coordinator
  4. Preserve existing content
  5. Write back
```

### Step 10: Auto-Trigger GSD Flow (Brownfield Only)

**IF brownfield:**

Report to user:
```yaml
brownfield_detected:
  status: "Existing codebase detected with ${SRC_FILES} source files"
  action: "Starting GSD brownfield initialization"
  steps:
    1: "/gsd:map-codebase - Analyze existing code structure"
    2: "/gsd:new-project - Create project context and roadmap"
  governance: "iDumb will monitor and sync with GSD progress"
```

Then instruct:
```
After this command completes, the next action is:
1. Run: /gsd:map-codebase
2. Then: /gsd:new-project
3. iDumb will automatically sync state after each GSD command
```

### Step 11: Present Final Menu

```yaml
idumb_ready:
  status: complete
  gsd_status: [ready | brownfield_pending | greenfield_pending]
  next_actions:
    if_brownfield:
      - "Run /gsd:map-codebase to analyze codebase"
      - "Then /gsd:new-project to create roadmap"
    if_greenfield:
      - "Run /gsd:new-project to start project"
    if_existing_gsd:
      - "GSD already initialized - iDumb synced"
      - "Run /gsd:progress to see current state"
  commands_available:
    - "/idumb:status - Check governance state"
    - "/idumb:validate - Run validation checks"
    - "/gsd:* - All GSD commands now governed"
```

### Step 12: Report to user

**ONLY report `status: complete` if Step 7 returns `pass`**

```yaml
initialization:
  status: [complete/partial/failed/gsd_incomplete]
  framework_detected: [gsd/bmad/both/none/idumb-only]
  gsd_phase: [phase if GSD detected and complete]
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

**IF status is `gsd_incomplete` (GSD detected but not fully set up):**
```yaml
initialization:
  status: gsd_incomplete
  framework_detected: gsd (partial)
  gsd_files_found: [list]
  gsd_files_missing: [list]
  idumb_ready: true
  gsd_ready: false
  next_steps:
    - "Run /gsd:new-project to complete GSD setup"
    - "Then run /idumb:init --force to re-sync"
    - "Or run /idumb:init --no-gsd to proceed without GSD"
  warning: "iDumb will operate in degraded mode without full GSD"
```

## CRITICAL RULES

1. **NEVER create files directly** - You have write: false, edit: false
2. **ALWAYS delegate file ops to @idumb-builder**
3. **ALWAYS delegate validation to @idumb-low-validator**
4. **NEVER stop when issues detected** - Guide user or fix iDumb files
5. **NEVER report complete** unless final integrity check passes
6. **Track retry counts** - Max 3 before escalating to user
7. **NEVER scaffold GSD files** - Guide user to /gsd:new-project instead
8. **GSD files are READ-ONLY** - iDumb only reads .planning/, never writes

## GSD DETECTION

GSD files are in `.planning/`, NOT project root:
- `.planning/PROJECT.md` - Project definition (REQUIRED)
- `.planning/STATE.md` - Current phase/plan
- `.planning/ROADMAP.md` - Phase structure
- `.planning/config.json` - GSD configuration
- `.planning/phases/` - Phase directories

$ARGUMENTS
