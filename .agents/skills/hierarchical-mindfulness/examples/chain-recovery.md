# Chain Recovery Example

Recovering from chain violations with proper enforcement and remediation.

## Scenario 1: HARD_BLOCK Violation

### Violation Detection

```yaml
attempted_command: "/idumb:execute-phase 2"
session_id: "ses_abc123"
timestamp: "2026-02-04T14:30:00Z"

chain_check:
  rule: "PHASE-01"
  command: "/idumb:execute-phase"
  must_before:
    - exists: ".planning/phases/02/*PLAN.md"

prerequisite_check:
  file_checked: ".planning/phases/02/*PLAN.md"
  exists: false

files_found:
  - ".planning/phases/02/CONTEXT.md"
  - ".planning/phases/02/RESEARCH.md"

violation: "PLAN.md required before execution"
```

### Enforcement Action

```yaml
action_type: "HARD_BLOCK"
cannot_proceed: true
user_override: false

block_message: |
  🚫 CHAIN ENFORCEMENT BLOCK 🚫

  Rule: PHASE-01
  Command: /idumb:execute-phase 2
  Action Type: HARD_BLOCK

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MISSING PREREQUISITES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ❌ Required file not found: .planning/phases/02/*PLAN.md

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOW TO SATISFY PREREQUISITES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📋 To satisfy: Create phase plan
  Command: /idumb:plan-phase 2
  Example: /idumb:plan-phase 2

  📖 See: src/router/chain-enforcement.md (PHASE-01)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IMMEDIATE ACTION REQUIRED
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PLAN.md required before execution. Creating plan first.

  👉 Redirect target: /idumb:plan-phase 2
     Run this command first, then retry: /idumb:execute-phase 2

  📖 Documentation: src/router/chain-enforcement.md
```

### Automated Redirect

```yaml
on_block:
  log_violation: ".idumb/brain/governance/chain.log"
  entry:
    timestamp: "2026-02-04T14:30:00Z"
    rule: "PHASE-01"
    command: "/idumb:execute-phase 2"
    violation: "PLAN.md not found"
    action: "redirected to /idumb:plan-phase 2"

auto_action: "Offer to run /idumb:plan-phase 2"
user_choice:
  - "Yes, create plan first (recommended)"
  - "Cancel and handle manually"
```

---

## Scenario 2: SOFT_BLOCK Violation

### Violation Detection

```yaml
attempted_command: "/idumb:roadmap"
session_id: "ses_def456"
timestamp: "2026-02-04T15:00:00Z"

chain_check:
  rule: "PROJ-01"
  command: "/idumb:roadmap"
  must_before:
    - exists: ".planning/PROJECT.md"

prerequisite_check:
  file_checked: ".planning/PROJECT.md"
  exists: false

violation: "PROJECT.md required for roadmap"
```

### Enforcement Action

```yaml
action_type: "SOFT_BLOCK"
cannot_proceed: true
user_override: true
override_flag: "--force"

block_message: |
  🚫 CHAIN ENFORCEMENT BLOCK 🚫

  Rule: PROJ-01
  Command: /idumb:roadmap
  Action Type: SOFT_BLOCK

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MISSING PREREQUISITES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ❌ Required file not found: .planning/PROJECT.md

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REMEDIATION OPTIONS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Run prerequisite command automatically:
     /idumb:new-project (recommended)

  2. Override with --force (not recommended):
     /idumb:roadmap --force

  3. Cancel operation

  💡 Tip: Use --force flag to override (not recommended for
     block-level violations. PROJECT.md provides essential
     project context for roadmap generation.)
```

### User Override Path

```yaml
if_user_selects_override:
  flag_provided: "--force"
  log_override: true
  warning: |
    ⚠️ CHAIN OVERRIDE DETECTED

    Continuing without PROJECT.md may result in:
    - Incomplete roadmap context
    - Missing project goals
    - Unclear milestones

    Document created will need manual review.

  execute: "/idumb:roadmap --force"
  record: "User overrode PROJ-01 at 2026-02-04T15:05:00Z"
```

---

## Scenario 3: WARN Violation

### Violation Detection

