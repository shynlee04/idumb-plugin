# Mindfulness Protocols Reference

Advanced orchestration patterns for maintaining delegation integrity and context awareness.

## Protocol 1: Pre-Delegation Checklist

Before ANY delegation, verify:

```yaml
position_assessment:
  - "Read .idumb/brain/state.json"
  - "Identify current phase"
  - "Check delegation depth (< 5)"
  - "Verify agent role matches permissions"
  - "Confirm target is valid child in hierarchy"

context_assessment:
  - "Check session lifecycle state"
  - "Verify governance level settings"
  - "Review active anchors (critical/high)"
  - "Assess context window saturation"

target_validation:
  - "Target is exactly one level below"
  - "Target has required permissions"
  - "Delegation has not been made before"
  - "Return path is clear"
```

## Protocol 2: Delegation Structuring

### Required Delegation Format

```yaml
minimum_delegation:
  agent: "[valid child agent]"
  task: "[clear description of what to do]"

recommended_delegation:
  agent: "[valid child agent]"
  task: "[clear description]"
  context:
    phase: "[from state.json]"
    state_snapshot: "[relevant state]"
    anchors: "[critical anchors for context]"
  requirements:
    constraints: "[what cannot be done]"
    permissions: "[what tools are allowed]"
    deliverable: "[expected return format]"
  tracking:
    delegation_id: "[unique identifier]"
    parent_session: "[for traceability]"
    timeout: "[max duration for subtask]"

comprehensive_delegation:
  agent: "[valid child agent]"
  task: "[clear description]"
  context:
    phase: "[from state.json]"
    state_snapshot: "[full relevant state]"
    anchors: "[all applicable anchors]"
    history: "[relevant recent actions]"
    previous_results: "[if this is a retry]"
  requirements:
    constraints: "[complete list of restrictions]"
    permissions: "[explicit tool allowlist]"
    deliverable: "[detailed expected format]"
    acceptance_criteria: "[how to validate success]"
  tracking:
    delegation_id: "[unique identifier]"
    parent_session: "[for traceability]"
    checkpoint_before: "[create checkpoint before risky action]"
    timeout: "[max duration]"
    max_retries: "[number of retry attempts]"
  mindfulness:
    stall_indicators: "[what indicates a loop]"
    context_limit: "[when to checkpoint]"
    escalation: "[when to return to parent]"
```

## Protocol 3: Return Validation

### Acceptable Return Formats

```yaml
minimum_return:
  status: "pass | fail | partial"
  delegation_id: "[matching request]"

standard_return:
  status: "pass | fail | partial"
  delegation_id: "[matching request]"
  evidence: "[what was verified]"
  actions_taken: "[list of operations]"
  files_modified: "[if applicable]"

comprehensive_return:
  status: "pass | fail | partial"
  delegation_id: "[matching request]"
  evidence: "[complete verification details]"
  actions_taken: "[full operation list]"
  files_modified: "[with paths and reasons]"
  metrics:
    duration: "[time taken]"
    iterations: "[if applicable]"
    errors: "[any errors encountered]"
  next_action: "[recommended continuation]"
  checkpoints: "[any checkpoints created]"
  new_anchors: "[any anchors to create]"
```

### Return Validation Checklist

```yaml
validation_checks:
  - "delegation_id matches request"
  - "status is valid (pass/fail/partial)"
  - "evidence is provided"
  - "actions are within permissions"
  - "files modified are within scope"
  - "next_action is appropriate"
```

## Protocol 4: Stall Detection

### Stall Indicators

```yaml
delegation_stall:
  - "Same agent spawned 3+ times consecutively"
  - "Delegation depth > 5"
  - "Same task delegated repeatedly without progress"
  - "No status change after 5 iterations"

validation_stall:
  - "Same error occurs 3+ times"
  - "Validation score not improving"
  - "Issues hash repeating"

context_stall:
  - "Context window > 90% full"
  - "Compaction imminent"
  - "Anchors being lost"
```

### Stall Response Protocol

```yaml
on_stall_detected:
  1: "Log stall with evidence"
  2: "Return to parent agent"
  3: "Report stall pattern"
  4: "Suggest alternative approach"
  5: "Never auto-fix stall"

stall_report_format:
  stall_type: "[delegation | validation | context]"
  indicator: "[what triggered detection]"
  evidence: "[pattern details]"
  suggested_alternatives: "[list of alternatives]"
  require_user_input: "[if no clear path]"
```

