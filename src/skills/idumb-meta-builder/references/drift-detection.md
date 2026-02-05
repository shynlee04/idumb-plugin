# Drift Detection Reference

How iDumb modules detect and recover from divergence from expected state.

## What is Drift?

**Drift** occurs when the actual state of the system diverges from the expected state defined by a workflow module. This can happen due to:

- Manual file modifications outside governance
- Concurrent operations creating conflicts
- Time-based staleness (context becomes outdated)
- Failed operations leaving partial state
- External system changes (Git, dependencies, etc.)

## Drift Detection Methods

### 1. File System Drift

```yaml
filesystem_drift:
  checksum_comparison:
    method: "Compare file checksums with expected"
    tools: ["sha256sum", "md5sum"]
    trigger: "Before and after module execution"
    tolerance: "Any difference = drift detected"

  timestamp_analysis:
    method: "Compare file modification times"
    trigger: "When file expected to be unchanged"
    threshold: "mtime newer than expected = drift"

  content_diff:
    method: "Compare actual vs expected content"
    tools: ["diff", "git diff"]
    trigger: "For configuration files, templates"
    tolerance: "Whitespace ignored if configured"
```

### 2. State Drift

```yaml
state_drift:
  version_check:
    method: "Compare state.json version with module requirement"
    trigger: "On module load"
    action: "Warn or fail if incompatible"

  phase_mismatch:
    method: "Compare current phase with expected phase"
    trigger: "Before module execution"
    action: "Update phase or abort"

  anchor_staleness:
    method: "Check anchor age against threshold"
    trigger: "On module load and periodically"
    threshold: "48 hours = stale"
    action: "Refresh or warn"
```

### 3. Integration Drift

```yaml
integration_drift:
  agent_renamed:
    method: "Check if referenced agents still exist"
    trigger: "Before delegation"
    action: "Update binding or fail gracefully"

  tool_modified:
    method: "Check tool exports still match expected"
    trigger: "Before tool invocation"
    action: "Use fallback or fail"

  command_changed:
    method: "Check command binding still valid"
    trigger: "Before command chain"
    action: "Validate or break chain"
```

### 4. Dependency Drift

```yaml
dependency_drift:
  module_version:
    method: "Compare module version with dependency requirements"
    trigger: "On module load"
    resolution: "Use latest compatible or fail"

  schema_evolution:
    method: "Check schema compatibility with data"
    trigger: "When reading persisted data"
    resolution: "Migrate or reject"

  external_dependency:
    method: "Check external system versions (Node, Git, etc.)"
    trigger: "On initialization"
    resolution: "Warn or fail if incompatible"
```

## Drift Thresholds

```yaml
thresholds:
  critical:
    definition: "Module cannot execute safely"
    examples:
      - "State file corrupted"
      - "Required agent missing"
      - "Schema incompatible"
    action: "FAIL - require manual intervention"

  high:
    definition: "Module can execute with degraded functionality"
    examples:
      - "Optional agent missing"
      - "Tool export changed"
      - "Configuration stale"
    action: "WARN - proceed with logging"

  normal:
    definition: "Drift detected but within tolerance"
    examples:
      - "File timestamp changed (content same)"
      - "Anchor slightly stale (< 48h)"
      - "Module version newer than expected"
    action: "INFO - log and continue"

  low:
    definition: "Cosmetic or metadata drift"
    examples:
      - "Comment changes in files"
      - "Formatting differences"
      - "Version string format difference"
    action: "IGNORE - no action needed"
```

## Drift Recovery Strategies

### 1. Rollback Recovery

```yaml
rollback_recovery:
  when: "Critical drift detected during execution"

  steps:
    1_identify_checkpoint:
      action: "Find last valid checkpoint"
      method: "Search .idumb/brain/executions/{phase}/checkpoint-{id}.json"

    2_restore_state:
      action: "Restore state from checkpoint"
      method: "Copy checkpoint state.json to .idumb/brain/"

    3_restore_files:
      action: "Restore modified files"
      method: "Git checkout or backup restore"

    4_record_recovery:
      action: "Document rollback in history"
      method: "idump-state history with rollback reason"

    5_notify:
      action: "Alert user to rollback"
      method: "Return rollback status in module result"
```

### 2. Forward Recovery

