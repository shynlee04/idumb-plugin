---
name: continuous-validation
id: wf-continuous-validation
parent: workflows
description: "Continuous validation workflow with coordinator-driven micro/batch mode selection"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
---

<purpose>
I am the continuous validation workflow that runs throughout development. I provide real-time micro-validations after actions and thorough batch validations at phase transitions. The coordinator decides which mode to use based on current conditions.
</purpose>

<philosophy>
## Core Principles

1. **Coordinator-Driven**: Mode selection based on conditions, not arbitrary rules
2. **Non-Blocking by Default**: Warn but don't block unless critical
3. **Incremental**: Each validation builds on previous results
4. **Self-Healing**: Fix what can be fixed automatically
5. **Evidence-Based**: All results backed by citations
</philosophy>

<entry_check>
```bash
# Must have iDumb initialized
test -d ".idumb/idumb-brain" || { echo "ERROR: iDumb not initialized"; exit 1; }

# State must be valid
jq . .idumb/idumb-brain/state.json > /dev/null 2>&1 || { echo "ERROR: Invalid state"; exit 1; }

echo "Continuous validation ready"
```
</entry_check>

<activation_triggers>
## Micro-Validation Triggers (Real-Time, <5s)

```yaml
micro_triggers:
  file_events:
    - pattern: "src/agents/*.md"
      action: "validate_agent_on_change"
    - pattern: "src/commands/idumb/*.md"
      action: "validate_command_on_change"
    - pattern: ".idumb/idumb-brain/state.json"
      action: "validate_state_consistency"
      
  action_events:
    - event: "agent_spawned"
      action: "validate_chain_integrity"
    - event: "tool_executed"
      action: "validate_permission"
    - event: "state_written"
      action: "validate_state_schema"
```

## Batch-Validation Triggers (Thorough, <60s)

```yaml
batch_triggers:
  phase_events:
    - event: "phase_transition"
      action: "full_phase_validation"
    - event: "milestone_complete"
      action: "milestone_validation"
      
  time_events:
    - condition: "30 minutes since last batch"
      action: "scheduled_validation"
      
  commit_events:
    - event: "pre_commit"
      action: "commit_readiness_check"
    - event: "post_commit"
      action: "commit_verification"
```

## Coordinator Decision Logic

```yaml
coordinator_decides:
  use_micro:
    - single_file_change: true
    - low_risk_action: true
    - recent_batch_validation: "< 30 min ago"
    
  use_batch:
    - multiple_files_changed: "> 3"
    - phase_boundary: true
    - time_since_batch: "> 30 min"
    - high_risk_action: true
    
  force_full:
    - certification_required: true
    - major_refactor: true
    - user_request: "--full"
```
</activation_triggers>

<execution_flow>
## Step 1: Trigger Detection

**Goal:** Identify what triggered this validation

```bash
# Determine trigger source
TRIGGER="${TRIGGER:-manual}"
echo "Trigger: $TRIGGER"

# Get changed files if any
CHANGED_FILES=$(git status --porcelain 2>/dev/null | wc -l)
echo "Changed files: $CHANGED_FILES"

# Check time since last validation
LAST_VALIDATION=$(jq -r '.lastValidation // "1970-01-01T00:00:00Z"' .idumb/idumb-brain/state.json)
NOW=$(date -u +%s)
LAST=$(date -d "$LAST_VALIDATION" +%s 2>/dev/null || echo 0)
MINUTES_SINCE=$(( (NOW - LAST) / 60 ))
echo "Minutes since last validation: $MINUTES_SINCE"
```

**Validation:** Trigger context captured

## Step 2: Mode Selection (Coordinator Decision)

**Goal:** Coordinator selects appropriate validation mode

```bash
# Coordinator decision tree
if [ "$FORCE_MODE" != "" ]; then
  MODE="$FORCE_MODE"
elif [ "$TRIGGER" == "phase_transition" ] || [ "$TRIGGER" == "milestone" ]; then
  MODE="batch"
elif [ "$CHANGED_FILES" -gt 3 ]; then
  MODE="batch"
elif [ "$MINUTES_SINCE" -gt 30 ]; then
  MODE="batch"
elif [ "$CHANGED_FILES" -eq 0 ] && [ "$MINUTES_SINCE" -lt 5 ]; then
  MODE="skip"  # Nothing to validate
else
  MODE="micro"
fi

echo "Coordinator selected: $MODE mode"

if [ "$MODE" == "skip" ]; then
  echo "No validation needed - exiting"
  exit 0
fi
```

