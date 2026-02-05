---
description: "Show current iDumb governance state, active anchors, and validation history"
id: cmd-status
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:status

<objective>
Generate a comprehensive status report of the current iDumb governance state. Display initialization status, current phase, active anchors, validation history, governance health, and any stale context warnings. This is a read-only command that provides visibility into the governance system without modifying state.
</objective>

<context>

## Usage

```bash
/idumb:status [--section=all|state|health|anchors|history] [--format=summary|detailed|json]
```

## Arguments

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `--section` | enum | Which section to display | `all` |
| `--format` | enum | Output format | `summary` |

## Section Options

| Section | Shows |
|---------|-------|
| `all` | Complete status report |
| `state` | Current phase, framework, version |
| `health` | File integrity, freshness, structure |
| `anchors` | Active context anchors |
| `history` | Recent governance history |

## Prerequisites

- `.idumb/` directory may or may not exist
- Command will report initialization status

</context>

<process>

## Step 1: Check Initialization

Verify iDumb is initialized in this project.

```bash
# Check for .idumb directory
if [ ! -d ".idumb" ]; then
  echo "iDumb not initialized in this project"
  echo "Run: /idumb:init"
  exit 0
fi

# Check for state file
STATE_FILE=".idumb/brain/state.json"
if [ ! -f "$STATE_FILE" ]; then
  echo "WARNING: state.json missing"
  NEEDS_REPAIR=true
fi

# Check for config file
CONFIG_FILE=".idumb/brain/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "WARNING: config.json missing"
  NEEDS_REPAIR=true
fi
```

## Step 2: Load Current State

Read governance state from state.json.

```
Use tool: idumb-state

Read:
  - version
  - initialized
  - framework
  - phase
  - lastValidation
  - validationCount
  - anchors (count and summaries)
  - history (last 5 entries)
```

## Step 3: Check Governance Health

Delegate structure validation to low-validator.

```
Delegate to: @idumb-low-validator

Task: Validate governance integrity
Method: 
  - Check state.json exists and is valid JSON
  - Check config.json exists and is valid JSON
  - Verify .idumb/ directory structure
  - Check for missing required directories
Return: pass/fail with specific issues
```

**Health Checks:**
```yaml
checks:
  state_file:
    path: .idumb/brain/state.json
    criteria: exists, valid_json, has_required_fields
    
  config_file:
    path: .idumb/brain/config.json
    criteria: exists, valid_json, has_required_fields
    
  brain_directory:
    path: .idumb/brain/
    criteria: exists, has_subdirectories
    
  governance_directory:
    path: .idumb/brain/governance/
    criteria: exists
    
  output_directory:
    path: .idumb/project-output/
    criteria: exists
```

## Step 4: Check Context Freshness

Identify stale files older than 48 hours.

```bash
# Find files older than 48 hours in context directories
find .idumb/brain/context -type f -mtime +2 2>/dev/null | while read file; do
  echo "STALE: $file"
done

find .idumb/brain/governance -type f -mtime +2 2>/dev/null | while read file; do
  echo "STALE: $file"
done
```

```
Use tool: idumb-validate_freshness

maxAgeHours: 48
```

## Step 5: Check Planning Integration

Detect and report planning framework status.

```bash
# Check for planning artifacts
PLANNING_DETECTED=false

if [ -d ".planning" ]; then
  PLANNING_DETECTED=true
  PLANNING_DIR="exists"
  
  [ -f ".planning/ROADMAP.md" ] && ROADMAP="exists" || ROADMAP="missing"
  [ -f ".planning/STATE.md" ] && STATE_FILE="exists" || STATE_FILE="missing"
  [ -f ".planning/PROJECT.md" ] && PROJECT="exists" || PROJECT="missing"
fi
```

## Step 6: Gather Anchor Summary

List active anchors with priorities.

```
Use tool: idumb-state_getAnchors

Group by priority:
  - critical: <list>
  - high: <list>
  - normal: <list>
```

## Step 7: Gather History Summary

Get recent governance history.

```
Read from state.json: history[-5:]

Format each entry:
  - timestamp (relative: "2h ago")
  - action
  - agent
  - result (pass/fail/partial)
```

## Step 8: Generate Recommendations

Based on findings, provide actionable recommendations.

```yaml
recommendations:
  if_not_initialized:
    - "Run /idumb:init to initialize governance"
    
  if_stale_context:
    - "Run /idumb:validate to refresh stale context"
    - "Consider archiving old anchors"
    
  if_planning_misaligned:
    - "Run /idumb:validate scope:alignment"
    - "Check .planning/ synchronization"
    
  if_no_recent_validation:
    - "Run /idumb:validate for full check"
    
  if_missing_files:
    - "Run /idumb:init --repair to fix structure"
```

</process>

