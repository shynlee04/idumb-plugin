# Iterative Validation Workflow

**Purpose:** Execute completion-driven validation with iterative gap detection and resolution.

## Workflow Steps

### Step 1: Initial Assessment

```yaml
step: initial_assessment
tool: idumb-validate
scope: all
output: save to .idumb/governance/initial-assessment-{timestamp}.json

checks:
  - structure: "All files exist in correct locations"
  - schemas: "All artifacts match their schemas"
  - integration: "All components meet integration thresholds"
  - behavior: "All components work as intended"

on_complete:
  if: overall == "pass"
  then: "exit with SUCCESS report"
  else: "proceed to gap classification"
```

### Step 2: Gap Classification

```yaml
step: classify_gaps
input: initial_assessment results

for_each_gap:
  assess:
    severity: "critical | high | medium | low"
    tier: "highest | middle | lowest"
    component_type: "agent | tool | command | workflow | schema | config"

  categorize:
    structure_gap: "missing file, field, or format"
    integration_gap: "below threshold, missing connection"
    behavior_gap: "doesn't work as intended"
    documentation_gap: "incomplete or missing docs"

  prioritize:
    critical_structure: "fix immediately (blocks everything)"
    critical_integration: "fix immediately (blocks dependencies)"
    high_gaps: "fix in order of dependency"
    medium_gaps: "fix if time permits"
    low_gaps: "document for later"

output: gap-classification-{timestamp}.json
```

### Step 3: Resolution Planning

```yaml
step: plan_resolution
input: gap_classification

for_each_fixable_gap:
  plan:
    fix_type: "auto_fix | delegation_required | user_input_required"

    auto_fix:
      - "Add missing required field"
      - "Remove forbidden pattern"
      - "Fix syntax error"
      - "Add missing integration point"

    delegation_required:
      - delegate_to: "idumb-builder"
      task: "structural fix"
      - delegate_to: "idumb-high-governance"
      task: "coordination"

    user_input_required:
      - "Policy decision needed"
      - "Breaking change approval"
      - "Scope definition required"

create_resolution_plan:
  ordered_by: "dependency_graph"
  parallel_where: "no_dependencies"
  sequential_where: "has_dependencies"

output: resolution-plan-{timestamp}.md
```

### Step 4: Execute Resolution

```yaml
step: execute_resolution
input: resolution_plan

for_each_fix:
  execute:
    - apply_fix
    - validate_single_component
    - check_for_regressions
    - update_gap_status

stall_detection:
  trigger: "same fix attempted 3 times without success"
  action: "mark as unfixable, escalate"

trigger: "no progress for 2 iterations"
  action: "present partial, request guidance"

progress_tracking:
  total_gaps: "initial count"
  fixed_gaps: "count of resolved"
  remaining_gaps: "count of pending"
  blocked_gaps: "count of stuck"
```

### Step 5: Final Verification

```yaml
step: final_verification
input: execution_results

checks:
  - "All critical gaps: resolved"
  - "All high gaps: resolved or documented"
  - "Integration thresholds: met"
  - "No regressions: confirmed"
  - "Evidence: collected"

on_pass:
  generate: "validation-success-report-{timestamp}.md"
  update: ".idumb/brain/state.json"
  anchor: "validation_complete"
  exit: "SUCCESS"

on_fail:
  generate: "validation-partial-report-{timestamp}.md"
  document: "remaining_gaps"
  options:
    - "Accept partial: continue with known gaps"
    - "Continue fixing: iterate again"
    - "Escalate: request user guidance"
```

## Stall Detection Protocols

### When to Detect Stall

```yaml
stall_triggers:
  same_output_3_cycles:
      detection: "hash(validation_output) unchanged"
      action: "escalate"

  no_progress_2_cycles:
      detection: "gap_count not reduced"
      action: "present options"

  fix_failure_3_times:
      detection: "same fix, same error"
      action: "mark unfixable"

  dependency_deadlock:
      detection: "A needs B, B needs A"
      action: "present deadlock"
```

### Escalation Template

```markdown
## Validation Stall Report

**Workflow:** iterative-validation
**Cycle:** {{cycle_number}}
**Stall Reason:** {{stall_trigger}}

### Progress Made
{{completed_steps}}

### Remaining Gaps
{{gaps_by_severity}}

### Partial Results
{{what_works}}

### Options
1. **Accept partial:** {{what_you_get}}
2. **Provide guidance:** {{what_would_help}}
3. **Continue iteration:** {{focus_areas}}
4. **Escalate:** {{additional_context_needed}}
```

## Exit Criteria

```yaml
exits_when:
  all_true:
    - condition: "structure_checks.all == pass"
    - condition: "integration_thresholds.all == met"
    - condition: "behavior_checks.all == pass"
    - condition: "critical_gaps.count == 0"
    - condition: "high_gaps.count == 0 OR documented == true"

acceptable_exit:
  condition: "medium_gaps.count > 0"
  requires: "user_acknowledgement"
  documentation: "gap_report_with_resolution_paths"

never_exit_when:
  - "critical_gaps remain unaddressed"
  - "integration_thresholds not met"
  - "no documentation of gaps"
```

## Evidence Requirements

Every validation cycle must produce:

```yaml
evidence_artifacts:
  initial_assessment: ".idumb/governance/initial-{timestamp}.json"
  gap_classification: ".idumb/governance/gaps-{timestamp}.json"
  resolution_plan: ".idumb/governance/plan-{timestamp}.md"
  execution_log: ".idumb/governance/execution-{timestamp}.json"
  final_report: ".idumb/governance/report-{timestamp}.md"

report_sections:
  - "Executive Summary"
  - "Validation Results by Category"
  - "Gaps Identified"
  - "Fixes Applied"
  - "Remaining Issues"
  - "Integration Point Summary"
  - "Recommendations"
```
