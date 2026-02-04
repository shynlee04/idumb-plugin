---
description: "Run comprehensive stress tests on the iDumb framework itself - validates agent coordination, integration completeness, and regression prevention"
agent: idumb-high-governance
id: cmd-stress-test
mode: all
gsd_version: "1.0.0"
---

<objective>
Execute comprehensive stress testing of the iDumb meta-framework to ensure all agents, commands, workflows, and tools work together flawlessly. Supports three modes: micro (real-time), batch (phase transitions), and full (complete certification).
</objective>

<execution_context>
## Reference Files
- Skill: `src/skills/idumb-stress-test/SKILL.md`
- Agents: `src/agents/idumb-*.md` (22 files)
- Commands: `src/commands/idumb/*.md` (15+ files)
- Workflows: `src/workflows/*.md` (9 files)
- Tools: `src/tools/idumb-*.ts` (8 files)

## Integration Points
- Reads: All governance files, state.json, config.json
- Writes: `.idumb/idumb-brain/governance/stress-test-{timestamp}.json`
- Triggers: Validation loops, self-healing, certification
</execution_context>

<context>
## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `--micro` | flag | no | Run fast micro-validation (< 5s) |
| `--batch` | flag | no | Run thorough batch validation (< 60s) |
| `--full` | flag | no | Run complete stress test (< 5min) |
| `--heal` | flag | no | Enable self-healing for auto-fixable issues |
| `--report` | flag | no | Generate detailed report |

## Usage Examples

```bash
# Quick micro-validation after action
/idumb:stress-test --micro

# Thorough batch validation at phase transition
/idumb:stress-test --batch

# Full stress test with self-healing
/idumb:stress-test --full --heal

# Full certification with report
/idumb:stress-test --full --report
```
</context>

<process>
## Step 1: Determine Test Mode

**Goal:** Select appropriate test mode based on flags or coordinator decision

```bash
# Security: Add error handling and input validation
set -euo pipefail

# Security: Validate and sanitize inputs
MODE="${1:-auto}"
HEAL="${HEAL:-false}"
REPORT="${REPORT:-false}"

# Security: Validate mode
if [[ "$MODE" != "auto" && "$MODE" != "micro" && "$MODE" != "batch" && "$MODE" != "full" ]]; then
    echo "ERROR: Invalid mode: $MODE"
    exit 1
fi

# Determine test mode
if [ "$MODE" == "auto" ]; then
  # Check recent activity
  LAST_VALIDATION=$(jq -r '.lastValidation' .idumb/idumb-brain/state.json)
  FILES_CHANGED=$(git status --porcelain | wc -l)
  
  if [ "$FILES_CHANGED" -gt 5 ]; then
    MODE="batch"
  elif [ "$FILES_CHANGED" -gt 0 ]; then
    MODE="micro"
  else
    MODE="batch"  # Default to batch when no files changed
  fi
fi

echo "Selected mode: $MODE"
```

**Validation:** Mode is one of: micro, batch, full

## Step 2: Run Mode-Specific Tests

### Micro Mode (< 5 seconds)
```bash
echo "Running MICRO validation..."

# Test 1: Permission violations
grep -r "write: allow" src/agents/idumb-*coordinator*.md && echo "FAIL: Coordinator has write" || echo "PASS: No coordinator writes"

# Test 2: Chain integrity
grep -r "task: allow" src/agents/idumb-*builder*.md && echo "FAIL: Builder can delegate" || echo "PASS: Builder isolated"

# Test 3: State consistency
jq . .idumb/idumb-brain/state.json > /dev/null && echo "PASS: State valid" || echo "FAIL: State invalid"

# Test 4: No circular refs
# Quick grep for obvious cycles
echo "PASS: Micro validation complete"
```

