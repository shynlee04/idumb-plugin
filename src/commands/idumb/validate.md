---
description: "Run full validation hierarchy - checks governance state, context integrity, and planning alignment"
id: cmd-validate
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:validate

<objective>
Execute the complete validation hierarchy to verify governance integrity. Check directory structure, validate JSON schemas, verify anchor freshness, detect stale context, and ensure planning alignment. Update governance state with validation results and create anchors for any critical findings.
</objective>

<context>

## Usage

```bash
/idumb:validate [scope] [--fix] [--report-only]
```

## Arguments

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `scope` | enum | Which validations to run | `all` |
| `--fix` | flag | Attempt auto-fix for issues | `false` |
| `--report-only` | flag | Report without updating state | `false` |

## Scope Options

| Scope | Validates |
|-------|-----------|
| `all` | Complete validation suite |
| `structure` | Directory and file presence |
| `schema` | JSON validity and required fields |
| `freshness` | Context age < 48 hours |
| `alignment` | Planning state matches iDumb state |
| `integrity` | No corrupted or inconsistent data |

## Validation Levels

| Level | What It Checks | Severity |
|-------|----------------|----------|
| **Structure** | Files and directories exist | Critical |
| **Schema** | JSON valid, required fields present | Critical |
| **Freshness** | Context not stale (< 48h) | Warning |
| **Alignment** | Planning and iDumb in sync | Warning |
| **Integrity** | Data consistency, no corruption | Critical |

</context>

<process>

## Step 1: Initialize Validation

Prepare validation context and log start.

```bash
# Create validation report directory
mkdir -p .idumb/idumb-brain/governance/validations

# Generate report ID
REPORT_ID="validation-$(date +%Y%m%d-%H%M%S)"
```

```
Use tool: idumb-state_history

action: "validation:started"
result: "pending"
```

## Step 2: Delegate to High Governance

Route validation to the governance layer.

```
Delegate to: @idumb-high-governance

Task: Execute full governance validation
Scope: <user-specified or "all">

Requirements:
  - Validate .idumb/ structure integrity
  - Validate state.json schema
  - Validate config.json schema
  - Validate anchor freshness
  - Check for stale context (>48h)
  - If planning artifacts: validate alignment with .planning/
  
Report: Detailed validation results per check
```

## Step 3: Structure Validation

Verify all required directories and files exist.

```
Use tool: idumb-validate_structure

Checks:
  directories:
    - .idumb/
    - .idumb/idumb-brain/
    - .idumb/idumb-brain/history/
    - .idumb/idumb-brain/context/
    - .idumb/idumb-brain/governance/
    - .idumb/idumb-brain/governance/validations/
    - .idumb/idumb-brain/anchors/
    - .idumb/idumb-brain/sessions/
    - .idumb/idumb-project-output/
    
  files:
    - .idumb/idumb-brain/state.json
    - .idumb/idumb-brain/config.json
```

**Structure Check Logic:**
```yaml
for_each: required_path
  if: not_exists
    severity: critical
    message: "Missing: {path}"
    fix: "mkdir -p {path}" or "touch {path}"
  else:
    status: pass
```

## Step 4: Schema Validation

Validate JSON files have required fields.

```
Use tool: idumb-validate_schema

For state.json:
  required_fields:
    - version (string)
    - initialized (ISO-8601)
    - framework (enum: planning|bmad|custom|none)
    - phase (string)
    - lastValidation (ISO-8601 or null)
    - validationCount (number)
    - anchors (array)
    - history (array)

For config.json:
  required_fields:
    - version (string)
    - user (object)
    - user.experience (enum: pro|guided|strict)
    - hierarchy (object)
    - automation (object)
```

**Schema Check Logic:**
```yaml
for_each: json_file
  parse: JSON.parse(content)
  if: parse_error
    severity: critical
    message: "Invalid JSON: {file}"
  else:
    for_each: required_field
      if: field_missing
        severity: critical
        message: "Missing field: {field} in {file}"
      if: field_wrong_type
        severity: high
        message: "Wrong type: {field} expected {type}, got {actual}"
```

