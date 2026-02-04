---
name: auto-activation-hooks
description: "Reference for coordinator-driven auto-activation of validation hooks"
version: 1.0.0
---

# Auto-Activation Hooks Reference

<purpose>
This document defines the auto-activation hooks that allow the coordinator to automatically trigger validation at appropriate times. The coordinator decides between micro and batch validation based on conditions.
</purpose>

## Hook Categories

### 1. Session Hooks

```yaml
session_hooks:
  on_session_start:
    trigger: "OpenCode session begins"
    action: "/idumb:pre-flight --quick"
    mode: "micro"
    blocking: false
    conditions:
      - has_idumb: "test -d .idumb"
    purpose: "Ensure environment ready before work"
    
  on_session_end:
    trigger: "OpenCode session ends"
    action: "checkpoint current state"
    mode: "batch"
    blocking: false
    conditions:
      - has_uncommitted: "git status --porcelain | head -1"
    purpose: "Preserve state for next session"
```

### 2. File Event Hooks

```yaml
file_hooks:
  on_governance_file_change:
    trigger: "File modified in src/agents/, src/commands/, src/workflows/"
    action: "micro-validation of changed file"
    mode: "micro"
    blocking: false
    delay: "2 seconds"  # Debounce rapid saves
    conditions:
      - file_is_governance: "echo $FILE | grep -E 'src/(agents|commands|workflows)/'"
    purpose: "Catch issues immediately after edit"
    
  on_state_file_change:
    trigger: "state.json or config.json modified"
    action: "validate state consistency"
    mode: "micro"
    blocking: true  # State corruption is critical
    conditions:
      - always: true
    purpose: "Prevent state corruption"
```

### 3. Phase Transition Hooks

```yaml
phase_hooks:
  on_phase_transition:
    trigger: "Phase status changes (planned → executed → verified)"
    action: "/idumb:stress-test --batch"
    mode: "batch"
    blocking: true
    conditions:
      - phase_complete: "jq '.phase' .idumb/idumb-brain/state.json"
    purpose: "Ensure clean transition between phases"
    
  on_milestone_complete:
    trigger: "All phases in milestone verified"
    action: "/idumb:certify --level standard"
    mode: "full"
    blocking: true
    conditions:
      - milestone_boundary: true
    purpose: "Certify before major checkpoint"
```

### 4. Command Execution Hooks

```yaml
command_hooks:
  before_execute_phase:
    trigger: "/idumb:execute-phase invoked"
    action: "validate plan exists and is checked"
    mode: "micro"
    blocking: true
    conditions:
      - plan_exists: "test -f .planning/phases/{N}/*PLAN.md"
    purpose: "Prevent execution without valid plan"
    
  after_commit:
    trigger: "git commit successful"
    action: "/idumb:health-check --quick"
    mode: "batch"
    blocking: false
    conditions:
      - commit_includes_governance: "git diff HEAD~1 --name-only | grep -E 'src/(agents|commands)/'"
    purpose: "Verify commit didn't break governance"
```

### 5. Agent Spawning Hooks

```yaml
agent_hooks:
  on_agent_spawn:
    trigger: "Agent delegated to via task"
    action: "validate delegation chain"
    mode: "micro"
    blocking: false
    conditions:
      - depth_exceeded: "delegation_depth > 3"
    purpose: "Detect runaway delegation"
    
  on_builder_action:
    trigger: "Builder agent writes/edits file"
    action: "validate file in META scope"
    mode: "micro"
    blocking: true
    conditions:
      - file_outside_scope: "! echo $FILE | grep -E '^(\.idumb/|src/)'"
    purpose: "Enforce builder permissions"
```

## Coordinator Decision Matrix

```yaml
coordinator_decision:
  # When to use MICRO validation
  use_micro:
    - single_file_change: true
    - within_phase: true  # Not at boundary
    - recent_batch: "< 30 minutes ago"
    - low_risk_action: true
    - quick_feedback_needed: true
    
  # When to use BATCH validation
  use_batch:
    - multiple_files_changed: "> 3 files"
    - phase_transition: true
    - time_since_batch: "> 30 minutes"
    - commit_pending: true
    - high_risk_action: true
    
  # When to use FULL validation
  use_full:
    - milestone_complete: true
    - certification_required: true
    - major_refactor: true
    - release_prep: true
    - user_requests: "--full"
    
  # When to SKIP validation
  skip_when:
    - no_changes: true
    - very_recent_validation: "< 30 seconds"
    - read_only_action: true
    - user_overrides: "--no-validate"
```