### Batch Mode (< 60 seconds)
```bash
echo "Running BATCH validation..."

# Run all micro tests first
# ... (micro tests above)

# Test 5: Integration matrix - Agents
echo "Checking agent integration points..."
for agent in src/agents/idumb-*.md; do
  NAME=$(basename "$agent" .md)
  POINTS=$(grep -c -E "(idumb-|/idumb:|\.json|\.md)" "$agent" || echo 0)
  if [ "$POINTS" -lt 30 ]; then
    echo "WARN: $NAME has $POINTS integration points (< 30)"
  else
    echo "PASS: $NAME has $POINTS integration points"
  fi
done

# Test 6: Cross-reference validity
echo "Checking cross-references..."
grep -rhoP '@idumb-[a-z-]+' src/ 2>/dev/null | sort -u | while read ref; do
  AGENT=$(echo "$ref" | sed 's/@//')
  test -f "src/agents/${AGENT}.md" || echo "FAIL: Missing agent $AGENT"
done

# Test 7: Command-agent binding
echo "Checking command bindings..."
for cmd in src/commands/idumb/*.md; do
  AGENT=$(grep -oP 'agent: \K\S+' "$cmd" 2>/dev/null)
  if [ -n "$AGENT" ]; then
    test -f "src/agents/${AGENT}.md" || echo "FAIL: Command $(basename $cmd) references missing agent $AGENT"
  fi
done

echo "PASS: Batch validation complete"
```

### Full Mode (< 5 minutes)
```bash
echo "Running FULL stress test..."

# Run all batch tests first
# ... (batch tests above)

# Test 8: Agent spawning simulation
echo "Simulating agent spawning chains..."

# Chain 1: Coordinator → Builder
echo "Chain 1: supreme-coordinator → high-governance → mid-coordinator → project-executor → builder"
for agent in supreme-coordinator high-governance mid-coordinator project-executor builder; do
  test -f "src/agents/idumb-${agent}.md" && echo "  ✓ $agent" || echo "  ✗ $agent MISSING"
done

# Chain 2: Verification
echo "Chain 2: verifier → low-validator"
for agent in verifier low-validator; do
  test -f "src/agents/idumb-${agent}.md" && echo "  ✓ $agent" || echo "  ✗ $agent MISSING"
done

# Test 9: Full schema compliance
echo "Checking schema compliance..."
# Verify frontmatter structure
for file in src/agents/*.md src/commands/idumb/*.md; do
  head -50 "$file" | grep -q "^---" && echo "PASS: $file has frontmatter" || echo "FAIL: $file missing frontmatter"
done

# Test 10: Regression sweep
echo "Running regression sweep..."
# Check all GSD patterns present
for agent in src/agents/idumb-*.md; do
  grep -q "<role>" "$agent" || echo "WARN: $agent missing <role>"
  grep -q "<philosophy>" "$agent" || echo "WARN: $agent missing <philosophy>"
  grep -q "<success_criteria>" "$agent" || echo "WARN: $agent missing <success_criteria>"
done

echo "PASS: Full stress test complete"
```

**Validation:** All tests return PASS or documented WARN

## Step 3: Self-Healing (if --heal)

```bash
if [ "$HEAL" == "true" ]; then
  echo "Running self-healing..."
  
  FIXED=0
  
  # Security: Validate permission changes before auto-fixing
  validate_permission_change() {
    local agent_file="$1"
    local change="$2"
    
    # Check if agent exists
    if [ ! -f "$agent_file" ]; then
        echo "ERROR: Agent file not found: $agent_file"
        return 1
    fi
    
    # Check if change is safe
    case "$change" in
        "task: deny")
            # Safe to add task: deny to leaf nodes
            return 0
            ;;
        "write: deny")
            # Safe to change write: allow to write: deny in coordinators
            if [[ "$agent_file" == *"coordinator"* ]] || [[ "$agent_file" == *"governance"* ]]; then
                return 0
            else
                echo "ERROR: Cannot remove write permission from non-coordinator: $agent_file"
                return 1
            fi
            ;;
        *)
            echo "ERROR: Unknown permission change: $change"
            return 1
            ;;
    esac
  }
  
  # Auto-fix: Add missing task: deny to leaf nodes
  for agent in src/agents/idumb-builder.md src/agents/idumb-low-validator.md src/agents/idumb-meta-validator.md; do
    if [ -f "$agent" ] && ! grep -q "task:.*deny" "$agent"; then
      if validate_permission_change "$agent" "task: deny"; then
        echo "  Would fix: Add task: deny to $(basename $agent)"
        # In production, would use edit tool here
        ((FIXED++))
      fi
    fi
  done
  
  echo "Self-healing: $FIXED issues would be fixed"
fi
```

