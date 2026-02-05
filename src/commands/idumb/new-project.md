---
description: "Initialize a new iDumb-governed project with full governance structure"
id: cmd-new-project
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:new-project

<objective>
Initialize a new iDumb-governed project with complete governance structure, configuration, and state management. Creates the `.idumb/` directory hierarchy with brain, governance, and context subdirectories, establishes initial configuration based on detected framework, and prepares the project for governed development.
</objective>

<context>

## Usage

```bash
/idumb:new-project [project-name] [--framework=planning|bmad|custom] [--template=web|api|library|cli] [--skip-git]
```

## Arguments

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `project-name` | string | Name of the project | Current directory name |
| `--framework` | enum | Governance framework to use | `custom` |
| `--template` | enum | Project template type | `web` |
| `--skip-git` | flag | Skip git hooks installation | `false` |

## Framework Options

| Framework | Description | Best For |
|-----------|-------------|----------|
| `planning` | Full planning artifacts (.planning/) | Complex multi-phase projects |
| `bmad` | BMAD methodology integration | AI-assisted development |
| `custom` | Minimal governance structure | Simple projects, custom workflows |

## Template Options

| Template | Includes |
|----------|----------|
| `web` | Frontend patterns, component structure |
| `api` | Backend patterns, endpoint documentation |
| `library` | Package structure, publishing workflow |
| `cli` | Command patterns, argument parsing |

</context>

<process>

## Step 1: Validate Environment

Check if `.idumb/` already exists and handle conflicts.

```bash
# Check for existing iDumb installation
if [ -d ".idumb" ]; then
  echo "WARNING: .idumb/ already exists"
  # Prompt: overwrite, merge, or abort
fi

# Verify write permissions
touch .idumb-test-write 2>/dev/null && rm .idumb-test-write || {
  echo "ERROR: No write permission in current directory"
  exit 1
}
```

## Step 2: Create Directory Structure

Build the complete `.idumb/` hierarchy.

```bash
# Create brain directories
mkdir -p .idumb/brain/history
mkdir -p .idumb/brain/context
mkdir -p .idumb/brain/governance/validations
mkdir -p .idumb/brain/anchors
mkdir -p .idumb/brain/sessions
mkdir -p .idumb/brain/execution
mkdir -p .idumb/brain/drift
mkdir -p .idumb/brain/metadata
mkdir -p .idumb/brain/indexes

# Create project output directories
mkdir -p .idumb/project-output/phases
mkdir -p .idumb/project-output/roadmaps
mkdir -p .idumb/project-output/research
mkdir -p .idumb/project-output/validations
mkdir -p .idumb/project-output/codebase

# Create modules directory for extensions
mkdir -p .idumb/modules
```

## Step 3: Detect Existing Frameworks

Scan for existing project artifacts.

```bash
# Detection checks
DETECTED_FRAMEWORKS=""

# Planning framework
[ -d ".planning" ] && DETECTED_FRAMEWORKS="$DETECTED_FRAMEWORKS planning"

# BMAD
[ -f "PROJECT.md" ] && [ -f "STATE.md" ] && DETECTED_FRAMEWORKS="$DETECTED_FRAMEWORKS bmad"

# Package managers
[ -f "package.json" ] && PROJECT_TYPE="node"
[ -f "Cargo.toml" ] && PROJECT_TYPE="rust"
[ -f "go.mod" ] && PROJECT_TYPE="go"
[ -f "requirements.txt" ] && PROJECT_TYPE="python"
[ -f "pyproject.toml" ] && PROJECT_TYPE="python"
```

## Step 4: Initialize Configuration

Create `config.json` with detected settings.

```
Use tool: idumb-config_init

Parameters:
  userName: (from git config or prompt)
  language: "en"
  governanceLevel: "standard"
  experience: "guided"
```

**Config Structure:**
```json
{
  "version": "0.2.0",
  "user": {
    "name": "<detected_or_prompted>",
    "experience": "guided",
    "language": {
      "communication": "en",
      "documents": "en"
    }
  },
  "hierarchy": {
    "enforceChain": true,
    "agents": {
      "coordinator": "idumb-supreme-coordinator",
      "governance": "idumb-high-governance",
      "validator": "idumb-low-validator",
      "builder": "idumb-builder"
    }
  },
  "automation": {
    "mode": "confirmRequired",
    "expertSkeptic": false,
    "contextFirst": true
  }
}
```