## Hook Implementation Points

### In idumb-core.ts Plugin

```typescript
// Session start hook
hooks: {
  sessionStart: async (session) => {
    // Run pre-flight if iDumb initialized
    if (existsSync('.idumb/idumb-brain/state.json')) {
      await runMicroValidation('session_start');
    }
  },
  
  // Tool intercept hook
  toolCall: async (tool, args, context) => {
    // Validate builder permissions
    if (tool.name === 'write' || tool.name === 'edit') {
      if (context.agent?.includes('builder')) {
        await validateMetaScope(args.path);
      }
    }
    
    // Track delegation depth
    if (tool.name === 'task') {
      await validateDelegationChain(context);
    }
  },
  
  // File change hook (via watcher)
  fileChange: async (file) => {
    if (file.match(/src\/(agents|commands|workflows)\//)) {
      await scheduleValidation('micro', file);
    }
  }
}
```

### Validation Scheduler

```yaml
validation_scheduler:
  debounce:
    micro: "2 seconds"  # Wait for rapid saves to settle
    batch: "30 seconds"  # Coalesce multiple triggers
    
  priority:
    critical: "run immediately"  # State corruption, permission violation
    high: "run within 5 seconds"  # Phase transition, commit
    normal: "run within 30 seconds"  # File change, periodic
    low: "run when idle"  # Health check, cleanup
    
  concurrency:
    max_parallel: 1  # Only one validation at a time
    queue_overflow: "drop oldest"  # Keep most recent
```

## Integration with Continuous Validation

```yaml
continuous_integration:
  # How hooks feed into continuous validation workflow
  hook_to_workflow:
    session_start: "triggers continuous-validation with trigger=session"
    file_change: "triggers continuous-validation with trigger=file"
    phase_transition: "triggers continuous-validation with trigger=phase"
    commit: "triggers continuous-validation with trigger=commit"
    
  # Workflow determines final mode
  workflow_decides:
    input: "trigger type + conditions"
    output: "micro | batch | full | skip"
    
  # Results flow back to hooks
  results_to_hooks:
    pass: "allow action to continue"
    warn: "log warning, allow with flag"
    fail: "block if blocking=true, else warn"
```

## Non-Blocking Behavior

```yaml
non_blocking_principle:
  default: "warn but don't block"
  
  block_only_when:
    - critical_security_issue: true
    - governance_corruption: true
    - permission_violation: true
    - circular_delegation: true
    
  never_block:
    - style_warnings: true
    - integration_below_threshold: true
    - stale_context: true
    
  user_control:
    force: "--force bypasses warnings"
    strict: "--strict blocks on warnings"
    skip: "--no-validate skips validation"
```

## Example Hook Flows

### Flow 1: File Edit → Micro Validation

```
1. User edits src/agents/idumb-builder.md
2. File watcher detects change
3. Debounce: wait 2 seconds
4. Coordinator evaluates conditions:
   - Single file: true
   - Recent batch: true (15 min ago)
   → Decision: MICRO
5. Run micro validation:
   - State consistency: PASS
   - Permission check: PASS
   - Quick conflict scan: PASS
6. Result: PASS
7. Log validation, continue
```

### Flow 2: Phase Transition → Batch Validation

```
1. User runs /idumb:verify-work 1
2. Verification passes
3. Phase transition hook triggers
4. Coordinator evaluates conditions:
   - Phase transition: true
   → Decision: BATCH
5. Run batch validation:
   - Governance checks: PASS
   - Integration checks: PASS
   - Conflict detection: PASS
6. Result: PASS
7. Allow phase transition
8. Update state, anchor checkpoint
```

### Flow 3: Certification → Full Validation

```
1. User runs /idumb:certify
2. Certification workflow starts
3. Coordinator evaluates conditions:
   - Certification required: true
   → Decision: FULL
5. Run full stress test:
   - All agent tests
   - Full integration matrix
   - Regression sweep
   - OpenCode compatibility
6. Result: PASS (92%)
7. Generate certificate
8. Update state, create anchor
```

---

*Reference: auto-activation-hooks v1.0.0*