## Protocol 5: Context Management

### Pre-Compaction Checklist

```yaml
before_context_full:
  - "Anchor all critical decisions"
  - "Summarize current state"
  - "Document next steps"
  - "Ensure state.json is current"
  - "Create checkpoint if needed"

compaction_injection:
  - "Current phase and framework"
  - "Critical and high-priority anchors"
  - "Recent action history (last 5)"
  - "Pending TODOs"
  - "Current delegation chain depth"
```

### Context Window Thresholds

```yaml
context_levels:
  healthy: "< 60% full"
  monitor: "60-80% full"
  critical: "80-90% full"
  imminent: "> 90% full"

actions:
  healthy: "Normal operation"
  monitor: "Consider checkpoint"
  critical: "Create checkpoint, prepare anchors"
  imminent: "Force checkpoint, minimize new context"
```

## Protocol 6: Error Recovery

### Chain Break Recovery

```yaml
on_chain_violation:
  1: "Identify break point in chain"
  2: "Log violation with full evidence"
  3: "Determine violation severity"
  4: "Apply appropriate action (block/redirect/warn)"
  5: "Offer remediation options"

remediation_options:
  - "Run prerequisite command"
  - "Override with --force (if allowed)"
  - "Create missing artifact"
  - "Return to parent agent"
  - "Request user guidance"
```

### Delegation Failure Recovery

```yaml
on_delegation_failure:
  transient_failure:  # Temporary issues
    attempts: 3
    backoff: "exponential"
    log: "each attempt"

  permanent_failure:  # Fundamental issues
    return: "to parent agent"
    evidence: "required"
    alternatives: "suggest if possible"

  timeout_failure:  # Took too long
    checkpoint: "create before timeout"
    return: "partial results"
    resume: "from checkpoint"
```

## Protocol 7: Session Transitions

### Phase Transition Protocol

```yaml
entering_new_phase:
  - "Verify previous phase complete"
  - "Create checkpoint for previous phase"
  - "Anchor key outcomes from previous phase"
  - "Update state.json with new phase"
  - "Inject new phase context"

resuming_after_break:
  - "Detect idle duration"
  - "Assess staleness level"
  - "Inject resume context"
  - "Verify phase alignment"
  - "Confirm TODOs still valid"
```

### Handoff Protocol

```yaml
creating_handoff:
  - "Summarize completed work"
  - "List pending items"
  - "Anchor critical decisions"
  - "Note current phase"
  - "Include next steps"

receiving_handoff:
  - "Read handoff document"
  - "Verify phase alignment"
  - "Check anchors still valid"
  - "Confirm TODOs priority"
  - "Acknowledge delegation chain"
```

## Protocol 8: Mindfulness Reminders

### Internal Checks

During orchestration, periodically ask:

```yaml
self_checks:
  position: "Where am I in the delegation chain?"
  context: "What session state am I operating in?"
  depth: "What is the current delegation depth?"
  phase: "What project phase is active?"
  anchors: "What critical context must survive?"
  next: "What is the immediate next action?"
  exit: "What is the return path if this fails?"
```

### External Signals

Watch for these external mindfulness triggers:

```yaml
trigger_signals:
  - "User provides new context (reassess)"
  - "User changes direction (create checkpoint)"
  - "User expresses confusion (clarify chain)"
  - "Multiple failures detected (halt and assess)"
  - "Context approaching limit (prepare for compaction)"
```

## Protocol 9: Governance Level Behavior

### Strict Mode

```yaml
strict_protocols:
  - "Block on any chain violation"
  - "Require all prerequisites met"
  - "No --force overrides allowed"
  - "Log all violations to chain.log"
  - "User confirmation for phase transitions"
```

### Standard Mode

```yaml
standard_protocols:
  - "Block on hard violations"
  - "Warn on soft violations"
  - "Allow --force for soft violations"
  - "Log violations to chain.log"
  - "Suggest but don't require confirmation"
```

### Minimal Mode

```yaml
minimal_protocols:
  - "Log all violations"
  - "Never block"
  - "Warn on violations"
  - "Preserve chain.log for audit"
  - "User fully responsible for integrity"
```