## Step 5: Initialize State

Create `state.json` with initial values.

```
Use tool: idumb-state_write

Parameters:
  phase: "init"
  framework: <selected_framework>
```

**State Structure:**
```json
{
  "version": "0.2.0",
  "initialized": "<ISO-8601-timestamp>",
  "framework": "<selected>",
  "phase": "init",
  "lastValidation": null,
  "validationCount": 0,
  "anchors": [],
  "history": [{
    "timestamp": "<ISO-8601>",
    "action": "project:initialized",
    "agent": "idumb-supreme-coordinator",
    "result": "pass"
  }]
}
```

## Step 6: Create Initial Anchor

Record project initialization as critical anchor.

```
Use tool: idumb-state_anchor

Parameters:
  type: "checkpoint"
  content: "Project initialized: <name> with <framework> framework"
  priority: "critical"
```

## Step 7: Generate Framework Templates

Based on selected framework, create starter artifacts.

**For Planning Framework:**
```bash
mkdir -p .planning/phases
touch .planning/PROJECT.md
touch .planning/STATE.md
touch .planning/ROADMAP.md
```

**For BMAD Framework:**
```bash
# BMAD uses existing PROJECT.md/STATE.md
# Just link to iDumb governance
```

**For Custom Framework:**
```bash
# Minimal structure only
# User defines own workflow
```

## Step 8: Report Initialization

Display summary and next steps.

</process>

<completion_format>

## Success Output

```
✓ iDumb project initialized

  Project:   <project-name>
  Framework: <framework>
  Template:  <template>
  Location:  <path>/.idumb/

  Structure Created:
  ├── .idumb/
  │   ├── brain/
  │   │   ├── state.json ✓
  │   │   ├── config.json ✓
  │   │   ├── history/
  │   │   ├── context/
  │   │   ├── governance/
  │   │   ├── anchors/
  │   │   └── sessions/
  │   ├── project-output/
  │   │   ├── phases/
  │   │   ├── roadmaps/
  │   │   └── research/
  │   └── modules/

  Detected:
  - Project type: <node|rust|go|python|unknown>
  - Existing frameworks: <list or "none">

  Next Steps:
  1. /idumb:map-codebase   - Map existing codebase structure
  2. /idumb:research       - Research project requirements
  3. /idumb:roadmap        - Create project roadmap
```

## Error Output

```
✗ iDumb initialization failed

  Error:  <E001|E002|E003>
  Reason: <specific reason>
  
  Resolution:
  <specific steps to resolve>
```

## Error Codes

| Code | Cause | Resolution |
|------|-------|------------|
| `E001` | `.idumb/` already exists | Use `--force` to overwrite or choose different directory |
| `E002` | Permission denied | Check directory write permissions |
| `E003` | Invalid framework | Use: `planning`, `bmad`, or `custom` |
| `E004` | Invalid template | Use: `web`, `api`, `library`, or `cli` |

</completion_format>

<success_criteria>

## Initialization Checklist

- [ ] `.idumb/` directory created
- [ ] `brain/` subdirectory created with all children
- [ ] `project-output/` subdirectory created
- [ ] `config.json` created with valid JSON
- [ ] `state.json` created with valid JSON
- [ ] Framework detected or selected
- [ ] Initial anchor created
- [ ] History entry recorded
- [ ] No permission errors
- [ ] Summary displayed to user

## Verification Commands

```bash
# Verify structure
ls -la .idumb/
ls -la .idumb/brain/

# Verify config
cat .idumb/brain/config.json | jq .

# Verify state
cat .idumb/brain/state.json | jq .
```

</success_criteria>

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:init` | Initialize iDumb in existing project (lighter) |
| `/idumb:status` | Check project status |
| `/idumb:config` | Modify configuration |
| `/idumb:research` | Begin research phase |

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → builder
```

**Validation Points:**
- Pre: Check directory permissions
- Pre: Check for existing `.idumb/`
- Post: Verify all files created
- Post: Validate JSON syntax
- Post: Record in history

## Metadata

```yaml
category: project-lifecycle
priority: P0
complexity: medium
version: 0.2.0
```