```yaml
attempted_command: "/idumb:execute-phase 3"
session_id: "ses_ghi789"
timestamp: "2026-02-04T15:30:00Z"

chain_check:
  rule: "PHASE-02"
  command: "/idumb:execute-phase"
  should_before:
    - exists: ".planning/phases/03/*CONTEXT.md"

prerequisite_check:
  file_checked: ".planning/phases/03/*CONTEXT.md"
  exists: false

found_files:
  - ".planning/phases/03/*PLAN.md"
  - ".planning/phases/03/*SUMMARY.md"

violation: "CONTEXT.md recommended but not found"
```

### Enforcement Action

```yaml
action_type: "WARN"
cannot_proceed: false
continue: true

warning_message: |
  ⚠️ CHAIN ENFORCEMENT WARNING ⚠️

  Rule: PHASE-02
  Action Type: WARN

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RECOMMENDED PREREQUISITES MISSING
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ⚠️ No CONTEXT.md found. Recommend /idumb:discuss-phase first.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RECOMMENDED ACTIONS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📋 To satisfy: Discuss phase context
  Command: /idumb:discuss-phase 3
  Example: /idumb:discuss-phase 3

  📖 See: src/router/chain-enforcement.md (PHASE-02)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONTINUING WITH WARNING
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️ This is a WARNING - execution will continue.
     However, following the recommendations above is advised.

  📖 Documentation: src/router/chain-enforcement.md

execution: "Continues with /idumb:execute-phase 3"
log: "WARNING issued for PHASE-02 at 2026-02-04T15:30:00Z"
```

---

## Scenario 4: Delegation Loop Detection

### Loop Detection

```yaml
session_id: "ses_loop123"
timestamp: "2026-02-04T16:00:00Z"

detected_pattern:
  same_agent_spawned: "@idumb-low-validator"
  spawn_count: 4
  time_window: "2 minutes"

delegation_chain:
  0: "user → @idumb-supreme-coordinator"
  1: "@idumb-supreme-coordinator → @idumb-high-governance"
  2: "@idumb-high-governance → @idumb-low-validator (attempt 1)"
  3: "@idumb-low-validator → @idumb-high-governance (returned with partial)"
  4: "@idumb-high-governance → @idumb-low-validator (attempt 2)"
  5: "@idumb-low-validator → @idumb-high-governance (returned with partial)"
  6: "@idumb-high-governance → @idumb-low-validator (attempt 3)"
  7: "DEPTH LIMIT EXCEEDED"

stall_indicators:
  - "Same agent spawned 3+ times consecutively"
  - "No progress after 5 iterations"
  - "Partial results repeating"
```

### Loop Response

```yaml
action: "HALT DELEGATION"
message: |
  🔄 DELEGATION LOOP DETECTED 🔄

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LOOP INDICATORS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Agent: @idumb-low-validator
  Spawn Count: 4 times in 2 minutes
  Pattern: Repeated partial results

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ANALYSIS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The same agent is being spawned repeatedly
  without progress. This indicates:

  • Validator cannot complete with current constraints
  • Requirements may be unclear or conflicting
  • Different approach may be needed

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RECOMMENDED ACTIONS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Return to parent agent (@idumb-high-governance)
  2. Review and refine requirements
  3. Consider alternative validation approach
  4. Request user guidance if unclear

  This delegation chain has been halted.
  Manual intervention required.

action_taken:
  - "Delegation halted at depth 3"
  - "Return to @idumb-high-governance"
  - "Log stall to session history"
  - "Request user or parent assessment"
```

### Recovery Protocol

```yaml
recovery_steps:
  1: "Log loop with evidence"
  2: "Return to parent agent (high-governance)"
  3: "Report pattern: validator cannot complete"
  4: "Suggest alternatives:"
     - "Refine validation criteria"
     - "Break into smaller tasks"
     - "Request user input on unclear requirements"
  5: "Never auto-fix loop"

evidence_to_log:
  - "Loop pattern: validator spawned 4x"
  - "Time window: 2 minutes"
  - "Result pattern: partial repeated"
  - "Session: ses_loop123"
```

---

## Key Mindfulness Elements

1. **Severity Awareness**: Different actions for HARD_BLOCK vs SOFT_BLOCK vs WARN
2. **Clear Messaging**: Structured messages explain the violation and remediation
3. **User Choice**: Appropriate options based on severity
4. **Evidence Logging**: All violations logged for audit
5. **Loop Detection**: Recognizes and halts infinite delegation loops