<completion_format>

## Full Status Report

```yaml
# iDumb Status Report
# Generated: <timestamp>

status:
  initialized: true
  version: "0.2.0"
  phase: "phase-02"
  framework: planning

governance:
  last_validation: "2026-02-04T10:30:00Z" (4h ago)
  validation_count: 12
  active_anchors: 5

health:
  state_file: ok
  config_file: ok
  brain_directory: ok
  governance_directory: ok
  output_directory: ok
  stale_files: []

hierarchy:
  coordinator: idumb-supreme-coordinator (primary)
  governance: idumb-high-governance (all)
  validator: idumb-low-validator (hidden)
  builder: idumb-builder (hidden)

planning_integration:
  detected: true
  planning_dir: exists
  roadmap: exists
  state: exists
  project: exists
  alignment: synced

anchors:
  critical:
    - "decision-phase2-architecture: Use layered architecture"
  high:
    - "context-api-design: REST with OpenAPI spec"
  normal:
    - "note-testing-strategy: Jest + Supertest"

history: # last 5 entries
  - "4h ago | validation:full | idumb-high-governance | pass"
  - "6h ago | phase:completed | idumb-executor | pass"
  - "1d ago | commit:feat | idumb-builder | pass"
  - "1d ago | plan:created | idumb-planner | pass"
  - "2d ago | research:complete | idumb-researcher | pass"

recommendations:
  - "No issues detected. System healthy."
```

## Console Output (Summary Format)

```
┌─────────────────────────────────────────────────────────────────┐
│                      iDumb Status Report                        │
├─────────────────────────────────────────────────────────────────┤
│ Status: ✓ Initialized    Version: 0.2.0    Framework: planning │
│ Phase:  phase-02         Anchors: 5        Validations: 12     │
├─────────────────────────────────────────────────────────────────┤
│ Health                                                          │
│ ├── State file:      ✓ ok                                       │
│ ├── Config file:     ✓ ok                                       │
│ ├── Brain dir:       ✓ ok                                       │
│ ├── Governance dir:  ✓ ok                                       │
│ └── Stale files:     0                                          │
├─────────────────────────────────────────────────────────────────┤
│ Planning Integration                                            │
│ ├── Detected:        ✓ yes                                      │
│ ├── ROADMAP.md:      ✓ exists                                   │
│ ├── STATE.md:        ✓ exists                                   │
│ └── Alignment:       ✓ synced                                   │
├─────────────────────────────────────────────────────────────────┤
│ Last Validation: 4 hours ago (passed)                           │
├─────────────────────────────────────────────────────────────────┤
│ Recommendations: None - system healthy                          │
└─────────────────────────────────────────────────────────────────┘
```

## Error/Warning States

```
┌─────────────────────────────────────────────────────────────────┐
│                      iDumb Status Report                        │
├─────────────────────────────────────────────────────────────────┤
│ Status: ⚠ Issues Detected                                       │
├─────────────────────────────────────────────────────────────────┤
│ Issues:                                                         │
│ ├── ⚠ state.json missing required field: validationCount       │
│ ├── ⚠ 3 stale files older than 48h                              │
│ └── ⚠ Planning alignment: out of sync                           │
├─────────────────────────────────────────────────────────────────┤
│ Recommendations:                                                │
│ 1. Run /idumb:validate to fix schema issues                     │
│ 2. Run /idumb:validate scope:freshness to update stale files    │
│ 3. Run /idumb:validate scope:alignment to sync planning         │
└─────────────────────────────────────────────────────────────────┘
```

</completion_format>

<success_criteria>

## Status Check Checklist

- [ ] Initialization status determined
- [ ] State file read (or reported missing)
- [ ] Config file read (or reported missing)
- [ ] Directory structure validated
- [ ] Freshness checked for stale files
- [ ] Planning integration detected
- [ ] Anchors summarized
- [ ] History summarized
- [ ] Recommendations generated
- [ ] Report displayed to user

## Critical Rules

- [ ] NEVER modify state during status check
- [ ] Delegate validation to @idumb-low-validator
- [ ] Report honestly - don't hide issues
- [ ] Provide actionable recommendations

## Verification

```bash
# Manual verification
cat .idumb/brain/state.json | jq .
cat .idumb/brain/config.json | jq .
ls -la .idumb/brain/
```

</success_criteria>

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:init` | Initialize if not initialized |
| `/idumb:validate` | Run full validation |
| `/idumb:config` | View/edit configuration |
| `/idumb:help` | Show all commands |

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → low-validator (for health checks)
```

**Validation Points:**
- Pre: None (status is always available)
- During: Read-only operations only
- Post: No state modifications

## Metadata

```yaml
category: governance
priority: P1
complexity: low
read_only: true
version: 0.2.0
```