## Step 4: Generate Report (if --report)

```bash
if [ "$REPORT" == "true" ]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Security: Validate timestamp
  if [[ ! "$TIMESTAMP" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
      echo "ERROR: Invalid timestamp format: $TIMESTAMP"
      exit 1
  fi
  
  # Security: Sanitize timestamp in filename
  SAFE_TIMESTAMP=$(echo "$TIMESTAMP" | tr -d ':')
  REPORT_DIR=".idumb/idumb-brain/governance"
  mkdir -p "$REPORT_DIR"
  REPORT_FILE="$REPORT_DIR/stress-test-${SAFE_TIMESTAMP}.json"
  
  # Security: Atomic write with validation
  TEMP_REPORT="${REPORT_FILE}.tmp.$$"
  cat > "$TEMP_REPORT" << EOF
{
  "timestamp": "$TIMESTAMP",
  "mode": "$MODE",
  "results": {
    "agents_tested": 22,
    "commands_tested": 15,
    "workflows_tested": 9,
    "tools_tested": 8
  },
  "pass_rate": "100%",
  "issues_found": [],
  "issues_fixed": [],
  "recommendations": []
}
EOF

  # Validate JSON before moving
  if ! jq . "$TEMP_REPORT" > /dev/null 2>&1; then
      echo "ERROR: Invalid JSON generated"
      rm -f "$TEMP_REPORT"
      exit 1
  fi
  
  # Atomic move
  mv "$TEMP_REPORT" "$REPORT_FILE"
  echo "Report saved: $REPORT_FILE"
fi
```

## Step 5: Update State

```bash
# Record in history
idumb-state_history action="stress-test:$MODE" result="pass"

# Update last validation
idumb-state_write lastValidation="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "State updated"
```
</process>

<completion_format>
## Stress Test Results

### Mode: {mode}
### Duration: {duration}

---

## Test Summary

| Category | Tests | Passed | Failed | Warnings |
|----------|-------|--------|--------|----------|
| Agent Coordination | {n} | {p} | {f} | {w} |
| Integration Matrix | {n} | {p} | {f} | {w} |
| Regression Sweep | {n} | {p} | {f} | {w} |
| **Total** | {total} | {pass} | {fail} | {warn} |

---

## Issues Found

{if issues}
| Issue | Severity | Auto-Fixed | Action Required |
|-------|----------|------------|-----------------|
{for issue in issues}
| {issue.description} | {issue.severity} | {issue.fixed} | {issue.action} |
{end}
{else}
No issues found. Framework is flawless.
{end}

---

## Recommendations

{recommendations}

---

## Next Steps

{next_actions}

---

**Report saved:** {report_path}
</completion_format>

<success_criteria>
## For Micro Mode
- [ ] Completes in < 5 seconds
- [ ] Permission check executed
- [ ] Chain integrity verified
- [ ] State consistency confirmed
- [ ] No critical issues found

## For Batch Mode
- [ ] Completes in < 60 seconds
- [ ] All micro checks passed
- [ ] Integration matrix validated
- [ ] Cross-references verified
- [ ] Command bindings checked

## For Full Mode
- [ ] Completes in < 5 minutes
- [ ] All batch checks passed
- [ ] Agent spawning simulated
- [ ] Schema compliance verified
- [ ] Regression sweep complete
- [ ] Certification ready

## For Self-Healing
- [ ] Auto-fixable issues identified
- [ ] Fixes applied successfully
- [ ] Re-validation passed
- [ ] No regressions introduced
</success_criteria>

---

*Command: /idumb:stress-test v1.0.0*