## Step 5: Freshness Validation

Check for stale context (> 48 hours).

```
Use tool: idumb-validate_freshness

maxAgeHours: 48

Check paths:
  - .idumb/idumb-brain/context/*
  - .idumb/idumb-brain/governance/*
  - .idumb/idumb-brain/anchors/*
```

**Freshness Check Logic:**
```bash
# Find stale files
STALE_FILES=$(find .idumb/idumb-brain -type f -mtime +2)

if [ -n "$STALE_FILES" ]; then
  echo "WARNING: Stale files detected"
  echo "$STALE_FILES"
fi
```

## Step 6: Planning Alignment Validation

If planning framework detected, check alignment.

```
Use tool: idumb-validate_planningAlignment

Check:
  - .planning/ directory exists
  - Current phase in STATE.md matches state.json phase
  - Roadmap exists if roadmap-related anchors exist
  - No conflicting state between systems
```

**Alignment Check Logic:**
```yaml
if: .planning/ exists
  compare:
    planning_phase: extract from .planning/STATE.md
    idumb_phase: state.json.phase
    
  if: mismatch
    severity: warning
    message: "Phase mismatch: planning={planning}, idumb={idumb}"
    recommendation: "Sync with /idumb:config_sync"
```

## Step 7: Integrity Validation

Check for data corruption and consistency.

```
Use tool: idumb-validate_integrationPoints

Checks:
  - Anchor IDs are unique
  - History timestamps are chronological
  - References between files are valid
  - No orphaned files
```

## Step 8: Synthesize Results

Combine all validation results.

```yaml
validation_synthesis:
  aggregate:
    - structure_result
    - schema_result
    - freshness_result
    - alignment_result
    - integrity_result
    
  determine_overall:
    if: any_critical_fail → "fail"
    elif: any_warning → "warning"
    else → "pass"
    
  group_issues:
    critical: [list]
    high: [list]
    warning: [list]
    info: [list]
```

## Step 9: Apply Fixes (if --fix)

If `--fix` flag provided, attempt auto-repairs.

```yaml
auto_fix:
  missing_directories:
    action: "mkdir -p {path}"
    
  missing_files:
    action: "Initialize with defaults"
    
  stale_context:
    action: "Archive to .idumb/idumb-brain/history/"
    
  schema_issues:
    action: "Add missing fields with defaults"
    requires: --fix flag
```

## Step 10: Update State

Record validation results in governance state.

```
Use tool: idumb-state_write

lastValidation: <ISO-8601 timestamp>
incrementValidation: true
```

```
Use tool: idumb-state_history

action: "validation:completed"
result: "<pass|fail|warning>"
```

## Step 11: Create Report

Generate validation report file.

```
Delegate to: @idumb-builder

Task: Create validation report
Path: .idumb/idumb-brain/governance/validations/{REPORT_ID}.json
```

## Step 12: Anchor Critical Findings

If critical issues found, create anchors.

```
Use tool: idumb-state_anchor

For each critical finding:
  type: "validation"
  content: "<Issue description and fix>"
  priority: "critical"
```

</process>

<completion_format>

## Validation Report

```yaml
validation:
  id: validation-20260204-143000
  timestamp: "2026-02-04T14:30:00Z"
  scope: all
  overall: pass | warning | fail

checks:
  structure:
    status: pass
    details: "All directories and files present"
    issues: []
    
  schema:
    status: pass
    details: "state.json and config.json valid"
    issues: []
    
  freshness:
    status: warning
    details: "3 files older than 48h"
    stale_files:
      - path: ".idumb/idumb-brain/context/old-context.md"
        age: "72h"
      - path: ".idumb/idumb-brain/governance/old-report.json"
        age: "96h"
        
  alignment:
    status: pass
    details: "Planning and iDumb in sync"
    planning_phase: "phase-02"
    idumb_phase: "phase-02"
    
  integrity:
    status: pass
    details: "No corruption detected"
    issues: []

summary:
  total_checks: 5
  passed: 4
  warnings: 1
  failed: 0

critical_issues: []
warnings:
  - "3 files older than 48h - consider archiving"

recommendation:
  action: "Archive stale context files"
  priority: low
  command: "/idumb:validate --fix"
```