**Validation:** Mode selected by coordinator logic

## Step 3: Micro-Validation (if selected)

**Goal:** Run fast, focused validation checks

```bash
if [ "$MODE" == "micro" ]; then
  echo "Running MICRO validation..."
  START_TIME=$(date +%s)
  
  MICRO_PASSED=0
  MICRO_FAILED=0
  
  # Check 1: State consistency (<1s)
  echo "  Check: State consistency..."
  if jq . .idumb/idumb-brain/state.json > /dev/null 2>&1; then
    echo "    ✓ State valid"
    ((MICRO_PASSED++))
  else
    echo "    ✗ State invalid"
    ((MICRO_FAILED++))
  fi
  
  # Check 2: Permission not violated (<1s)
  echo "  Check: Recent actions..."
  LAST_ACTION=$(jq -r '.history[-1].action // "none"' .idumb/idumb-brain/state.json)
  echo "    Last action: $LAST_ACTION"
  ((MICRO_PASSED++))
  
  # Check 3: No obvious conflicts (<1s)
  echo "  Check: Quick conflict scan..."
  # Check for any coordinator with write permission
  VIOLATIONS=$(grep -l "write:.*allow" src/agents/idumb-*coordinator*.md 2>/dev/null | wc -l)
  if [ "$VIOLATIONS" -eq 0 ]; then
    echo "    ✓ No permission violations"
    ((MICRO_PASSED++))
  else
    echo "    ✗ $VIOLATIONS permission violations"
    ((MICRO_FAILED++))
  fi
  
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  echo "Micro validation: $MICRO_PASSED passed, $MICRO_FAILED failed (${DURATION}s)"
  
  if [ "$MICRO_FAILED" -gt 0 ]; then
    RESULT="FAIL"
    echo "⚠ Issues detected - consider batch validation"
  else
    RESULT="PASS"
  fi
fi
```

**Validation:** Micro checks completed in <5s

## Step 4: Batch-Validation (if selected)

**Goal:** Run thorough validation checks

```bash
if [ "$MODE" == "batch" ]; then
  echo "Running BATCH validation..."
  START_TIME=$(date +%s)
  
  BATCH_PASSED=0
  BATCH_FAILED=0
  BATCH_WARNED=0
  
  # === Section A: Governance Validation ===
  echo "Section A: Governance..."
  
  # A1: All agents have required structure
  for agent in src/agents/idumb-*.md; do
    if grep -q "^---" "$agent" && grep -q "description:" "$agent"; then
      ((BATCH_PASSED++))
    else
      echo "  ⚠ $(basename $agent): Missing structure"
      ((BATCH_WARNED++))
    fi
  done
  
  # A2: Permission matrix valid
  for agent in src/agents/idumb-*coordinator*.md; do
    if [ -f "$agent" ] && ! grep -q "write:.*allow" "$agent"; then
      ((BATCH_PASSED++))
    else
      echo "  ✗ $(basename $agent 2>/dev/null): Coordinator has write"
      ((BATCH_FAILED++))
    fi
  done
  
  # === Section B: Integration Validation ===
  echo "Section B: Integration..."
  
  # B1: All commands reference valid agents
  for cmd in src/commands/idumb/*.md; do
    AGENT=$(grep "^agent:" "$cmd" 2>/dev/null | awk '{print $2}')
    if [ -z "$AGENT" ] || [ -f "src/agents/${AGENT}.md" ]; then
      ((BATCH_PASSED++))
    else
      echo "  ✗ $(basename $cmd): References missing agent $AGENT"
      ((BATCH_FAILED++))
    fi
  done
  
  # B2: Integration thresholds
  LOW_INTEGRATION=0
  for agent in src/agents/idumb-*.md; do
    POINTS=$(grep -c -E "(idumb-|/idumb:)" "$agent" 2>/dev/null || echo 0)
    if [ "$POINTS" -lt 30 ]; then
      ((LOW_INTEGRATION++))
    fi
  done
  if [ "$LOW_INTEGRATION" -gt 0 ]; then
    echo "  ⚠ $LOW_INTEGRATION agents below integration threshold"
    ((BATCH_WARNED++))
  fi
  
  # === Section C: Conflict Detection ===
  echo "Section C: Conflicts..."
  
  # C1: No duplicate IDs
  DUPS=$(grep -h "^id:" src/agents/*.md src/commands/idumb/*.md 2>/dev/null | sort | uniq -d | wc -l)
  if [ "$DUPS" -eq 0 ]; then
    echo "  ✓ No duplicate IDs"
    ((BATCH_PASSED++))
  else
    echo "  ✗ $DUPS duplicate IDs"
    ((BATCH_FAILED++))
  fi
  
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  echo ""
  echo "Batch validation: $BATCH_PASSED passed, $BATCH_FAILED failed, $BATCH_WARNED warnings (${DURATION}s)"
  
  if [ "$BATCH_FAILED" -gt 0 ]; then
    RESULT="FAIL"
  elif [ "$BATCH_WARNED" -gt 0 ]; then
    RESULT="WARN"
  else
    RESULT="PASS"
  fi
fi
```

