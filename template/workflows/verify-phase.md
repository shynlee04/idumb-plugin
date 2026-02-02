---
name: verify-phase
description: "Validates phase completion through goal-backward analysis and evidence collection"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Verify Phase Workflow

Performs comprehensive verification that a phase achieved its goals. Uses goal-backward analysis: starts from success criteria and works back to evidence.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - one_of:
        - exists: ".planning/phases/{N}/*SUMMARY.md"
        - state: "phaseStatus in ['executed', 'in_progress']"
  should_have:
    - exists: ".planning/phases/{N}/*PLAN.md"
    - exists: ".planning/phases/{N}/*CONTEXT.md"
  blocked_when:
    - condition: "!exists('.planning/phases/{N}/*') && state.phaseStatus != 'executing'"
      redirect: "/idumb:execute-phase {N}"
      message: "No execution evidence found"
```

## Workflow Steps

```yaml
workflow:
  name: verify-phase
  interactive: false  # Validation agent driven
  
  steps:
    1_load_criteria:
      action: "Extract success criteria from artifacts"
      sources:
        - ".planning/phases/{N}/*CONTEXT.md" → success_criteria section
        - ".planning/phases/{N}/*PLAN.md" → success_criteria section
        - ".planning/ROADMAP.md" → phase deliverables
      output: criteria_list
      
    2_load_evidence:
      action: "Gather execution evidence"
      sources:
        - ".planning/phases/{N}/*SUMMARY.md" → completed tasks
        - ".idumb/execution/{N}/checkpoints/" → task validations
        - "git log --since={phase_start}" → commits (if git)
      output: evidence_bundle
      
    3_spawn_validator:
      agent: "idumb-low-validator"
      mode: "goal-backward"
      task: |
        For each criterion in criteria_list:
        1. Identify what evidence would prove it
        2. Search for that evidence in codebase
        3. Rate: PASS (clear evidence), PARTIAL (some evidence), FAIL (no evidence)
        Report findings with file:line citations.
      output: validation_results
      
    4_cross_check:
      action: "Cross-reference with plan"
      checks:
        - "All plan tasks marked complete have validation evidence"
        - "Success criteria coverage >= 80%"
        - "No critical tasks failed without resolution"
      output: cross_check_results
      
    5_generate_artifact:
      action: "Create verification report"
      template: "templates/verification.md"
      output: ".planning/phases/{N}/*VERIFICATION.md"
      
    6_make_decision:
      action: "Determine phase status"
      rules:
        - if: "all criteria PASS"
          then: "phase = complete"
        - if: "any criteria FAIL and critical"
          then: "phase = needs_work"
        - if: "mostly PASS with minor PARTIAL"
          then: "phase = complete_with_notes"
          
    7_update_state:
      action: "Update iDumb state"
      updates:
        - "state.phaseStatus = {decision}"
        - "state.lastValidation = {timestamp}"
        - "history += 'verify-phase:{N}:{decision}'"
```

## Goal-Backward Analysis

```yaml
goal_backward:
  description: |
    Instead of checking "did we complete tasks?", we check 
    "does the codebase now satisfy the goals?".
    
  process:
    1_extract_goals:
      - "What did this phase promise to deliver?"
      - "What state should the codebase be in?"
      
    2_define_evidence:
      - "For each goal, what file/pattern/test proves it?"
      - "What would we grep for? What tests would pass?"
      
    3_search_evidence:
      - "Run grep/glob/test commands"
      - "Collect file:line citations"
      
    4_evaluate:
      - "Is evidence sufficient?"
      - "Any contradicting evidence?"
      
  scoring:
    PASS: "Clear, unambiguous evidence found"
    PARTIAL: "Some evidence but incomplete"
    FAIL: "No evidence or contradicting evidence"
    BLOCKED: "Cannot verify (missing access, etc.)"
```

## Output Artifact

```yaml
artifact:
  name: "{phase-name}-VERIFICATION.md"
  path: ".planning/phases/{N}/"
  template: "templates/verification.md"
  frontmatter:
    type: verification
    phase: "{N}"
    status: "{complete|needs_work|blocked}"
    created: "{timestamp}"
    validator: idumb-low-validator
    pass_rate: "{percentage}"
    criteria_count: "{total}"
  sections:
    - summary: "Overall verification result"
    - criteria_results:
        format: "table"
        columns: [criterion, status, evidence, notes]
    - evidence_citations: "File:line references"
    - gaps: "What was not verified or failed"
    - recommendations: "Next steps if incomplete"
```

## Validation Methods

```yaml
validation_methods:
  file_exists:
    check: "Does expected file exist?"
    command: "test -f {path}"
    
  pattern_present:
    check: "Does code contain expected pattern?"
    command: "grep -r '{pattern}' {scope}"
    
  test_passes:
    check: "Do relevant tests pass?"
    command: "npm test -- --grep '{filter}'"
    fallback: "Skip if no test runner"
    
  no_regressions:
    check: "Did we break existing functionality?"
    command: "npm test"
    fallback: "Manual review"
    
  documentation_updated:
    check: "Is README/docs current?"
    command: "grep -l '{feature}' *.md docs/"
```

## Exit Conditions

```yaml
exit_conditions:
  verified:
    - pass_rate: ">= 80%"
    - no_critical_fails: true
    - artifact_created: ".planning/phases/{N}/*VERIFICATION.md"
  needs_work:
    - pass_rate: "< 80%"
    - or: "critical criteria failed"
  blocked:
    - validator_failed: true
    - or: "cannot access required evidence"
```

## Chain Rules

```yaml
chains_to:
  on_verified:
    command: "transition.md"  # Internal workflow
    action: "Mark phase complete, update roadmap status"
    message: "Phase {N} verified. Proceeding to next phase."
    
  on_needs_work:
    options:
      - execute: "Return to /idumb:execute-phase for fixes"
      - accept: "Accept with known gaps"
      - debug: "Launch /idumb:debug"
      
  on_blocked:
    command: "/idumb:debug"
    message: "Verification blocked. Debug?"
```

## Integration Points

```yaml
integration:
  reads_from:
    - ".planning/phases/{N}/*"
    - ".idumb/execution/{N}/"
    - "Entire codebase (for evidence)"
  writes_to:
    - ".planning/phases/{N}/*VERIFICATION.md"
    - ".idumb/brain/state.json"
  never_modifies:
    - "Source code"
    - "Other .planning/ files"
```

---
*Workflow: verify-phase v0.1.0*
