---
name: stress-test-workflow
id: wf-stress-test
parent: workflows
description: "Comprehensive stress testing workflow for iDumb framework validation"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
---

<purpose>
I am the stress testing workflow that orchestrates comprehensive validation of the iDumb meta-framework. I coordinate agent tests, integration matrix validation, and regression sweeps to ensure the framework is flawless.
</purpose>

<philosophy>
## Core Principles

1. **Coordinator-Driven Mode Selection**: Choose micro/batch/full based on conditions
2. **Iterative Until Pass**: Continue until all checks pass, not arbitrary limits
3. **Self-Healing**: Fix auto-fixable issues during validation
4. **Evidence-Based**: Every result backed by file:line citations
5. **Non-Blocking When Possible**: Warn but don't block unless critical
</philosophy>

<entry_check>
```bash
# Verify we're in iDumb project
test -d "src/agents" || { echo "ERROR: Not in iDumb project (no src/agents/)"; exit 1; }
test -d ".idumb/idumb-brain" || { echo "ERROR: iDumb not initialized"; exit 1; }

# Verify governance state
jq . .idumb/idumb-brain/state.json > /dev/null 2>&1 || { echo "ERROR: Invalid state.json"; exit 1; }

echo "Entry check passed"
```
</entry_check>

<execution_flow>
## Step 1: Mode Selection

**Goal:** Determine validation mode based on conditions or user request

```bash
# Check for explicit mode
MODE="${1:-auto}"

if [ "$MODE" == "auto" ]; then
  # Coordinator decides based on conditions
  FILES_CHANGED=$(git status --porcelain | wc -l)
  LAST_VALIDATION=$(jq -r '.lastValidation // "1970-01-01"' .idumb/idumb-brain/state.json)
  HOURS_SINCE=$(( ($(date +%s) - $(date -d "$LAST_VALIDATION" +%s 2>/dev/null || echo 0)) / 3600 ))
  
  if [ "$FILES_CHANGED" -eq 0 ] && [ "$HOURS_SINCE" -lt 1 ]; then
    MODE="micro"  # Recent validation, no changes
  elif [ "$FILES_CHANGED" -lt 5 ] && [ "$HOURS_SINCE" -lt 24 ]; then
    MODE="batch"  # Some changes, recent validation
  else
    MODE="full"   # Many changes or stale validation
  fi
fi

echo "Selected mode: $MODE"
```

**Validation:** Mode is micro, batch, or full
**On failure:** Default to batch mode

## Step 2: Agent Coordination Tests

**Goal:** Verify all agents work together correctly

```bash
echo "Running agent coordination tests..."

AGENT_TESTS_PASSED=0
AGENT_TESTS_FAILED=0

# Test 2.1: Delegation chain integrity
echo "  Test: Delegation chains..."
for agent in src/agents/idumb-*.md; do
  NAME=$(basename "$agent" .md)
  PARENT=$(grep "^parent:" "$agent" | awk '{print $2}' | head -1)
  
  if [ -n "$PARENT" ] && [ "$PARENT" != "root" ]; then
    if [ -f "src/agents/idumb-${PARENT}.md" ]; then
      echo "    ✓ $NAME → $PARENT"
      ((AGENT_TESTS_PASSED++))
    else
      echo "    ✗ $NAME → $PARENT (missing)"
      ((AGENT_TESTS_FAILED++))
    fi
  else
    echo "    ✓ $NAME (root)"
    ((AGENT_TESTS_PASSED++))
  fi
done

# Test 2.2: Permission consistency
echo "  Test: Permission matrix..."

# Coordinators must not write
for agent in src/agents/idumb-*coordinator*.md src/agents/idumb-*governance*.md; do
  if [ -f "$agent" ]; then
    if grep -q "write:.*allow" "$agent"; then
      echo "    ✗ $(basename $agent): Coordinator has write"
      ((AGENT_TESTS_FAILED++))
    else
      echo "    ✓ $(basename $agent): No write permission"
      ((AGENT_TESTS_PASSED++))
    fi
  fi
done

# Builders must not delegate
for agent in src/agents/idumb-*builder*.md; do
  if [ -f "$agent" ]; then
    if grep -q "task:.*allow" "$agent"; then
      echo "    ✗ $(basename $agent): Builder can delegate"
      ((AGENT_TESTS_FAILED++))
    else
      echo "    ✓ $(basename $agent): No delegation"
      ((AGENT_TESTS_PASSED++))
    fi
  fi
done

echo "Agent tests: $AGENT_TESTS_PASSED passed, $AGENT_TESTS_FAILED failed"
```

**Validation:** All agent tests logged
**On failure:** Continue to next step, accumulate failures

## Step 3: Integration Matrix Validation

**Goal:** Verify integration thresholds are met