## Console Output

```
┌────────────────────────────────────────────────────────────────┐
│                    iDumb Validation Report                      │
├────────────────────────────────────────────────────────────────┤
│ Timestamp: 2026-02-04T14:30:00Z    Scope: all    Result: PASS  │
├────────────────────────────────────────────────────────────────┤
│ Checks                                                          │
│ ├── Structure:     ✓ pass                                       │
│ ├── Schema:        ✓ pass                                       │
│ ├── Freshness:     ⚠ warning (3 stale files)                    │
│ ├── Alignment:     ✓ pass                                       │
│ └── Integrity:     ✓ pass                                       │
├────────────────────────────────────────────────────────────────┤
│ Summary: 4 passed, 1 warning, 0 failed                          │
├────────────────────────────────────────────────────────────────┤
│ Warnings:                                                       │
│ └── 3 files older than 48h - consider archiving                 │
├────────────────────────────────────────────────────────────────┤
│ Recommendation: Run /idumb:validate --fix to auto-repair        │
├────────────────────────────────────────────────────────────────┤
│ Report: .idumb/idumb-brain/governance/validations/validation-*  │
└────────────────────────────────────────────────────────────────┘
```

## Failed Validation Output

```
┌────────────────────────────────────────────────────────────────┐
│                    iDumb Validation Report                      │
├────────────────────────────────────────────────────────────────┤
│ Timestamp: 2026-02-04T14:30:00Z    Scope: all    Result: FAIL  │
├────────────────────────────────────────────────────────────────┤
│ Checks                                                          │
│ ├── Structure:     ✗ FAIL                                       │
│ ├── Schema:        ✗ FAIL                                       │
│ ├── Freshness:     ⚠ warning                                    │
│ ├── Alignment:     - skipped (deps failed)                      │
│ └── Integrity:     - skipped (deps failed)                      │
├────────────────────────────────────────────────────────────────┤
│ Critical Issues:                                                │
│ ├── CRITICAL: Missing .idumb/idumb-brain/state.json             │
│ └── CRITICAL: Missing .idumb/idumb-brain/config.json            │
├────────────────────────────────────────────────────────────────┤
│ Fix Required: Run /idumb:init --repair                          │
└────────────────────────────────────────────────────────────────┘
```

</completion_format>

<success_criteria>

## Validation Execution Checklist

- [ ] Validation started event logged
- [ ] Structure validation completed
- [ ] Schema validation completed
- [ ] Freshness validation completed
- [ ] Alignment validation completed (if applicable)
- [ ] Integrity validation completed
- [ ] Results synthesized
- [ ] Fixes applied (if --fix flag)
- [ ] State updated with validation timestamp
- [ ] Validation count incremented
- [ ] Report file created
- [ ] Critical findings anchored
- [ ] Summary displayed to user

## Quality Criteria

- [ ] All checks have clear pass/fail/warning status
- [ ] Each failure has specific details
- [ ] Each issue has recommended fix
- [ ] Report is valid JSON
- [ ] History accurately reflects result

## Critical Rules

- [ ] ALWAYS delegate actual checks to @idumb-low-validator
- [ ] NEVER assume pass - require evidence
- [ ] Update state with validation results
- [ ] Anchor critical findings

## Verification

```bash
# Check validation recorded
cat .idumb/idumb-brain/state.json | jq '.lastValidation, .validationCount'

# Check report created
ls -la .idumb/idumb-brain/governance/validations/

# Check history updated
cat .idumb/idumb-brain/state.json | jq '.history[-1]'
```

</success_criteria>

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:status` | Quick health check |
| `/idumb:init --repair` | Fix structural issues |
| `/idumb:config` | View/edit configuration |

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → low-validator
                                             → builder (for reports)
```

**Validation Points:**
- Pre: iDumb must be initialized
- During: Each check produces evidence
- Post: State updated with results
- Post: Report file created

## Metadata

```yaml
category: governance
priority: P0
complexity: medium
state_modifying: true
version: 0.2.0
```