```yaml
forward_recovery:
  when: "Drift detected but can be reconciled"

  steps:
    1_analyze_drift:
      action: "Understand what changed"
      method: "Diff actual vs expected"

    2_determine_reconciliation:
      action: "Decide how to reconcile"
      options:
        - "Accept changes (update expected)"
        - "Merge changes (combine both)"
        - "Override changes (restore expected)"

    3_apply_reconciliation:
      action: "Execute reconciliation strategy"
      method: "Depends on strategy chosen"

    4_update_baseline:
      action: "Update module's expected state"
      method: "Re-calculate checksums"

    5_validate:
      action: "Confirm reconciliation successful"
      method: "Run validation checks"
```

### 3. Migration Recovery

```yaml
migration_recovery:
  when: "Schema or format has evolved"

  steps:
    1_identify_version:
      action: "Detect current version/format"
      method: "Check version field or content pattern"

    2_select_migration:
      action: "Choose appropriate migration path"
      method: "Version diff lookup"

    3_execute_migration:
      action: "Transform data to new format"
      method: "Apply migration script"

    4_backup_old:
      action: "Preserve pre-migration state"
      method: "Archive old files"

    5_validate_migrated:
      action: "Verify migration successful"
      method: "Schema validation, smoke tests"
```

### 4. Degraded Mode

```yaml
degraded_mode:
  when: "Drift prevents normal operation but work can continue"

  characteristics:
    - "Some features unavailable"
    - "Manual intervention may be needed"
    - "Performance may be reduced"
    - "Additional validation required"

  triggers:
    - "Optional agent unavailable"
    - "External system unreachable"
    - "Configuration partially invalid"

  user_communication:
    - "Clear warning about degraded status"
    - "List unavailable features"
    - "Provide remediation steps"
    - "Offer exit or continue choice"
```

## Drift Detection in Modules

### Module Schema for Drift

```yaml
drift_detection_section:
  header: "## Drift Detection"

  required_fields:
    - drift_check_method: "How to detect drift"
    - drift_threshold: "Tolerance level"
    - drift_recovery: "Recovery strategy"

  optional_fields:
    - drift_check_interval: "How often to check (if continuous)"
    - drift_notification: "How to alert user"
    - drift_auto_recovery: "Whether to auto-recover"
```

### Example Module Drift Section

```markdown
## Drift Detection

**Drift Check Method:**
1. Compare `.idumb/brain/state.json` checksum with stored value
2. Validate all workflow steps have corresponding agent profiles
3. Check tool exports match expected signatures
4. Verify no conflicting modules exist

**Drift Threshold:**
- Critical: State file corrupted or missing
- High: Required agent or tool missing
- Normal: Configuration modified (content valid)
- Low: Formatting or metadata changes

**Drift Recovery:**
- State corruption: Rollback to last checkpoint
- Agent missing: Fail with option to use alternative
- Configuration changed: Validate and accept if valid
- Formatting changes: Ignore (no recovery needed)

**Auto-Recovery:**
- Enabled for: Normal and Low drift
- Disabled for: Critical and High drift (requires user)
```

## Drift Prevention

### Prevention Strategies

```yaml
prevention:
  atomic_operations:
    strategy: "Use write-then-move pattern"
    benefit: "No partial writes if interrupted"

  locks:
    strategy: "Create lock files during operations"
    benefit: "Prevent concurrent modifications"

  checksums:
    strategy: "Store and verify checksums"
    benefit: "Detect modifications early"

  versioning:
    strategy: "Track artifact versions"
    benefit: "Compatibility checking before use"

  validation_before_commit:
    strategy: "Validate state before persisting"
    benefit: "Never write invalid state"
```

### Governance Integration

```yaml
governance_hooks:
  pre_execution:
    - "Validate current state matches expectations"
    - "Check for conflicts with other operations"
    - "Verify all dependencies available"

  during_execution:
    - "Monitor for external changes"
    - "Validate intermediate state"
    - "Create checkpoints at critical points"

  post_execution:
    - "Verify final state valid"
    - "Update baseline checksums"
    - "Record successful execution in history"
```

## Drift Monitoring

### Continuous Monitoring

```yaml
continuous_monitoring:
  enabled_for:
    - "Long-running sessions"
    - "Multi-phase workflows"
    - "External integrations"

  checks:
    - "File modification time (every 5 min)"
    - "State file integrity (every 10 min)"
    - "External system availability (every check)"

  alerts:
    - "Log all drift detection"
    - "Warn user for high+ severity"
    - "Block execution for critical drift"
```

### Event-Driven Monitoring

```yaml
event_driven:
  trigger_events:
    - "Before tool invocation"
    - "After agent delegation returns"
    - "On user command"
    - "On session resume"

  checks:
    - "Validate relevant state only"
    - "Check integration points for operation"
    - "Verify permissions still valid"
```