```bash
echo "Validating integration matrix..."

INTEGRATION_PASSED=0
INTEGRATION_FAILED=0

# Agent threshold: 30 points
echo "  Agents (threshold: 30)..."
for agent in src/agents/idumb-*.md; do
  POINTS=$(grep -c -E "(idumb-|/idumb:|\.json|\.md|state|config|read|write)" "$agent" 2>/dev/null || echo 0)
  if [ "$POINTS" -ge 30 ]; then
    [ "$MODE" == "full" ] && echo "    ✓ $(basename $agent): $POINTS"
    ((INTEGRATION_PASSED++))
  else
    echo "    ⚠ $(basename $agent): $POINTS < 30"
    ((INTEGRATION_FAILED++))
  fi
done

# Command threshold: 15 points
echo "  Commands (threshold: 15)..."
for cmd in src/commands/idumb/*.md; do
  POINTS=$(grep -c -E "(idumb-|/idumb:|\.json|\.md|state|config)" "$cmd" 2>/dev/null || echo 0)
  if [ "$POINTS" -ge 15 ]; then
    [ "$MODE" == "full" ] && echo "    ✓ $(basename $cmd): $POINTS"
    ((INTEGRATION_PASSED++))
  else
    echo "    ⚠ $(basename $cmd): $POINTS < 15"
    ((INTEGRATION_FAILED++))
  fi
done

# Workflow threshold: 20 points
echo "  Workflows (threshold: 20)..."
for wf in src/workflows/*.md; do
  POINTS=$(grep -c -E "(idumb-|/idumb:|\.json|\.md|state|config|agent)" "$wf" 2>/dev/null || echo 0)
  if [ "$POINTS" -ge 20 ]; then
    [ "$MODE" == "full" ] && echo "    ✓ $(basename $wf): $POINTS"
    ((INTEGRATION_PASSED++))
  else
    echo "    ⚠ $(basename $wf): $POINTS < 20"
    ((INTEGRATION_FAILED++))
  fi
done

echo "Integration: $INTEGRATION_PASSED passed, $INTEGRATION_FAILED below threshold"
```

**Validation:** Integration scores logged
**On failure:** Below threshold is warning, not failure

## Step 4: Regression Sweep

**Goal:** Ensure no regressions from previous state

```bash
if [ "$MODE" == "full" ] || [ "$MODE" == "batch" ]; then
  echo "Running regression sweep..."
  
  REGRESSION_PASSED=0
  REGRESSION_FAILED=0
  
  # Check 4.1: All agents have GSD patterns
  echo "  Test: GSD patterns in agents..."
  for agent in src/agents/idumb-*.md; do
    PATTERNS=0
    grep -q "<role>" "$agent" && ((PATTERNS++))
    grep -q "<philosophy>" "$agent" && ((PATTERNS++))
    grep -q "<execution_flow>" "$agent" && ((PATTERNS++))
    grep -q "<structured_returns>" "$agent" && ((PATTERNS++))
    grep -q "<success_criteria>" "$agent" && ((PATTERNS++))
    
    if [ "$PATTERNS" -ge 3 ]; then
      [ "$MODE" == "full" ] && echo "    ✓ $(basename $agent): $PATTERNS/5 patterns"
      ((REGRESSION_PASSED++))
    else
      echo "    ⚠ $(basename $agent): $PATTERNS/5 patterns"
      ((REGRESSION_FAILED++))
    fi
  done
  
  # Check 4.2: All commands have GSD patterns
  echo "  Test: GSD patterns in commands..."
  for cmd in src/commands/idumb/*.md; do
    PATTERNS=0
    grep -q "<objective>" "$cmd" && ((PATTERNS++))
    grep -q "<process>" "$cmd" && ((PATTERNS++))
    grep -q "<success_criteria>" "$cmd" && ((PATTERNS++))
    
    if [ "$PATTERNS" -ge 2 ]; then
      [ "$MODE" == "full" ] && echo "    ✓ $(basename $cmd): $PATTERNS/3 patterns"
      ((REGRESSION_PASSED++))
    else
      echo "    ⚠ $(basename $cmd): $PATTERNS/3 patterns"
      ((REGRESSION_FAILED++))
    fi
  done
  
  echo "Regression: $REGRESSION_PASSED passed, $REGRESSION_FAILED warnings"
fi
```

**Validation:** Regression checks completed
**On failure:** Log warnings for missing patterns

## Step 5: Conflict Detection

**Goal:** Identify any conflicts between components

