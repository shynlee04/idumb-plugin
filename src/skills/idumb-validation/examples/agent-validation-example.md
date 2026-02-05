# Agent Validation Example

## Scenario: Validating a New Agent

### Input: New Agent Profile

```markdown
---
description: "Project executor agent"
mode: all
permission:
  task:
    "general": allow
  bash:
    "npm test*": allow
  edit: deny
  write: deny
tools:
  read: true
  glob: true
  grep: true
---

# @idumb-executor

Executes project tasks by delegating to general agent.
```

### Validation Run

```yaml
validation_execution:
  phase_1_structure:
    file_exists: PASS
    valid_yaml: PASS
    required_fields:
      description: PASS
      mode: PASS
      permission: PASS
      tools: PASS

    forbidden_patterns:
      broad_denies: NONE_FOUND

  phase_2_integration:
    integration_points:
      reads_from: 3
      writes_to: 1
      validates_against: 0
      triggers: 1
      triggered_by: 2
      depends_on: 1
      blocks: 0
      relates_to: 1

    total: 9
    threshold: 15 (middle tier)
    met: false

    gaps:
      - "No validation against schemas"
      - "No state.json reads"
      - "No config reads"
      - "No TODO integration"
      - "Minimal tool connections"
      - "No anchor creation"
      - "No history logging"

  phase_3_behavior:
    workflow_verification: NEEDS_TESTING
    error_handling: NOT_DEFINED
    return_format: NOT_SPECIFIED

  phase_4_assessment:
    severity: HIGH
    fixable: true
    resolution: "Add missing integration points"
```

### Gap Resolution

```yaml
gap_resolution:
  add_reads_from:
    - source: ".idumb/brain/state.json"
      purpose: "Check current phase"

    - source: "todoread"
      purpose: "Check pending tasks"

    - source: "idumb-state_read"
      purpose: "Get governance state"

  add_writes_to:
    - target: "idumb-state_history"
      purpose: "Log execution"

    - target: "idumb-state_anchor"
      purpose: "Anchor completion"

  add_validates_against:
    - schema: "completion-definitions.yaml"
      enforcement: "check_exit_conditions"

  add_triggers:
    - action: "delegation_to_general"
      condition: "when task ready"

  update_tools:
    - add: "idumb-state: true"
    - add: "todoread: true"
    - add: "todowrite: true"

  update_return_format:
    add_section: |
      ## Return Format

      ```yaml
      execution:
        action: [what was done]
        files: [modified paths]
        status: success | partial | failed
        changes: [summary]
        evidence: [proof]
        next_action: [recommendation]
      ```
```

### Re-validation

```yaml
revalidation:
  integration_points:
    reads_from: 6
    writes_to: 3
    validates_against: 1
    triggers: 2
    triggered_by: 2
    depends_on: 2
    blocks: 1
    relates_to: 2

    total: 19
    threshold: 15
    met: true

  all_checks: PASS
  status: VALIDATED
```

---

## Key Takeaways

1. **Integration points matter**: 9 → 19 after adding connections
2. **Gaps are specific**: Each missing connection is identified
3. **Resolution is actionable**: Clear fixes provided
4. **Re-validation confirms**: Threshold met after fixes
