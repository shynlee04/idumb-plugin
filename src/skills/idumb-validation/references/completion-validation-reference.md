# Completion-Driven Validation Reference

How the validation skill enforces completion-driven principles from `completion-definitions.yaml`.

## Core Principle

```yaml
principle: |
  A workflow is complete when its PURPOSE is achieved, not when a counter expires.
  If progress stalls, ESCALATE to the user with full context.
  NEVER silently give up or produce half-assed results.
```

## Mapping Validation to Completion Definitions

### Command Workflows

| Command | Completion Criteria | Validation Check |
|---------|---------------------|------------------|
| `/idumb:init` | state.json exists AND is valid | Structure + Schema validation |
| `/idumb:new-project` | PROJECT.md has all required sections | Document validation |
| `/idumb:map-codebase` | At least 1 file analyzed | Evidence validation |
| `/idumb:research` | Synthesis exists with recommendations | Output validation |
| `/idumb:roadmap` | No circular dependencies | Graph validation |
| `/idumb:plan-phase` | Plan checker returns PASS | Integration validation |
| `/idumb:execute-phase` | All tasks complete or blocked | State validation |
| `/idumb:verify-work` | All criteria checked with evidence | Evidence validation |
| `/idumb:debug` | Root cause identified OR user satisfied | Resolution validation |
| `/idumb:validate` | All checks executed | Meta-validation |

### Agent Loops

| Loop | Exit Condition | Validation Check |
|------|---------------|------------------|
| planner_checker | plan.status == PASS | Iteration validation |
| validator_fix | task.verified == true | Fix validation |
| research_synthesis | All researchers incorporated | Integration validation |
| delegation | Result received with status | Delegation tracking |

## Prohibited Patterns

The validation skill actively detects and rejects:

```yaml
prohibited_patterns:
  - pattern: "max_iterations: N"
    detection: "grep for 'max_iterations' in workflows"
    severity: "critical"
    fix: "Replace with exits_when conditions"

  - pattern: "max_retries: N"
    detection: "grep for 'max_retries' in code"
    severity: "high"
    fix: "Replace with stall_detection (same error 3 times)"

  - pattern: "timeout as EXIT criteria"
    detection: "check if timeout only prevents infinite loop"
    severity: "medium"
    fix: "Add exits_when with measurable conditions"

  - pattern: "arbitrary limits"
    detection: "max_X where X is guessed not measured"
    severity: "medium"
    fix: "Define completion based on actual goal"
```

## Stall Detection Implementation

### Output Hash Unchanged

```typescript
// Example validation implementation
function detectStall(output: string, history: string[]): boolean {
  const currentHash = sha256(output)
  const recentHashes = history.slice(-2)
  return recentHashes.every(h => h === currentHash)
}
```

### No Progress Signal

```typescript
function hasProgress(metrics: {
  filesCreated: number
  tasksCompleted: number
  criteriaChecked: number
}): boolean {
  return Object.values(metrics).some(v => v > 0)
}
```

### Error Repetition

```typescript
function sameErrorRepeating(errors: Error[], count: number = 3): boolean {
  const sigs = errors.slice(-count).map(e =>
    sha256(e.message + e.stack)
  )
  return new Set(sigs).size === 1
}
```

## Completion Evidence Requirements

### Every Completion Must Have

```yaml
required_evidence:
  artifact:
    - "Measurable output proving work done"
    - "File path and content verification"

  state_update:
    - "state.json reflects new status"
    - "History entry logged"

  history_entry:
    - "Action logged with timestamp"
    - "Result status recorded"
```

### Per-Workflow Evidence

```yaml
init_evidence:
  - ".idumb/brain/state.json exists and valid"
  - ".idumb/brain/config.json exists and valid"

research_evidence:
  - ".idumb/brain/governance/research/*-*.md exists"
  - "synthesis section with recommendations"

roadmap_evidence:
  - ".planning/ROADMAP.md with phases"
  - "no circular dependencies (acyclic graph)"

execute_phase_evidence:
  - ".planning/phases/{N}/*SUMMARY.md"
  - ".idumb/brain/execution/{N}/progress.json"
  - "all tasks resolved"
```

## Validation Skill Integration

### How to Use

```yaml
workflow:
  1. "Load this skill when starting any validation work"
  2. "Follow the iterative-validation.md workflow"
  3. "Use integration-matrix-template.yaml for documentation"
  4. "Check examples/ for patterns to follow"

validation_commands:
  - "/idumb:validate"
  - "Use idumb-validate tool with scope parameter"
  - "Read validation reports from .idumb/brain/governance/"
```

### Exit Criteria Validation

```yaml
exit_criteria_validation:
  for_each_workflow:
    check:
      - "Has exits_when section?"
      - "Exits are measurable (all_true, any_true)?"
      - "Has stall_detection section?"
      - "Has on_complete evidence requirements?"
      - "No prohibited patterns present?"

    if_fail:
      severity: "high"
      fix: "Add missing completion definition"
      template: "See completion-definitions.yaml for examples"
```

## Quick Reference

### When Validation Completes

| Component | Completes When | Measurement |
|-----------|----------------|-------------|
| Agent validation | All checks pass + threshold met | Count + status |
| Tool validation | All exports work + threshold met | Count + tests |
| Command validation | Prerequisites checked + threshold met | Count + run |
| Workflow validation | exits_when satisfied + no stalls | Conditions met |

### When Validation Stalls

| Condition | Detection | Action |
|-----------|-----------|--------|
| Same output | Hash unchanged 3x | Escalate |
| No progress | Metrics unchanged 2x | Present options |
| Same error | Error signature 3x | Change approach |
| Deadlock | Circular dependency | Break cycle |

## See Also

- `../../config/completion-definitions.yaml` - Complete completion definitions
- `iterative-validation.md` - Full validation workflow
- `integration-points-reference.md` - Integration counting guide