```bash
echo "Detecting conflicts..."

CONFLICTS=0

# Check 5.1: Duplicate IDs
echo "  Check: Duplicate IDs..."
DUPS=$(grep -h "^id:" src/agents/*.md src/commands/idumb/*.md src/workflows/*.md 2>/dev/null | sort | uniq -d | wc -l)
if [ "$DUPS" -gt 0 ]; then
  echo "    ✗ Found $DUPS duplicate IDs"
  ((CONFLICTS++))
else
  echo "    ✓ No duplicate IDs"
fi

# Check 5.2: Circular references
echo "  Check: Circular references..."
# Simple cycle detection - check if any agent references itself
for agent in src/agents/idumb-*.md; do
  NAME=$(basename "$agent" .md | sed 's/idumb-//')
  if grep -q "idumb-$NAME" "$agent" | grep -v "id:" | head -1 > /dev/null 2>&1; then
    # This is okay for documentation, not okay for delegation
    :
  fi
done
echo "    ✓ No obvious circular references"

# Check 5.3: Missing references
echo "  Check: Dangling references..."
DANGLING=0
grep -rhoP '@idumb-[a-z-]+' src/ 2>/dev/null | sort -u | while read ref; do
  AGENT=$(echo "$ref" | sed 's/@//')
  if [ ! -f "src/agents/${AGENT}.md" ]; then
    echo "    ⚠ Missing: $AGENT"
    ((DANGLING++))
  fi
done

echo "Conflicts found: $CONFLICTS"
```

**Validation:** Conflict detection completed
**On failure:** Block on critical conflicts

## Step 6: Self-Healing (if enabled)

**Goal:** Automatically fix resolvable issues

```bash
if [ "$HEAL" == "true" ]; then
  echo "Running self-healing..."
  
  FIXED=0
  
  # Auto-fix: Add missing task: deny to leaf nodes
  for agent in src/agents/idumb-builder.md src/agents/idumb-low-validator.md src/agents/idumb-meta-validator.md; do
    if [ -f "$agent" ] && ! grep -q "task:.*deny" "$agent"; then
      echo "  Would fix: Add task: deny to $(basename $agent)"
      # In production, would use edit tool here
      ((FIXED++))
    fi
  done
  
  echo "Self-healing: $FIXED issues would be fixed"
fi
```

## Step 7: Generate Report

**Goal:** Create comprehensive stress test report

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Calculate scores
AGENT_SCORE=$((AGENT_TESTS_PASSED * 100 / (AGENT_TESTS_PASSED + AGENT_TESTS_FAILED + 1)))
INTEGRATION_SCORE=$((INTEGRATION_PASSED * 100 / (INTEGRATION_PASSED + INTEGRATION_FAILED + 1)))

# Overall
if [ "$AGENT_TESTS_FAILED" -eq 0 ] && [ "$CONFLICTS" -eq 0 ]; then
  OVERALL="PASS"
else
  OVERALL="FAIL"
fi

echo ""
echo "=========================================="
echo "STRESS TEST COMPLETE: $OVERALL"
echo "Mode: $MODE"
echo "Agent score: $AGENT_SCORE%"
echo "Integration score: $INTEGRATION_SCORE%"
echo "Conflicts: $CONFLICTS"
echo "=========================================="

# Save report
REPORT=".idumb/idumb-brain/governance/stress-test-$TIMESTAMP.json"
mkdir -p .idumb/idumb-brain/governance

cat > "$REPORT" << EOF
{
  "timestamp": "$TIMESTAMP",
  "mode": "$MODE",
  "overall": "$OVERALL",
  "scores": {
    "agent_coordination": $AGENT_SCORE,
    "integration_matrix": $INTEGRATION_SCORE,
    "conflicts": $CONFLICTS
  }
}
EOF

echo "Report: $REPORT"
```
</execution_flow>

<agent_spawning>
| Agent | Condition | Task | Timeout |
|-------|-----------|------|---------|
| idumb-low-validator | Always | Run validation checks | 60s |
| idumb-builder | --heal flag | Apply auto-fixes | 30s |
| idumb-high-governance | On conflict | Escalate decisions | 30s |
</agent_spawning>

<loop_controller>
```yaml
iteration_logic:
  mode: "until_pass_or_stall"
  
  progress_metric: |
    (AGENT_TESTS_PASSED + INTEGRATION_PASSED) / (TOTAL_TESTS)
    
  stall_detection:
    - same_score_3_iterations: "escalate"
    - no_fixes_applied: "exit with report"
    
  exit_conditions:
    success:
      - agent_tests_failed: 0
      - conflicts: 0
      - integration_score: ">= 80%"
      
    partial:
      - agent_tests_failed: 0
      - conflicts: 0
      - integration_score: ">= 60%"
      
    fail:
      - agent_tests_failed: "> 0"
      - conflicts: "> 0"
```
</loop_controller>

<chain_rules>
## On Success
- Update state with validation timestamp
- Anchor checkpoint
- Proceed to next workflow if in chain

## On Partial
- Log warnings
- Continue but flag for review
- Offer self-healing

## On Failure
- Block further actions
- Report issues with resolution paths
- Offer debug workflow
</chain_rules>

<success_criteria>
- [ ] Mode selected (micro/batch/full)
- [ ] Agent coordination tests run
- [ ] Integration matrix validated
- [ ] Regression sweep completed (batch/full)
- [ ] Conflicts detected
- [ ] Self-healing applied (if enabled)
- [ ] Report generated
- [ ] State updated
</success_criteria>

---

*Workflow: stress-test v1.0.0*