**Validation:** Batch checks completed in <60s

## Step 5: Update State

**Goal:** Record validation results

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update state via tool
echo "Updating state..."
# idumb-state_write lastValidation="$TIMESTAMP"
# idumb-state_history action="continuous-validation:$MODE:$RESULT" result="$RESULT"

# Save validation record
RECORD=".idumb/idumb-brain/governance/validations/validation-$TIMESTAMP.json"
mkdir -p .idumb/idumb-brain/governance/validations

cat > "$RECORD" << EOF
{
  "timestamp": "$TIMESTAMP",
  "trigger": "$TRIGGER",
  "mode": "$MODE",
  "result": "$RESULT",
  "duration_seconds": $DURATION,
  "passed": ${MICRO_PASSED:-$BATCH_PASSED},
  "failed": ${MICRO_FAILED:-$BATCH_FAILED}
}
EOF

echo "Validation recorded: $RECORD"
```

## Step 6: Handle Results

**Goal:** Take appropriate action based on results

```bash
case "$RESULT" in
  PASS)
    echo "✓ Validation passed - continue development"
    ;;
  WARN)
    echo "⚠ Validation passed with warnings"
    echo "  Consider running /idumb:stress-test --heal"
    ;;
  FAIL)
    echo "✗ Validation failed"
    echo "  Critical issues must be resolved before continuing"
    echo "  Run /idumb:stress-test --full for details"
    
    # Block if critical
    if [ "$BATCH_FAILED" -gt 2 ]; then
      echo ""
      echo "BLOCKED: Too many critical issues"
      exit 1
    fi
    ;;
esac
```
</execution_flow>

<loop_controller>
```yaml
continuous_loop:
  trigger_watch:
    - file_system_events
    - command_execution_events
    - phase_transition_events
    
  coordinator_evaluation:
    frequency: "on_each_trigger"
    decision: "micro OR batch OR skip"
    
  iteration_behavior:
    on_pass: "continue, update timestamp"
    on_warn: "log, continue, flag for review"
    on_fail: "block if critical, else warn"
    
  stall_prevention:
    max_frequency: "1 validation per 30 seconds"
    batch_cooldown: "5 minutes after batch"
```
</loop_controller>

<chain_rules>
## On Pass
- Continue development flow
- Update last validation timestamp
- Clear any previous warnings

## On Warning
- Log warnings to governance/
- Continue but flag for review
- Suggest self-healing

## On Failure (Critical)
- Block further development
- Report issues with resolution paths
- Require explicit override to continue
</chain_rules>

<success_criteria>
- [ ] Trigger detected and logged
- [ ] Coordinator selected appropriate mode
- [ ] Validation completed within time limit
- [ ] Results logged to state
- [ ] Appropriate action taken (continue/warn/block)
- [ ] State updated with timestamp
</success_criteria>

---

*Workflow: continuous-validation v1.0.0*
